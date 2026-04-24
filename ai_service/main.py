import os
import json
import math
import re
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from typing import List, Optional, Tuple, Dict, Any

from models.trip import TripRequest, TripResponse, TripRouteStep, POI, Location
from db import (
    init_db,
    close_db,
    get_pois_near_station,
    get_station_exits,
    get_station_center,
)

# Average comfortable walking speed in meters per second (~4.3 km/h).
# Used to convert computed distances into realistic durations so the UI
# doesn't show "Approximately 0 hours" for a multi-stop tour.
WALKING_SPEED_MPS = 1.2


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Great-circle distance between two lat/lng points in METERS.
    Accurate enough for short urban walks where we just need a sensible
    number of meters to show in the itinerary.
    """
    R = 6371000.0  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = (
        math.sin(dphi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def _normalize_exit_label(raw: Optional[str]) -> str:
    """Extract a canonical exit_number string from things like "Exit 2", "2", "1B"."""
    if not raw:
        return ""
    s = str(raw).strip()
    # strip a leading "Exit" (case-insensitive) plus any whitespace/colon
    m = re.match(r"^\s*exit\s*[:#-]?\s*(.+)$", s, re.IGNORECASE)
    if m:
        return m.group(1).strip()
    return s


def _pick_exit_coords(
    recommended_exit: Optional[str],
    exits: List[Dict[str, Any]],
    station_center: Optional[Dict[str, Any]],
) -> Tuple[Optional[float], Optional[float], str]:
    """
    Resolve the lat/lng to start walking from.
    Tries, in order:
      1. Exact exit_number match (e.g. Gemini said "Exit 2", we find exit '2')
      2. First exit for the station
      3. Station center (when no exits exist in the DB)
    Returns (lat, lng, label).
    """
    target = _normalize_exit_label(recommended_exit).lower()
    if target:
        for e in exits:
            if str(e.get("exit_number", "")).strip().lower() == target:
                return e.get("lat"), e.get("lng"), f"Exit {e.get('exit_number')}"
    if exits:
        e = exits[0]
        return e.get("lat"), e.get("lng"), f"Exit {e.get('exit_number')}"
    if station_center:
        return (
            station_center.get("lat"),
            station_center.get("lng"),
            station_center.get("name") or "Station",
        )
    return None, None, "Station"


def _build_route_steps(
    start_lat: Optional[float],
    start_lng: Optional[float],
    start_label: str,
    pois: List[POI],
    max_total_m: Optional[int] = None,
) -> Tuple[List[TripRouteStep], List[POI]]:
    """
    Build one route_step per POI so the frontend can show a distinct walking
    distance beside each stop instead of reusing the first step's number.

    If `max_total_m` is provided, we stop adding stops once cumulative walking
    would exceed that budget — Gemini doesn't reliably obey the prompt's limit,
    so we enforce it server-side. Always keeps at least one POI so the user
    gets *something* back.
    """
    steps: List[TripRouteStep] = []
    kept: List[POI] = []
    prev_lat, prev_lng, prev_label = start_lat, start_lng, start_label
    running_total = 0

    for idx, poi in enumerate(pois):
        p_lat = poi.location.lat
        p_lng = poi.location.lng
        if (
            prev_lat is not None
            and prev_lng is not None
            and p_lat is not None
            and p_lng is not None
        ):
            dist_m = int(round(haversine_m(prev_lat, prev_lng, p_lat, p_lng)))
        else:
            dist_m = 0

        # Enforce the walking budget, but always keep the first POI so the
        # response isn't empty when every POI happens to be far away.
        if (
            max_total_m is not None
            and idx > 0
            and (running_total + dist_m) > max_total_m
        ):
            break

        duration_s = int(round(dist_m / WALKING_SPEED_MPS)) if dist_m else 0
        steps.append(
            TripRouteStep(
                instructions=f"Walk from {prev_label} to {poi.name}",
                distance=dist_m,
                duration=duration_s,
            )
        )
        kept.append(poi)
        running_total += dist_m
        prev_lat, prev_lng, prev_label = p_lat, p_lng, poi.name

    return steps, kept

app = FastAPI(title="ExitWise AI Planner Service")

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    # Using Gemini 1.5 Flash for fast, JSON-structured responses
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None
    print("WARNING: GEMINI_API_KEY not set. Reverting to mock data if called.")

@app.on_event("startup")
async def startup_event():
    await init_db()

@app.on_event("shutdown")
async def shutdown_event():
    await close_db()

@app.get("/health")
def health_check():
    return {"status": "ok", "gemini_configured": model is not None}

@app.post("/plan", response_model=TripResponse)
async def plan_trip(request: TripRequest):
    is_explorer = request.travel_mode.lower() == "explorer"

    # Fetch real POIs from the database near the destination block.
    # Respect the user's Edit Plan "Walking" knob so shrinking the limit
    # actually restricts what Gemini can suggest. We add a small cushion
    # (1.5× or +300m) because the per-POI radius is from the station
    # center, whereas the frontend cares about cumulative walking from
    # the exit — a tight filter here throws out good nearby POIs.
    user_walking_limit = max(200, int(request.max_walking_distance or 500))
    candidate_radius = max(int(user_walking_limit * 1.5), user_walking_limit + 300)
    candidates = await get_pois_near_station(
        station_id=request.end_station_id,
        max_distance=candidate_radius,
        max_budget=request.budget,
    )
    
    exits = await get_station_exits(station_id=request.end_station_id)
    station_center = await get_station_center(station_id=request.end_station_id)

    # If Gemini is not configured or we found no POIs, fallback to basic logic
    if not model or not candidates:
        return handle_fallback(request, is_explorer, candidates, exits, station_center)

    # Construct the Prompt Context
    system_instruction = """
    You are an expert local guide for the MRT system in Bangkok, Thailand. 
    Your goal is to create an exact JSON itinerary matching the user's constraints and 'travel_mode'.
    
    Available Modes:
    1. 'lazy': Provide the absolute shortest walk to exactly ONE highly-rated place (like a cafe or close restaurant).
    2. 'explorer': Provide a 2-3 stop walking tour (e.g., eat -> shop -> sightsee) utilizing more budget and walking time, but staying within the limits.
    
    Return pure JSON matching this schema:
    {
       "recommended_exit": "string (e.g., 'Exit 2')",
       "route_steps": [
          { "instructions": "string", "distance": int (meters), "duration": int (seconds) }
       ],
       "suggested_pois": [
          { "id": int, "name": "string", "category": "string", "price_level": int, "location": {"lat": float, "lng": float} }
       ],
       "estimated_total_cost": int (baht)
    }
    """

    user_prompt = f"""
    User Constraints:
    - Mode: {request.travel_mode}
    - Budget: {request.budget} Baht
    - Max Walking Distance: {request.max_walking_distance} meters
    
    Available Station Exits:
    {json.dumps(exits, indent=2)}

    Available Nearby POIs (only suggest from this list!):
    {json.dumps(candidates, indent=2)}
    
    Generate the JSON itinerary according to the schema. 
    Ensure total distance across route_steps <= max walking distance.
    Ensure estimated_total_cost <= budget.
    Return ONLY valid JSON.
    """

    try:
        response = model.generate_content(
            system_instruction + "\n\n" + user_prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        
        # Parse the JSON response
        data = json.loads(response.text)

        # Validate and return via Pydantic
        trip = TripResponse(**data)

        # Gemini is unreliable about emitting one route_step per POI with
        # accurate per-segment distances — it often returns a single step or
        # copies the same distance across every leg. Recompute deterministically
        # from coordinates so the UI shows real meters beside each stop, and
        # trim the itinerary to fit the walking budget Gemini was told about.
        start_lat, start_lng, start_label = _pick_exit_coords(
            trip.recommended_exit, exits, station_center
        )
        computed_steps, kept_pois = _build_route_steps(
            start_lat,
            start_lng,
            start_label,
            trip.suggested_pois,
            max_total_m=user_walking_limit,
        )
        if computed_steps:
            trip.route_steps = computed_steps
            trip.suggested_pois = kept_pois
        # Canonicalise the recommended_exit string so the UI never shows
        # "Exit Exit 2" — store just the bare exit number/label.
        trip.recommended_exit = _normalize_exit_label(trip.recommended_exit) or (
            start_label.replace("Exit ", "") if start_label.startswith("Exit ") else start_label
        )

        return trip

    except Exception as e:
        print(f"Gemini API Error: {e}")
        # Graceful fallback if AI fails
        return handle_fallback(request, is_explorer, candidates, exits, station_center)


def handle_fallback(
    request: TripRequest,
    is_explorer: bool,
    candidates: List[dict],
    exits: Optional[List[Dict[str, Any]]] = None,
    station_center: Optional[Dict[str, Any]] = None,
):
    """
    Fallback if Gemini fails or is unconfigured. Builds a basic itinerary
    from the DB candidates and computes real walking distances via Haversine
    so the UI never shows the old hardcoded "200 m / 0 hours" placeholder.
    """
    if not candidates:
        candidates = [
            {
                "id": 1,
                "name": "Closest Cafe",
                "category": "cafe",
                "price_level": 2,
                "lat": 13.7563,
                "lng": 100.5018,
            }
        ]

    suggested_pois: List[POI] = []
    if is_explorer and len(candidates) > 1:
        # Take up to 3 for explorer
        for c in candidates[:3]:
            suggested_pois.append(
                POI(
                    id=c["id"],
                    name=c["name"],
                    category=c["category"],
                    price_level=c.get("price_level", 1),
                    location=Location(lat=c["lat"], lng=c["lng"]),
                )
            )
    else:
        # Take just 1 for lazy
        c = candidates[0]
        suggested_pois.append(
            POI(
                id=c["id"],
                name=c["name"],
                category=c["category"],
                price_level=c.get("price_level", 1),
                location=Location(lat=c["lat"], lng=c["lng"]),
            )
        )

    # Pick a sensible starting exit. If the DB has no exits for this station,
    # _pick_exit_coords falls back to the station center.
    exits = exits or []
    start_lat, start_lng, start_label = _pick_exit_coords(
        None, exits, station_center
    )

    # Default recommended_exit label for the response. If we used an exit,
    # surface its exit_number; otherwise leave a generic label.
    recommended_exit = start_label if exits or station_center else "Exit 1"

    user_walking_limit = max(200, int(request.max_walking_distance or 500))
    route_steps, kept_pois = _build_route_steps(
        start_lat,
        start_lng,
        start_label,
        suggested_pois,
        max_total_m=user_walking_limit,
    )
    if kept_pois:
        suggested_pois = kept_pois
    if not route_steps:
        # Absolute last-resort placeholder (shouldn't happen since we always
        # have at least one POI by this point).
        route_steps = [
            TripRouteStep(
                instructions="Walk to " + suggested_pois[0].name,
                distance=0,
                duration=0,
            )
        ]

    # Strip any leading "Exit " so the UI doesn't render "Exit Exit 2".
    recommended_exit = _normalize_exit_label(recommended_exit) or "1"

    return TripResponse(
        recommended_exit=recommended_exit,
        route_steps=route_steps,
        suggested_pois=suggested_pois,
        estimated_total_cost=request.budget // 2,
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

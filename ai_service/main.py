from fastapi import FastAPI
from models.trip import TripRequest, TripResponse, TripRouteStep, POI, Location

app = FastAPI(title="ExitWise AI Planner Service")

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/plan", response_model=TripResponse)
def plan_trip(request: TripRequest):
    # Determine behavior based on Travel Mode
    is_explorer = request.travel_mode.lower() == "explorer"

    # Mock POI data based on mode
    suggested_pois = []
    if is_explorer:
        suggested_pois = [
            POI(id=1, name="Coffee Club", category="cafe", price_level=2, location=Location(lat=13.7563, lng=100.5018)),
            POI(id=2, name="Boat Noodles", category="restaurant", price_level=1, location=Location(lat=13.7565, lng=100.5020)),
            POI(id=3, name="Local Market", category="attraction", price_level=1, location=Location(lat=13.7570, lng=100.5030)),
        ]
    else:
        # Lazy mode picks the single best/closest spot
        suggested_pois = [
            POI(id=1, name="Closest Cafe", category="cafe", price_level=2, location=Location(lat=13.7563, lng=100.5018))
        ]

    # Generate route steps based on mode
    route_steps = [TripRouteStep(instructions="Walk 200m from Exit 3", distance=200, duration=150)]
    if is_explorer:
        route_steps.append(TripRouteStep(instructions="Continue 500m to the market", distance=500, duration=400))

    return TripResponse(
        recommended_exit="Exit 3 if lazy, Exit 1 if explorer",
        route_steps=route_steps,
        suggested_pois=suggested_pois,
        estimated_total_cost=request.budget // 2
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

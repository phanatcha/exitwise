from pydantic import BaseModel
from typing import List, Optional

class Location(BaseModel):
    lat: float
    lng: float

class POI(BaseModel):
    id: int
    name: str
    category: str
    price_level: Optional[int] = None
    location: Location

class TripRequest(BaseModel):
    user_id: int
    start_station_id: int
    end_station_id: int
    budget: int
    max_walking_distance: int
    travel_mode: str = "lazy" # Can be "lazy" or "explorer"

class TripRouteStep(BaseModel):
    instructions: str
    distance: int
    duration: int

class TripResponse(BaseModel):
    recommended_exit: str
    route_steps: List[TripRouteStep]
    suggested_pois: List[POI]
    estimated_total_cost: int

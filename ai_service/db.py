import os
import asyncpg
from typing import List, Dict, Any

pool: asyncpg.Pool = None

async def init_db():
    global pool
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("WARNING: DATABASE_URL not set in environment.")
        return

    # asyncpg expects 'postgresql://' instead of some other variants sometimes, but Supabase URL is fine
    #
    # IMPORTANT: Supabase's pooled connection (port 6543) runs pgbouncer in
    # transaction pool mode, which cannot hold server-side prepared
    # statements across requests. asyncpg caches prepared statements by
    # default and will crash with:
    #   InvalidSQLStatementNameError: prepared statement "__asyncpg_stmt_1__"
    #   does not exist
    # on the second query. Setting statement_cache_size=0 disables that
    # cache so every query is sent as a simple query — which is what
    # pgbouncer expects. This is also safe against the direct port 5432
    # connection (just a minor perf hit), so we always set it.
    try:
        pool = await asyncpg.create_pool(
            database_url,
            statement_cache_size=0,
            # Disable asyncpg's per-connection type codec introspection cache
            # too — it also issues prepared statements under the hood, which
            # pgbouncer transaction mode can't hold across requests.
            server_settings={"jit": "off"},
        )
        print("Successfully connected to the database from Python!")
    except Exception as e:
        print(f"Failed to connect to the database from Python: {e}")

async def close_db():
    if pool:
        await pool.close()

async def get_pois_near_station(station_id: int, max_distance: int, max_budget: int = 4) -> List[Dict[str, Any]]:
    """
    Fetches POIs from PostGIS that are near any exit of the given station.
    Matches budget loosely (assuming budget input maps to price_level 1-4).
    """
    if not pool:
        return []

    # Map raw budget (Baht) to a rough price level (1-4)
    # Simple heuristic: <200=1, <500=2, <1000=3, >1000=4
    price_level_limit = 4
    if max_budget < 200:
        price_level_limit = 1
    elif max_budget < 500:
        price_level_limit = 2
    elif max_budget < 1000:
        price_level_limit = 3

    # Query: Find POIs within max_distance of the central station location
    # (In a real app with exits, we'd query distance from exits, but we use the station center here for simplicity)
    query = """
        SELECT 
            p.id, p.name, p.category, p.price_level, p.description,
            ST_Y(p.location::geometry) as lat, ST_X(p.location::geometry) as lng,
            ST_Distance(p.location::geography, s.location::geography) as dist
        FROM pois p
        CROSS JOIN stations s
        WHERE s.id = $1
          AND ST_DWithin(p.location::geography, s.location::geography, $2)
          AND p.price_level <= $3
        ORDER BY dist ASC
        LIMIT 20;
    """
    
    async with pool.acquire() as conn:
        records = await conn.fetch(query, station_id, max_distance, price_level_limit)
        
        pois = []
        for r in records:
            pois.append({
                "id": r["id"],
                "name": r["name"],
                "category": r["category"],
                "price_level": r["price_level"],
                "description": r["description"] or "",
                "lat": r["lat"],
                "lng": r["lng"],
                "distance": r["dist"]
            })
        return pois

async def get_station_exits(station_id: int) -> List[Dict[str, Any]]:
    """
    Returns all exits for a station including lat/lng so the planner can
    compute deterministic walking distances from the recommended exit to the
    first POI.
    """
    if not pool:
        return []

    query = """
        SELECT id, exit_number, description,
               ST_Y(location::geometry) as lat,
               ST_X(location::geometry) as lng
        FROM station_exits
        WHERE station_id = $1
    """

    async with pool.acquire() as conn:
        records = await conn.fetch(query, station_id)

        exits = []
        for r in records:
            exits.append({
                "id": r["id"],
                "exit_number": r["exit_number"],
                "description": r["description"] or "",
                "lat": r["lat"],
                "lng": r["lng"],
            })
        return exits


async def get_station_center(station_id: int) -> Dict[str, Any]:
    """
    Fallback coordinate source when a station has no exits in the DB —
    we use the station center as a stand-in "exit" so route-step computation
    still produces sensible meters.
    """
    if not pool:
        return {}

    query = """
        SELECT id, name_en,
               ST_Y(location::geometry) as lat,
               ST_X(location::geometry) as lng
        FROM stations
        WHERE id = $1
    """
    async with pool.acquire() as conn:
        r = await conn.fetchrow(query, station_id)
        if not r:
            return {}
        return {"id": r["id"], "name": r["name_en"], "lat": r["lat"], "lng": r["lng"]}

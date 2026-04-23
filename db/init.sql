-- ============================================================================
-- ExitWise — initial schema (reflects migrations 001 + 002 + 003).
-- Safe to run against a fresh Postgres/PostGIS database. Idempotent.
-- The auth switchover (migrate_004) is NOT included here — it intentionally
-- lives in its own migration so it can be reviewed and triggered explicitly.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- ----------------------------------------------------------------------------
-- Lookup: transit lines
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lines (
    id         SERIAL PRIMARY KEY,
    code       VARCHAR(30) UNIQUE NOT NULL,
    name_en    VARCHAR(80) NOT NULL,
    name_th    VARCHAR(80),
    operator   VARCHAR(40),
    color      CHAR(7) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- Lookup: POI categories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS poi_categories (
    slug      VARCHAR(30) PRIMARY KEY,
    label_en  VARCHAR(60) NOT NULL,
    label_th  VARCHAR(60),
    icon_name VARCHAR(40) NOT NULL
);

-- ----------------------------------------------------------------------------
-- Users
--   NOTE: `username` and `password_hash` are kept here for backward
--   compatibility only — they are removed in migrate_004 when we switch to
--   Supabase Auth. Don't rely on them in new code.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id                     SERIAL PRIMARY KEY,
    username               VARCHAR(50) UNIQUE,        -- deprecated, see migrate_004
    email                  VARCHAR(255) UNIQUE NOT NULL,
    password_hash          TEXT,                      -- deprecated, see migrate_004
    display_name           VARCHAR(60),
    avatar_url             TEXT,
    absolute_walking_limit INTEGER DEFAULT 500
        CHECK (absolute_walking_limit IS NULL OR absolute_walking_limit BETWEEN 0 AND 2000),
    budget_range           INTEGER DEFAULT 150,
    budget_currency        CHAR(3) DEFAULT 'THB',
    preferred_travel_mode  VARCHAR(20) DEFAULT 'lazy'
        CHECK (preferred_travel_mode IS NULL OR preferred_travel_mode IN ('lazy','explorer')),
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- Stations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stations (
    id       SERIAL PRIMARY KEY,
    name_en  VARCHAR(100) NOT NULL,
    name_th  VARCHAR(100),
    line     VARCHAR(50) NOT NULL,    -- legacy free-text; keep until fully migrated to line_id
    line_id  INTEGER REFERENCES lines(id),
    location GEOMETRY(Point, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stations_location ON stations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_stations_line_id  ON stations(line_id);

-- ----------------------------------------------------------------------------
-- Station exits
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS station_exits (
    id            SERIAL PRIMARY KEY,
    station_id    INTEGER REFERENCES stations(id) ON DELETE CASCADE,
    exit_number   VARCHAR(10),
    description   TEXT,
    landmark_hint TEXT,
    has_escalator BOOLEAN DEFAULT false,
    has_elevator  BOOLEAN DEFAULT false,
    is_accessible BOOLEAN DEFAULT false,
    location      GEOMETRY(Point, 4326) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_station_exits_location    ON station_exits USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_station_exits_station_id  ON station_exits(station_id);

-- ----------------------------------------------------------------------------
-- POIs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pois (
    id               SERIAL PRIMARY KEY,
    name             VARCHAR(255) NOT NULL,
    category         VARCHAR(50),                -- legacy free-text, kept for backfill
    category_slug    VARCHAR(30) REFERENCES poi_categories(slug),
    price_level      INTEGER,
    location         GEOMETRY(Point, 4326) NOT NULL,
    description      TEXT,
    operating_hours  JSONB,
    timezone         VARCHAR(40) DEFAULT 'Asia/Bangkok',
    rating           DOUBLE PRECISION,
    rating_count     INTEGER DEFAULT 0 CHECK (rating_count >= 0),
    image_url        TEXT,
    google_place_id  TEXT
);
CREATE INDEX IF NOT EXISTS idx_pois_location      ON pois USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_pois_category_slug ON pois(category_slug);

-- ----------------------------------------------------------------------------
-- Precomputed exit ↔ POI walking distances
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS poi_exit_distances (
    poi_id             INTEGER NOT NULL REFERENCES pois(id) ON DELETE CASCADE,
    station_exit_id    INTEGER NOT NULL REFERENCES station_exits(id) ON DELETE CASCADE,
    walking_distance_m INTEGER NOT NULL CHECK (walking_distance_m >= 0),
    computed_at        TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (poi_id, station_exit_id)
);
CREATE INDEX IF NOT EXISTS idx_poi_exit_distances_exit
    ON poi_exit_distances(station_exit_id, walking_distance_m);

-- ----------------------------------------------------------------------------
-- Trips (saved itineraries)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trips (
    id                     SERIAL PRIMARY KEY,
    user_id                INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title                  VARCHAR(120),
    destination_poi_id     INTEGER REFERENCES pois(id) ON DELETE SET NULL,
    start_station_exit_id  INTEGER REFERENCES station_exits(id) ON DELETE SET NULL,
    recommended_exit       VARCHAR(50),
    walking_limit_m        INTEGER
        CHECK (walking_limit_m IS NULL OR walking_limit_m BETWEEN 0 AND 2000),
    budget_baht            INTEGER CHECK (budget_baht IS NULL OR budget_baht >= 0),
    estimated_total_cost   INTEGER,
    total_walking_m        INTEGER CHECK (total_walking_m IS NULL OR total_walking_m >= 0),
    estimated_duration_min INTEGER CHECK (estimated_duration_min IS NULL OR estimated_duration_min >= 0),
    num_stops              SMALLINT CHECK (num_stops IS NULL OR num_stops >= 0),
    travel_mode            VARCHAR(20)
        CHECK (travel_mode IS NULL OR travel_mode IN ('lazy','explorer')),
    itinerary_data         JSONB NOT NULL,
    thumbnail_url          TEXT,
    is_favorite            BOOLEAN DEFAULT false,
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_trips_user_id                ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_destination_poi        ON trips(destination_poi_id);
CREATE INDEX IF NOT EXISTS idx_trips_start_station_exit_id  ON trips(start_station_exit_id);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trips_set_updated_at ON trips;
CREATE TRIGGER trips_set_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- Trip stops (ordered legs of an itinerary)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trip_stops (
    id                     SERIAL PRIMARY KEY,
    trip_id                INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    order_index            SMALLINT NOT NULL CHECK (order_index >= 0),
    poi_id                 INTEGER REFERENCES pois(id) ON DELETE SET NULL,
    stop_label             VARCHAR(120) NOT NULL,
    distance_from_prev_m   INTEGER CHECK (distance_from_prev_m IS NULL OR distance_from_prev_m >= 0),
    notes                  TEXT,
    created_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (trip_id, order_index)
);
CREATE INDEX IF NOT EXISTS idx_trip_stops_trip_id ON trip_stops(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_stops_poi_id  ON trip_stops(poi_id);

-- ----------------------------------------------------------------------------
-- Saved POIs (user bookmarks)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_pois (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    poi_id     INTEGER NOT NULL REFERENCES pois(id)  ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, poi_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_pois_user   ON saved_pois(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_pois_poi_id ON saved_pois(poi_id);

-- ----------------------------------------------------------------------------
-- RLS defaults (matching production).
--   Public read on pois/stations/station_exits/lines/poi_categories.
--   Owner-scoped tables (users/trips/trip_stops/saved_pois) are RLS-enabled
--   but get their policies in migrate_004 when users.id becomes a UUID FK to
--   auth.users(id). Until then, access only from the service role.
-- ----------------------------------------------------------------------------
ALTER TABLE users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE stations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE station_exits      ENABLE ROW LEVEL SECURITY;
ALTER TABLE pois               ENABLE ROW LEVEL SECURITY;
ALTER TABLE lines              ENABLE ROW LEVEL SECURITY;
ALTER TABLE poi_categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE poi_exit_distances ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips              ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_stops         ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_pois         ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pois_public_read"               ON pois;
CREATE POLICY "pois_public_read"               ON pois               FOR SELECT USING (true);
DROP POLICY IF EXISTS "stations_public_read"           ON stations;
CREATE POLICY "stations_public_read"           ON stations           FOR SELECT USING (true);
DROP POLICY IF EXISTS "station_exits_public_read"      ON station_exits;
CREATE POLICY "station_exits_public_read"      ON station_exits      FOR SELECT USING (true);
DROP POLICY IF EXISTS "lines_public_read"              ON lines;
CREATE POLICY "lines_public_read"              ON lines              FOR SELECT USING (true);
DROP POLICY IF EXISTS "poi_categories_public_read"     ON poi_categories;
CREATE POLICY "poi_categories_public_read"     ON poi_categories     FOR SELECT USING (true);
DROP POLICY IF EXISTS "poi_exit_distances_public_read" ON poi_exit_distances;
CREATE POLICY "poi_exit_distances_public_read" ON poi_exit_distances FOR SELECT USING (true);

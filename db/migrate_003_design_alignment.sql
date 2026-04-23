-- ============================================================================
-- Migration 003 — Design alignment (safe, additive)
-- ----------------------------------------------------------------------------
-- Brings the Supabase schema in line with the Figma design (Landing, Sign Up,
-- Onboarding Q1/Q2, Home Lines, POI detail, AI Trip Planner, Save Trip Plan,
-- Profile/Settings).
--
-- Nothing in this file is destructive:
--   • New lookup tables (lines, poi_categories) with seed data
--   • New relational tables (trip_stops, saved_pois, poi_exit_distances)
--   • Additive ALTER TABLE ... ADD COLUMN on users / stations / station_exits
--     / pois / trips
--   • CHECK constraints that hold for current data
--   • Backfills from existing free-text columns into new FKs
--   • RLS enabled on all new tables with public-read where appropriate
--
-- The auth switchover (drop users.username, convert users.id to UUID against
-- auth.users) is intentionally NOT in this file — see migrate_004_supabase_auth.sql.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Transit lines lookup
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lines (
    id         SERIAL PRIMARY KEY,
    code       VARCHAR(30) UNIQUE NOT NULL,
    name_en    VARCHAR(80) NOT NULL,
    name_th    VARCHAR(80),
    operator   VARCHAR(40),
    color      CHAR(7) NOT NULL,                -- hex, e.g. '#1E4FA5'
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ExitWise currently only supports the MRT Blue Line. Add other lines here
-- when the app scope expands.
INSERT INTO lines (code, name_en, name_th, operator, color) VALUES
    ('MRT_BLUE',       'MRT Blue Line',        'สายสีน้ำเงิน',    'BEM',  '#1E4FA5')
ON CONFLICT (code) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 2. stations.line_id  (FK to lines; keep stations.line temporarily)
-- ----------------------------------------------------------------------------
ALTER TABLE stations
    ADD COLUMN IF NOT EXISTS line_id INTEGER REFERENCES lines(id);

CREATE INDEX IF NOT EXISTS idx_stations_line_id ON stations(line_id);

-- Backfill from the existing free-text 'line' column.
-- Only MRT Blue is in scope right now; extend this block if/when more lines
-- are added to the `lines` seed above.
UPDATE stations s
   SET line_id = l.id
  FROM lines l
 WHERE s.line_id IS NULL
   AND s.line ILIKE 'MRT Blue%'
   AND l.code = 'MRT_BLUE';

-- ----------------------------------------------------------------------------
-- 3. station_exits structural / accessibility fields
-- ----------------------------------------------------------------------------
ALTER TABLE station_exits
    ADD COLUMN IF NOT EXISTS has_escalator BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS has_elevator  BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_accessible BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS landmark_hint TEXT;

-- ----------------------------------------------------------------------------
-- 4. POI categories lookup
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS poi_categories (
    slug      VARCHAR(30) PRIMARY KEY,
    label_en  VARCHAR(60) NOT NULL,
    label_th  VARCHAR(60),
    icon_name VARCHAR(40) NOT NULL       -- e.g. 'mdi:shopping'
);

INSERT INTO poi_categories (slug, label_en, label_th, icon_name) VALUES
    ('shopping_mall', 'Shopping mall', 'ห้างสรรพสินค้า',   'mdi:shopping'),
    ('cafe',          'Café',          'คาเฟ่',           'mdi:coffee'),
    ('restaurant',    'Restaurant',    'ร้านอาหาร',        'mdi:silverware-fork-knife'),
    ('culinary',      'Culinary',      'อาหาร',            'mdi:food'),
    ('heritage',      'Heritage',      'มรดก',            'mdi:bank'),
    ('night_market',  'Night Market',  'ตลาดกลางคืน',      'mdi:storefront'),
    ('retail',        'Retail',        'ร้านค้า',          'mdi:store'),
    ('park',          'Park',          'สวน',             'mdi:tree'),
    ('sight',         'Sight',         'สถานที่ท่องเที่ยว',  'mdi:camera'),
    ('transit',       'Transit',       'คมนาคม',          'mdi:train')
ON CONFLICT (slug) DO NOTHING;

-- ----------------------------------------------------------------------------
-- 5. pois: rating_count, category_slug, timezone
-- ----------------------------------------------------------------------------
ALTER TABLE pois
    ADD COLUMN IF NOT EXISTS rating_count   INTEGER DEFAULT 0
        CHECK (rating_count >= 0),
    ADD COLUMN IF NOT EXISTS category_slug  VARCHAR(30) REFERENCES poi_categories(slug),
    ADD COLUMN IF NOT EXISTS timezone       VARCHAR(40) DEFAULT 'Asia/Bangkok';

CREATE INDEX IF NOT EXISTS idx_pois_category_slug ON pois(category_slug);

-- Backfill category_slug from existing free-text 'category'.
UPDATE pois
   SET category_slug = 'culinary'     WHERE category_slug IS NULL AND category ILIKE 'Culinary%';
UPDATE pois
   SET category_slug = 'heritage'     WHERE category_slug IS NULL AND category ILIKE 'Heritage%';
UPDATE pois
   SET category_slug = 'night_market' WHERE category_slug IS NULL AND category ILIKE 'Night Market%';
UPDATE pois
   SET category_slug = 'retail'       WHERE category_slug IS NULL AND category ILIKE 'Retail%';

-- ----------------------------------------------------------------------------
-- 6. Precomputed exit ↔ POI walking distances
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
-- 7. users: avatar, display name, currency, CHECKs on limit & travel mode
-- ----------------------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS avatar_url      TEXT,
    ADD COLUMN IF NOT EXISTS display_name    VARCHAR(60),
    ADD COLUMN IF NOT EXISTS budget_currency CHAR(3) DEFAULT 'THB';

-- Bound the walking limit to the slider range in the onboarding design (0-2000 m).
ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_walking_limit_check;
ALTER TABLE users
    ADD  CONSTRAINT users_walking_limit_check
    CHECK (absolute_walking_limit IS NULL
        OR (absolute_walking_limit BETWEEN 0 AND 2000));

-- Travel mode is exactly Lazy or Explorer in the Profile/Settings design.
ALTER TABLE users
    DROP CONSTRAINT IF EXISTS users_preferred_travel_mode_check;
ALTER TABLE users
    ADD  CONSTRAINT users_preferred_travel_mode_check
    CHECK (preferred_travel_mode IS NULL
        OR preferred_travel_mode IN ('lazy','explorer'));

-- ----------------------------------------------------------------------------
-- 8. trips: title, per-trip snapshots, summary scalars, favorite, updated_at
-- ----------------------------------------------------------------------------
ALTER TABLE trips
    ADD COLUMN IF NOT EXISTS title                  VARCHAR(120),
    ADD COLUMN IF NOT EXISTS destination_poi_id     INTEGER REFERENCES pois(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS walking_limit_m        INTEGER
        CHECK (walking_limit_m IS NULL OR walking_limit_m BETWEEN 0 AND 2000),
    ADD COLUMN IF NOT EXISTS budget_baht            INTEGER
        CHECK (budget_baht IS NULL OR budget_baht >= 0),
    ADD COLUMN IF NOT EXISTS total_walking_m        INTEGER
        CHECK (total_walking_m IS NULL OR total_walking_m >= 0),
    ADD COLUMN IF NOT EXISTS estimated_duration_min INTEGER
        CHECK (estimated_duration_min IS NULL OR estimated_duration_min >= 0),
    ADD COLUMN IF NOT EXISTS num_stops              SMALLINT
        CHECK (num_stops IS NULL OR num_stops >= 0),
    ADD COLUMN IF NOT EXISTS thumbnail_url          TEXT,
    ADD COLUMN IF NOT EXISTS is_favorite            BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS updated_at             TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE trips
    DROP CONSTRAINT IF EXISTS trips_travel_mode_check;
ALTER TABLE trips
    ADD  CONSTRAINT trips_travel_mode_check
    CHECK (travel_mode IS NULL OR travel_mode IN ('lazy','explorer'));

CREATE INDEX IF NOT EXISTS idx_trips_user_id         ON trips(user_id);
CREATE INDEX IF NOT EXISTS idx_trips_destination_poi ON trips(destination_poi_id);

-- Keep updated_at fresh automatically.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trips_set_updated_at ON trips;
CREATE TRIGGER trips_set_updated_at
    BEFORE UPDATE ON trips
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ----------------------------------------------------------------------------
-- 9. trip_stops (per-stop row, replaces having to parse itinerary_data JSONB)
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

-- ----------------------------------------------------------------------------
-- 10. saved_pois (user bookmarks)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_pois (
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    poi_id     INTEGER NOT NULL REFERENCES pois(id)  ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, poi_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_pois_user ON saved_pois(user_id);

-- ----------------------------------------------------------------------------
-- 11. RLS on new tables
-- ----------------------------------------------------------------------------
-- Public lookup tables: everyone can read; writes locked to service role.
ALTER TABLE lines             ENABLE ROW LEVEL SECURITY;
ALTER TABLE poi_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE poi_exit_distances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lines_public_read"             ON lines;
CREATE POLICY "lines_public_read"             ON lines
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "poi_categories_public_read"    ON poi_categories;
CREATE POLICY "poi_categories_public_read"    ON poi_categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "poi_exit_distances_public_read" ON poi_exit_distances;
CREATE POLICY "poi_exit_distances_public_read" ON poi_exit_distances
    FOR SELECT USING (true);

-- Owner-scoped tables: RLS on with NO policies yet. This denies all access
-- from anon/authenticated until migrate_004 switches users.id to auth.uid()
-- and we can write correct policies. Service role still bypasses RLS.
ALTER TABLE trip_stops  ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_pois  ENABLE ROW LEVEL SECURITY;

COMMIT;

-- Sanity checks — run these manually to verify the migration landed cleanly:
--   SELECT line_id, COUNT(*) FROM stations       GROUP BY line_id;
--   SELECT category_slug, COUNT(*) FROM pois     GROUP BY category_slug;
--   SELECT COUNT(*) FROM lines;          -- expect 10
--   SELECT COUNT(*) FROM poi_categories; -- expect 10

-- ============================================================================
-- Migration 004 — Switch users.id to UUID backed by Supabase Auth
-- ----------------------------------------------------------------------------
-- ⚠️ DESTRUCTIVE — do NOT run without reading the whole file.
--
-- This migration:
--   1. Adds users.auth_user_id UUID referencing auth.users(id).
--   2. Requires every existing public.users row to be reconciled with an
--      auth.users row before proceeding (see "RECONCILIATION" section below).
--   3. Drops users.username and users.password_hash.
--   4. Changes users primary key to auth_user_id UUID (dropping the old SERIAL
--      id) and rewires trips.user_id + saved_pois.user_id to the new UUID PK.
--   5. Installs correct RLS policies on users, trips, trip_stops, saved_pois
--      using auth.uid().
--
-- Run order:
--   * Create matching auth.users rows for each existing public.users row
--     (via Supabase Auth admin API or Studio). Capture the mapping in the
--     `users_id_migration` staging table created at the top of this script.
--   * Review the staging table.
--   * Execute the rest of the script.
--
-- After this, any backend code that used public.users.id (integer) must be
-- updated to use UUIDs.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Staging table mapping old integer ids → new auth UUIDs.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users_id_migration (
    old_int_id  INTEGER PRIMARY KEY,
    new_uuid    UUID NOT NULL UNIQUE,
    email       VARCHAR(255) NOT NULL,
    migrated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (do this BEFORE running the rest):
--   1. For each row in public.users, invite or create a user in Supabase Auth
--      with the same email.
--   2. Insert a row into users_id_migration linking the new auth UUID to the
--      old integer id.
--
-- Example:
--   INSERT INTO users_id_migration (old_int_id, new_uuid, email)
--   VALUES (1, '00000000-0000-0000-0000-000000000001', 'a@example.com');

-- ----------------------------------------------------------------------------
-- 1. Pre-flight: refuse to continue unless every public.users row is mapped.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
    missing INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing
      FROM users u
      LEFT JOIN users_id_migration m ON m.old_int_id = u.id
     WHERE m.old_int_id IS NULL;
    IF missing > 0 THEN
        RAISE EXCEPTION
          'migrate_004 aborted: % public.users rows are not mapped in users_id_migration',
          missing;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Add auth_user_id column and backfill it.
-- ----------------------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS auth_user_id UUID;

UPDATE users u
   SET auth_user_id = m.new_uuid
  FROM users_id_migration m
 WHERE u.id = m.old_int_id
   AND u.auth_user_id IS NULL;

ALTER TABLE users
    ALTER COLUMN auth_user_id SET NOT NULL,
    ADD CONSTRAINT users_auth_user_fk
        FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    ADD CONSTRAINT users_auth_user_unique UNIQUE (auth_user_id);

-- ----------------------------------------------------------------------------
-- 3. Rewire child FKs (trips.user_id, saved_pois.user_id) from INTEGER → UUID.
-- ----------------------------------------------------------------------------
ALTER TABLE trips
    ADD COLUMN IF NOT EXISTS user_uuid UUID;

UPDATE trips t
   SET user_uuid = m.new_uuid
  FROM users_id_migration m
 WHERE t.user_id = m.old_int_id
   AND t.user_uuid IS NULL;

ALTER TABLE trips
    DROP CONSTRAINT IF EXISTS trips_user_id_fkey;
ALTER TABLE trips
    DROP COLUMN user_id;
ALTER TABLE trips
    RENAME COLUMN user_uuid TO user_id;
ALTER TABLE trips
    ADD CONSTRAINT trips_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON trips(user_id);

ALTER TABLE saved_pois
    ADD COLUMN IF NOT EXISTS user_uuid UUID;

UPDATE saved_pois sp
   SET user_uuid = m.new_uuid
  FROM users_id_migration m
 WHERE sp.user_id = m.old_int_id
   AND sp.user_uuid IS NULL;

ALTER TABLE saved_pois
    DROP CONSTRAINT IF EXISTS saved_pois_user_id_fkey;
ALTER TABLE saved_pois
    DROP COLUMN user_id;
ALTER TABLE saved_pois
    RENAME COLUMN user_uuid TO user_id;
ALTER TABLE saved_pois
    ADD CONSTRAINT saved_pois_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    ADD PRIMARY KEY (user_id, poi_id);
CREATE INDEX IF NOT EXISTS idx_saved_pois_user ON saved_pois(user_id);

-- ----------------------------------------------------------------------------
-- 4. Repoint users primary key from SERIAL id → auth_user_id UUID.
-- ----------------------------------------------------------------------------
ALTER TABLE users DROP CONSTRAINT users_pkey;
ALTER TABLE users DROP COLUMN id;
ALTER TABLE users RENAME COLUMN auth_user_id TO id;
ALTER TABLE users ADD PRIMARY KEY (id);

-- Drop legacy auth artefacts now that Supabase Auth owns them.
ALTER TABLE users DROP COLUMN IF EXISTS username;
ALTER TABLE users DROP COLUMN IF EXISTS password_hash;

-- ----------------------------------------------------------------------------
-- 5. RLS — replace blanket blocks with owner-scoped policies.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Block Public API Access to Users" ON users;
DROP POLICY IF EXISTS "Block Public API Access to Trips" ON trips;

CREATE POLICY "users_self_select" ON users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_self_update" ON users
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_self_insert" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "trips_owner_all" ON trips
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "trip_stops_owner_all" ON trip_stops
    FOR ALL USING (
        EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_stops.trip_id AND t.user_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM trips t WHERE t.id = trip_stops.trip_id AND t.user_id = auth.uid())
    );

CREATE POLICY "saved_pois_owner_all" ON saved_pois
    FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 6. Optional: drop the staging table once you've verified everything.
-- ----------------------------------------------------------------------------
-- DROP TABLE users_id_migration;

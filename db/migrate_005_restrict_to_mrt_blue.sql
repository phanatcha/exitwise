-- ============================================================================
-- Migration 005 — Restrict `lines` to MRT Blue only (current app scope)
-- ----------------------------------------------------------------------------
-- ExitWise currently only supports the MRT Blue Line. Migration 003 initially
-- seeded 10 transit lines (MRT Blue/Purple/Yellow/Pink, BTS Sukhumvit/Silom/
-- Gold, ARL, SRT Dark/Light Red); this migration removes everything except
-- MRT_BLUE so the lookup table accurately reflects what the app supports.
--
-- Pre-flight: abort if any station references a non-MRT_BLUE line. (Stations
-- only reference MRT_BLUE at the time this was authored, but the guard keeps
-- the migration honest if re-run against a wider seed later.)
--
-- To re-widen scope later: re-insert the relevant rows into `lines` and extend
-- the station backfill block in migrate_003_design_alignment.sql.
-- ============================================================================

DO $$
DECLARE
    orphan_stations INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphan_stations
      FROM stations s
      JOIN lines l ON l.id = s.line_id
     WHERE l.code <> 'MRT_BLUE';
    IF orphan_stations > 0 THEN
        RAISE EXCEPTION
          'migrate_005 aborted: % stations reference non-MRT_BLUE lines',
          orphan_stations;
    END IF;
END $$;

DELETE FROM lines WHERE code <> 'MRT_BLUE';

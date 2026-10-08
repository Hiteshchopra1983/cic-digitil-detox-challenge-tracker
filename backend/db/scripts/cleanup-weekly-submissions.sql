-- Weekly data cleanup for production (run in psql on `detox` database).
-- Always run PREVIEW blocks first, then DELETE inside BEGIN/COMMIT.
-- Adjust the cutoff date/year if needed.

-- =============================================================================
-- 1) PREVIEW: what is currently counted in admin graphs
--    (challenge participants + real weekly submissions only)
-- =============================================================================

SELECT COUNT(*) AS program_weekly_rows_in_graphs
FROM weekly_progress wp
INNER JOIN participants p ON p.id = wp.participant_id AND p.role = 'participant'
WHERE COALESCE(wp.counts_as_weekly_submission, true) = true;

-- Exact rows feeding Admin Dashboard + Leaderboard (names, weeks, dates)
SELECT
  p.name,
  p.email,
  wp.id AS weekly_id,
  wp.week_number,
  wp.created_at,
  wp.gb_deleted,
  wp.downloads_avoided_gb,
  wp.screen_time_change,
  wp.streaming_reduction_minutes
FROM weekly_progress wp
INNER JOIN participants p ON p.id = wp.participant_id AND p.role = 'participant'
WHERE COALESCE(wp.counts_as_weekly_submission, true) = true
ORDER BY p.name, wp.week_number;

-- Program start date (admin graphs ignore weekly rows before this when set)
SELECT program_week_1_start_date FROM program_config LIMIT 1;

-- =============================================================================
-- 2) PREVIEW: rows to remove — submitted before 10 May (adjust year)
-- =============================================================================

SELECT
  wp.id,
  wp.participant_id,
  p.email,
  wp.week_number,
  wp.created_at,
  COALESCE(wp.counts_as_weekly_submission, true) AS counts_as_submission
FROM weekly_progress wp
LEFT JOIN participants p ON p.id = wp.participant_id
WHERE wp.created_at < TIMESTAMP '2026-05-10 00:00:00'
ORDER BY wp.created_at;

SELECT COUNT(*) AS weekly_rows_before_may_10
FROM weekly_progress
WHERE created_at < TIMESTAMP '2026-05-10 00:00:00';

-- =============================================================================
-- 3) PREVIEW: orphan weekly rows (participant deleted or not role=participant)
-- =============================================================================

SELECT wp.id, wp.participant_id, wp.week_number, wp.created_at
FROM weekly_progress wp
LEFT JOIN participants p ON p.id = wp.participant_id
WHERE p.id IS NULL OR p.role IS DISTINCT FROM 'participant';

-- =============================================================================
-- 4) PREVIEW: reach-out-only placeholders (never counted in admin graphs)
-- =============================================================================

SELECT id, participant_id, week_number, created_at
FROM weekly_progress
WHERE COALESCE(counts_as_weekly_submission, true) = false
ORDER BY created_at;

-- =============================================================================
-- 5) DELETE — test / pre-launch weekly data (before 10 May)
-- =============================================================================

-- BEGIN;
--
-- DELETE FROM weekly_progress
-- WHERE created_at < TIMESTAMP '2026-05-10 00:00:00';
--
-- COMMIT;

-- =============================================================================
-- 6) DELETE — orphan weekly rows
-- =============================================================================

-- BEGIN;
--
-- DELETE FROM weekly_progress wp
-- WHERE NOT EXISTS (
--   SELECT 1 FROM participants p
--   WHERE p.id = wp.participant_id AND p.role = 'participant'
-- );
--
-- COMMIT;

-- =============================================================================
-- 7) OPTIONAL: delete reach-out-only placeholder rows entirely
-- =============================================================================

-- BEGIN;
--
-- DELETE FROM weekly_progress
-- WHERE COALESCE(counts_as_weekly_submission, true) = false;
--
-- COMMIT;

-- =============================================================================
-- 8) VERIFY after cleanup
-- =============================================================================

SELECT COUNT(*) AS remaining_all_weekly FROM weekly_progress;

SELECT COUNT(*) AS remaining_in_admin_graphs
FROM weekly_progress wp
INNER JOIN participants p ON p.id = wp.participant_id AND p.role = 'participant'
WHERE COALESCE(wp.counts_as_weekly_submission, true) = true;

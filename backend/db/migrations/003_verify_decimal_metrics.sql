-- =============================================================================
-- Run AFTER 003_decimal_metrics_weekly_baseline.sql to confirm column types
-- =============================================================================
SET search_path TO public;

SELECT
  table_name,
  column_name,
  data_type,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('weekly_progress', 'baseline_metrics', 'weekly_metrics')
  AND column_name IN (
    'gb_deleted',
    'downloads_avoided_gb',
    'streaming_reduction_minutes',
    'screen_time_change',
    'phone_storage_gb',
    'laptop_storage_gb',
    'tablet_storage_gb',
    'cloud_storage_gb',
    'mailbox_size_gb',
    'screen_time_hours',
    'streaming_hours',
    'tiktok_minutes',
    'instagram_minutes',
    'facebook_minutes',
    'youtube_minutes',
    'downloads_gb_week',
    'storage_deleted_gb',
    'screen_time_change_minutes',
    'tiktok_reduction_minutes',
    'instagram_reduction_minutes',
    'facebook_reduction_minutes',
    'youtube_reduction_minutes'
  )
ORDER BY table_name, column_name;

-- Expect data_type = 'numeric' for all rows returned above.
-- co2_saved / screen_change / streaming_reduction on weekly_progress stay double precision unless you changed them separately.

-- =============================================================================
-- 003: Store fractional GB / minutes as numeric (weekly + baseline + legacy weekly_metrics)
-- =============================================================================
-- Run ONCE per database after backup/snapshot.
-- Idempotency: re-running will ERROR if types are already numeric — that is OK.
--
-- Tables you listed (detox): baseline_metrics, weekly_progress, weekly_metrics
-- Other tables (audit_logs, chat_messages, co2_factors, emission_config,
-- notifications, participants, program_config) are NOT changed here.
-- =============================================================================
SET search_path TO public;

BEGIN;

-- -----------------------------------------------------------------------------
-- weekly_progress
-- -----------------------------------------------------------------------------
ALTER TABLE weekly_progress
  ALTER COLUMN gb_deleted TYPE numeric(14, 4) USING gb_deleted::numeric,
  ALTER COLUMN downloads_avoided_gb TYPE numeric(14, 4) USING downloads_avoided_gb::numeric,
  ALTER COLUMN streaming_reduction_minutes TYPE numeric(14, 2)
    USING streaming_reduction_minutes::numeric,
  ALTER COLUMN screen_time_change TYPE numeric(14, 2) USING screen_time_change::numeric;

-- -----------------------------------------------------------------------------
-- baseline_metrics (mailbox_size_gb only if column exists on your RDS)
-- -----------------------------------------------------------------------------
ALTER TABLE baseline_metrics
  ALTER COLUMN phone_storage_gb TYPE numeric(14, 4) USING phone_storage_gb::numeric,
  ALTER COLUMN laptop_storage_gb TYPE numeric(14, 4) USING laptop_storage_gb::numeric,
  ALTER COLUMN tablet_storage_gb TYPE numeric(14, 4) USING tablet_storage_gb::numeric,
  ALTER COLUMN cloud_storage_gb TYPE numeric(14, 4) USING cloud_storage_gb::numeric,
  ALTER COLUMN screen_time_hours TYPE numeric(14, 2) USING screen_time_hours::numeric,
  ALTER COLUMN streaming_hours TYPE numeric(14, 2) USING streaming_hours::numeric,
  ALTER COLUMN tiktok_minutes TYPE numeric(14, 2) USING tiktok_minutes::numeric,
  ALTER COLUMN instagram_minutes TYPE numeric(14, 2) USING instagram_minutes::numeric,
  ALTER COLUMN facebook_minutes TYPE numeric(14, 2) USING facebook_minutes::numeric,
  ALTER COLUMN youtube_minutes TYPE numeric(14, 2) USING youtube_minutes::numeric,
  ALTER COLUMN downloads_gb_week TYPE numeric(14, 4) USING downloads_gb_week::numeric;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'baseline_metrics'
      AND column_name = 'mailbox_size_gb'
  ) THEN
    EXECUTE
      'ALTER TABLE baseline_metrics ALTER COLUMN mailbox_size_gb TYPE numeric(14, 4) USING mailbox_size_gb::numeric';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- weekly_metrics (legacy table — safe if empty or unused)
-- -----------------------------------------------------------------------------
ALTER TABLE weekly_metrics
  ALTER COLUMN storage_deleted_gb TYPE numeric(14, 4) USING storage_deleted_gb::numeric,
  ALTER COLUMN streaming_reduction_minutes TYPE numeric(14, 2)
    USING streaming_reduction_minutes::numeric,
  ALTER COLUMN screen_time_change_minutes TYPE numeric(14, 2)
    USING screen_time_change_minutes::numeric,
  ALTER COLUMN downloads_avoided_gb TYPE numeric(14, 4) USING downloads_avoided_gb::numeric,
  ALTER COLUMN tiktok_reduction_minutes TYPE numeric(14, 2)
    USING tiktok_reduction_minutes::numeric,
  ALTER COLUMN instagram_reduction_minutes TYPE numeric(14, 2)
    USING instagram_reduction_minutes::numeric,
  ALTER COLUMN facebook_reduction_minutes TYPE numeric(14, 2)
    USING facebook_reduction_minutes::numeric,
  ALTER COLUMN youtube_reduction_minutes TYPE numeric(14, 2)
    USING youtube_reduction_minutes::numeric;

COMMIT;

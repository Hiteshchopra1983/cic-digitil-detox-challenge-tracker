-- Digital Detox 2.0 simplified check-in (four actions, chip choices).
-- Keeps existing weekly_progress metrics for admin continuity.

ALTER TABLE weekly_progress
  ADD COLUMN IF NOT EXISTS dd2_checkin_json jsonb;

ALTER TABLE weekly_progress
  ADD COLUMN IF NOT EXISTS dd2_skip_week boolean DEFAULT false;

COMMENT ON COLUMN weekly_progress.dd2_checkin_json IS
  'DD 2.0 chip selections: { cleanup, inbox, notif, streaming, saved_at }';

COMMENT ON COLUMN weekly_progress.dd2_skip_week IS
  'True when participant skipped the entire week (still own-pace friendly).';

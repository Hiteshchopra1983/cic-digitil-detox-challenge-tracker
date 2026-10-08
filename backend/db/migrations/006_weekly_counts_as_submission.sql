-- Distinguish full weekly submissions from reach-out-only placeholder rows (progress / completion).
SET search_path TO public;

ALTER TABLE weekly_progress
  ADD COLUMN IF NOT EXISTS counts_as_weekly_submission boolean DEFAULT true;

UPDATE weekly_progress
SET counts_as_weekly_submission = true
WHERE counts_as_weekly_submission IS NULL;

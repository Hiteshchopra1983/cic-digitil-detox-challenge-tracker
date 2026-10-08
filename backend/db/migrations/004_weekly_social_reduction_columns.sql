-- Persist per-platform social reduction (minutes) on weekly_progress for UX + audit.
SET search_path TO public;

ALTER TABLE weekly_progress
  ADD COLUMN IF NOT EXISTS tiktok_reduction_minutes numeric(14, 2) DEFAULT 0;

ALTER TABLE weekly_progress
  ADD COLUMN IF NOT EXISTS instagram_reduction_minutes numeric(14, 2) DEFAULT 0;

ALTER TABLE weekly_progress
  ADD COLUMN IF NOT EXISTS facebook_reduction_minutes numeric(14, 2) DEFAULT 0;

ALTER TABLE weekly_progress
  ADD COLUMN IF NOT EXISTS youtube_reduction_minutes numeric(14, 2) DEFAULT 0;

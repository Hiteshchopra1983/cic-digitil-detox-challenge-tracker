-- =============================================================================
-- Incremental schema updates — Digital Detox Challenge Tracker
-- =============================================================================
-- Apply on RDS (or any Postgres) after restoring an older dump so the DB
-- matches what the current Node app expects.
--
-- Properties:
--   • Idempotent: safe to run more than once (uses IF NOT EXISTS where valid).
--   • Does not delete data.
--
-- Suggested run (replace connection details):
--   psql "postgresql://USER:PASS@your-rds.region.rds.amazonaws.com:5432/detox" \
--     -v ON_ERROR_STOP=1 -f backend/db/migrations/002_incremental_rds_updates.sql
--
-- If you already ran 001_add_baseline_co2_kg.sql, running this file again is fine;
-- baseline_co2_kg is included here for a single “one shot” apply.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) baseline_metrics — server-persisted baseline CO₂ (dashboard / APIs)
-- -----------------------------------------------------------------------------
ALTER TABLE baseline_metrics
  ADD COLUMN IF NOT EXISTS baseline_co2_kg double precision;

-- -----------------------------------------------------------------------------
-- 2) participants — forgot-password tokens
-- -----------------------------------------------------------------------------
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS reset_token text;

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS reset_token_expiry timestamptz;

-- -----------------------------------------------------------------------------
-- 3) participants — consent fields (only if your restore predates these columns)
-- -----------------------------------------------------------------------------
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS consent boolean;

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS consent_given boolean DEFAULT false;

ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS consent_timestamp timestamp without time zone;

-- App role (bulk import / RBAC); harmless if already present
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'participant';

-- -----------------------------------------------------------------------------
-- 4) weekly_progress — reach-out list + verified registered count (leaderboard)
-- -----------------------------------------------------------------------------
ALTER TABLE weekly_progress
  ADD COLUMN IF NOT EXISTS reach_out_emails text;

ALTER TABLE weekly_progress
  ADD COLUMN IF NOT EXISTS reach_out_registered_count integer DEFAULT 0;

-- -----------------------------------------------------------------------------
-- 5) chat_messages — direct chat (table may already exist from full restore)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  sender_id TEXT NOT NULL,
  receiver_id TEXT,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS receiver_id TEXT;

-- -----------------------------------------------------------------------------
-- 6) notifications — admin “send update” in-app delivery
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  participant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =============================================================================
-- Manual checks (not executed here):
--   • participants.email should be UNIQUE for registration / reach-out matching.
--   • If an ancient DB still has column "password" instead of password_hash,
--     rename/migrate in a separate one-off after backup:
--       ALTER TABLE participants RENAME COLUMN password TO password_hash;
--     (Only if applicable — verify before running.)
-- =============================================================================

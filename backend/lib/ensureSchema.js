/**
 * Idempotent schema bootstrap for fresh hosts (Neon / Render).
 * Safe to run on every boot.
 */
async function ensureSchema(pool) {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS participants (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      name text,
      email text UNIQUE,
      country text,
      city text,
      cohort text,
      consent boolean DEFAULT true,
      created_at timestamp DEFAULT NOW(),
      password_hash text,
      role text DEFAULT 'participant',
      reset_token text,
      reset_token_expiry timestamptz,
      consent_given boolean DEFAULT false,
      consent_timestamp timestamptz
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS program_config (
      id integer PRIMARY KEY DEFAULT 1,
      program_duration_weeks integer DEFAULT 16,
      weekly_submission_gap_days integer DEFAULT 7,
      baseline_lock boolean DEFAULT false,
      program_weeks integer DEFAULT 16,
      program_week_1_start_date date
    )
  `);
  await pool.query(`
    INSERT INTO program_config (id, program_duration_weeks, weekly_submission_gap_days, baseline_lock, program_weeks)
    VALUES (1, 16, 7, false, 16)
    ON CONFLICT (id) DO NOTHING
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS baseline_metrics (
      id serial PRIMARY KEY,
      participant_id uuid UNIQUE REFERENCES participants(id),
      phone_devices integer DEFAULT 1,
      phone_storage_gb numeric(14,4) DEFAULT 0,
      laptop_devices integer DEFAULT 1,
      laptop_storage_gb numeric(14,4) DEFAULT 0,
      tablet_devices integer DEFAULT 0,
      tablet_storage_gb numeric(14,4) DEFAULT 0,
      cloud_accounts integer DEFAULT 1,
      cloud_storage_gb numeric(14,4) DEFAULT 0,
      screen_time_hours numeric(14,2) DEFAULT 0,
      streaming_hours numeric(14,2) DEFAULT 0,
      tiktok_minutes numeric(14,2) DEFAULT 0,
      instagram_minutes numeric(14,2) DEFAULT 0,
      facebook_minutes numeric(14,2) DEFAULT 0,
      youtube_minutes numeric(14,2) DEFAULT 0,
      downloads_gb_week numeric(14,4) DEFAULT 0,
      emails_per_day integer DEFAULT 0,
      texts_per_day integer DEFAULT 0,
      llm_queries_per_week integer DEFAULT 0,
      baseline_co2_kg double precision DEFAULT 0
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS weekly_progress (
      id serial PRIMARY KEY,
      participant_id uuid REFERENCES participants(id),
      week_number integer,
      gb_deleted numeric(14,4) DEFAULT 0,
      downloads_avoided_gb numeric(14,4) DEFAULT 0,
      streaming_reduction_minutes numeric(14,2) DEFAULT 0,
      screen_time_change numeric(14,2) DEFAULT 0,
      emails_reduced integer DEFAULT 0,
      messages_reduced integer DEFAULT 0,
      ritual_completed boolean DEFAULT false,
      alumni_touchpoints integer DEFAULT 0,
      tiktok_reduction_minutes numeric(14,2) DEFAULT 0,
      instagram_reduction_minutes numeric(14,2) DEFAULT 0,
      facebook_reduction_minutes numeric(14,2) DEFAULT 0,
      youtube_reduction_minutes numeric(14,2) DEFAULT 0,
      llm_queries_reduced integer DEFAULT 0,
      co2_saved double precision DEFAULT 0,
      screen_change double precision DEFAULT 0,
      streaming_reduction double precision DEFAULT 0,
      reach_out_emails text,
      reach_out_registered_count integer DEFAULT 0,
      counts_as_weekly_submission boolean DEFAULT true,
      dd2_checkin_json jsonb,
      dd2_skip_week boolean DEFAULT false,
      created_at timestamp DEFAULT NOW(),
      UNIQUE (participant_id, week_number)
    )
  `);

  await pool.query(
    `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS dd2_checkin_json jsonb`
  );
  await pool.query(
    `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS dd2_skip_week boolean DEFAULT false`
  );
  await pool.query(
    `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS counts_as_weekly_submission boolean DEFAULT true`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS emission_config (
      id integer PRIMARY KEY DEFAULT 1,
      streaming_per_hour double precision DEFAULT 40,
      tiktok_per_min double precision DEFAULT 2.63,
      instagram_per_min double precision DEFAULT 1.5,
      facebook_per_min double precision DEFAULT 0.79,
      youtube_scroll_per_min double precision DEFAULT 0.46,
      cloud_per_gb_year double precision DEFAULT 750,
      email_per double precision DEFAULT 4,
      text_per double precision DEFAULT 0.014,
      download_per_gb double precision DEFAULT 50,
      llm_per_query double precision DEFAULT 0
    )
  `);
  await pool.query(
    `INSERT INTO emission_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING`
  );

  await pool.query(`
    CREATE TABLE IF NOT EXISTS co2_factors (
      key text PRIMARY KEY,
      value double precision
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id serial PRIMARY KEY,
      participant_id text NOT NULL,
      title text NOT NULL,
      message text NOT NULL,
      is_read boolean DEFAULT false,
      created_at timestamp DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id serial PRIMARY KEY,
      sender_id text,
      receiver_id text,
      sender_name text NOT NULL,
      message text NOT NULL,
      created_at timestamp DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id serial PRIMARY KEY,
      admin_id text,
      action text,
      target_id text,
      details jsonb,
      created_at timestamp DEFAULT NOW()
    )
  `);
}

module.exports = { ensureSchema };

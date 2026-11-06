/**
 * Seed local demo accounts for screenshots / POC.
 * Usage (from backend/): node scripts/seedLocalDemo.js
 *
 * Demo logins (password for both: Demo@12345)
 *   participant: demo.participant@cic.local
 *   admin:       demo.admin@cic.local
 */
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const { hashPassword } = require("../lib/password");
const { pool } = require("../lib/db");

const DEMO_PASSWORD = "Demo@12345";

const USERS = [
  {
    name: "Demo Participant",
    email: "demo.participant@cic.local",
    role: "participant",
    country: "Singapore",
    city: "Singapore",
    cohort: "Local POC"
  },
  {
    name: "Demo Admin",
    email: "demo.admin@cic.local",
    role: "admin",
    country: "Singapore",
    city: "Singapore",
    cohort: "Local POC"
  }
];

async function ensureCoreTables() {
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
      program_duration_weeks integer DEFAULT 6,
      weekly_submission_gap_days integer DEFAULT 7,
      baseline_lock boolean DEFAULT true,
      program_weeks integer DEFAULT 6,
      program_week_1_start_date date
    )
  `);
  await pool.query(`
    INSERT INTO program_config (id, program_duration_weeks, weekly_submission_gap_days, baseline_lock, program_weeks)
    VALUES (1, 6, 7, true, 6)
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
      created_at timestamp DEFAULT NOW(),
      UNIQUE (participant_id, week_number)
    )
  `);

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
  await pool.query(`
    INSERT INTO emission_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS co2_factors (
      key text PRIMARY KEY,
      value double precision
    )
  `);
  const factors = [
    ["storage_per_gb", 0.75],
    ["streaming_per_hour", 40],
    ["download_wifi_per_gb", 15],
    ["download_mobile_per_gb", 70],
    ["email_per_unit", 4],
    ["text_per_unit", 0.014],
    ["tiktok_per_min", 2.63],
    ["instagram_per_min", 1.5],
    ["facebook_per_min", 0.79],
    ["youtube_per_min", 0.46],
    ["llm_per_query", 0]
  ];
  for (const [k, v] of factors) {
    await pool.query(
      `INSERT INTO co2_factors (key, value) VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [k, v]
    );
  }

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

async function upsertUser(u, hash) {
  const existing = await pool.query(
    `SELECT id FROM participants WHERE lower(trim(email)) = lower($1)`,
    [u.email]
  );
  if (existing.rows.length) {
    await pool.query(
      `UPDATE participants
       SET name=$1, password_hash=$2, role=$3, country=$4, city=$5, cohort=$6,
           consent=true, consent_given=true
       WHERE id=$7`,
      [u.name, hash, u.role, u.country, u.city, u.cohort, existing.rows[0].id]
    );
    return existing.rows[0].id;
  }
  const ins = await pool.query(
    `INSERT INTO participants (
       name, email, password_hash, country, city, cohort, role,
       consent, consent_given, consent_timestamp
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,true,true,NOW())
     RETURNING id`,
    [u.name, u.email, hash, u.country, u.city, u.cohort, u.role]
  );
  return ins.rows[0].id;
}

async function seedParticipantBaselineAndWeek(participantId) {
  await pool.query(
    `INSERT INTO baseline_metrics (
       participant_id, phone_devices, phone_storage_gb, laptop_devices, laptop_storage_gb,
       tablet_devices, tablet_storage_gb, cloud_accounts, cloud_storage_gb,
       screen_time_hours, streaming_hours, downloads_gb_week,
       emails_per_day, texts_per_day, llm_queries_per_week, baseline_co2_kg
     ) VALUES ($1,1,64,1,256,0,0,1,50,5,10,2.5,20,10,15,12.5)
     ON CONFLICT (participant_id) DO UPDATE SET
       phone_storage_gb=EXCLUDED.phone_storage_gb,
       laptop_storage_gb=EXCLUDED.laptop_storage_gb,
       streaming_hours=EXCLUDED.streaming_hours,
       downloads_gb_week=EXCLUDED.downloads_gb_week,
       baseline_co2_kg=EXCLUDED.baseline_co2_kg`,
    [participantId]
  );

  // No calendar window for local POC screenshots
  await pool.query(
    `UPDATE program_config SET program_week_1_start_date = NULL WHERE id = 1`
  );

  await pool.query(
    `INSERT INTO weekly_progress (
       participant_id, week_number, gb_deleted, downloads_avoided_gb,
       streaming_reduction_minutes, screen_time_change, llm_queries_reduced,
       ritual_completed, co2_saved, screen_change, streaming_reduction,
       counts_as_weekly_submission
     ) VALUES ($1,1,3,1,45,30,5,true,1.2,30,45,true)
     ON CONFLICT (participant_id, week_number) DO UPDATE SET
       gb_deleted=EXCLUDED.gb_deleted,
       co2_saved=EXCLUDED.co2_saved`,
    [participantId]
  );
}

async function main() {
  await pool.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
  await ensureCoreTables();
  const hash = await hashPassword(DEMO_PASSWORD, 10);

  let participantId = null;
  for (const u of USERS) {
    const id = await upsertUser(u, hash);
    console.log(`OK ${u.role}: ${u.email}  id=${id}`);
    if (u.role === "participant") participantId = id;
  }

  if (participantId) {
    await seedParticipantBaselineAndWeek(participantId);
    console.log("OK seeded baseline + week 1 for demo participant");
  }

  console.log("\n=== LOCAL DEMO LOGINS ===");
  console.log("Participant  email: demo.participant@cic.local");
  console.log("Admin        email: demo.admin@cic.local");
  console.log("Password (both):    Demo@12345");
  console.log("Frontend: http://localhost:8080");
  console.log("API:      http://localhost:3000");
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error("Seed failed:", err.message || err);
    try {
      await pool.end();
    } catch (_) {}
    process.exit(1);
  });

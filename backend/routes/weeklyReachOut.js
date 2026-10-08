const { pool } = require("../lib/db");
const {
  computeReachOutRegisteredCount
} = require("../services/reachOutEmails");
const { validateWeeklySubmissionWindow } = require("../lib/weeklySubmissionWindow");

function normParticipantId(v) {
  return String(v || "").trim();
}

/**
 * Save reach-out invite emails for a program week (same columns as weekly tracker).
 * Creates a placeholder row (counts_as_weekly_submission = false) if none exists yet,
 * so progress / completion are unchanged until a full weekly submission is saved.
 */
module.exports = async (req, res) => {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const raw = req.body || {};
    const participant_id = normParticipantId(raw.participant_id);
    if (!participant_id) {
      return res.status(400).json({ error: "participant_id is required" });
    }

    const tokenId = String((req.user && req.user.id) || "")
      .trim()
      .toLowerCase();
    if (!tokenId || tokenId !== participant_id.toLowerCase()) {
      return res.status(403).json({
        error:
          "This submission does not match your logged-in account. Please log out and log in again."
      });
    }

    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS reach_out_emails text`
    );
    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS reach_out_registered_count integer DEFAULT 0`
    );
    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS counts_as_weekly_submission boolean DEFAULT true`
    );
    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS llm_queries_reduced integer DEFAULT 0`
    );

    const cfg = await pool.query(
      `SELECT COALESCE(
         NULLIF(program_weeks, 0),
         NULLIF(program_duration_weeks, 0),
         6
       )::int AS duration
       FROM program_config LIMIT 1`
    );
    const durationRow = cfg.rows[0];
    const duration = Number(durationRow?.duration) || 6;

    const submitted = await pool.query(
      `SELECT week_number FROM weekly_progress
       WHERE participant_id = $1
         AND COALESCE(counts_as_weekly_submission, true) = true`,
      [participant_id]
    );
    const submittedSet = new Set(
      submitted.rows.map((r) => Number(r.week_number)).filter((n) => Number.isFinite(n))
    );

    let week_number = Number(raw.week_number);
    if (!Number.isFinite(week_number) || week_number < 1) {
      week_number = 0;
      for (let i = 1; i <= duration; i += 1) {
        if (!submittedSet.has(i)) {
          week_number = i;
          break;
        }
      }
      if (week_number < 1) {
        week_number = duration;
      }
    }

    if (week_number < 1 || week_number > duration) {
      return res.status(400).json({ error: "Invalid week number for this program" });
    }

    await pool.query(`
      ALTER TABLE program_config
      ADD COLUMN IF NOT EXISTS program_week_1_start_date date
    `);
    const winCfg = await pool.query(
      `SELECT program_week_1_start_date FROM program_config LIMIT 1`
    );
    const windowErr = validateWeeklySubmissionWindow(
      week_number,
      winCfg.rows[0]?.program_week_1_start_date,
      new Date()
    );
    if (windowErr) {
      return res.status(400).json({ error: windowErr });
    }

    const { storedText: reachOutStored, count: reachOutCount } =
      await computeReachOutRegisteredCount(
        participant_id,
        raw.reach_out_emails ?? ""
      );

    const existing = await pool.query(
      `SELECT id, COALESCE(counts_as_weekly_submission, true) AS counts_as
       FROM weekly_progress
       WHERE participant_id = $1 AND week_number = $2`,
      [participant_id, week_number]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE weekly_progress
         SET reach_out_emails = $1,
             reach_out_registered_count = $2
         WHERE participant_id = $3 AND week_number = $4`,
        [
          reachOutStored || null,
          reachOutCount,
          participant_id,
          week_number
        ]
      );

      return res.json({
        success: true,
        week_number,
        reach_out_registered_count: reachOutCount
      });
    }

    await pool.query(
      `INSERT INTO weekly_progress(
        participant_id,
        week_number,
        gb_deleted,
        downloads_avoided_gb,
        streaming_reduction_minutes,
        screen_time_change,
        emails_reduced,
        messages_reduced,
        ritual_completed,
        alumni_touchpoints,
        tiktok_reduction_minutes,
        instagram_reduction_minutes,
        facebook_reduction_minutes,
        youtube_reduction_minutes,
        llm_queries_reduced,
        co2_saved,
        screen_change,
        streaming_reduction,
        reach_out_emails,
        reach_out_registered_count,
        counts_as_weekly_submission
      ) VALUES (
        $1, $2,
        0, 0, 0, 0, 0, 0, false, 0,
        0, 0, 0, 0, 0,
        0, 0, 0,
        $3, $4,
        false
      )`,
      [participant_id, week_number, reachOutStored || null, reachOutCount]
    );

    return res.json({
      success: true,
      week_number,
      reach_out_registered_count: reachOutCount
    });
  } catch (err) {
    console.error("weekly reach-out:", err && err.code, err && err.message, err);
    res.status(500).json({ error: "Reach-out save failed" });
  }
};

const { pool } = require("../lib/db");
const { calculateWeeklyCO2Savings } = require("../lib/carbonCalculator");
const { validateWeeklyAgainstBaseline } = require("../lib/weeklyBaselineChecks");
const { weeklyPayloadFromRequestBody } = require("./weeklyPayload");
const {
  computeReachOutRegisteredCount
} = require("../services/reachOutEmails");
const {
  intMetric,
  decimalMetricGb,
  decimalMetricMinutes
} = require("../lib/metrics");
const { validateWeeklySubmissionWindow } = require("../lib/weeklySubmissionWindow");

module.exports = async (req, res) => {
  try {
    const raw = req.body || {};
    const participant_id = String(raw.participant_id || "").trim();
    const week_number = Number(raw.week_number);

    if (!participant_id) {
      return res.status(400).json({ error: "participant_id is required" });
    }
    if (!Number.isFinite(week_number) || week_number < 1) {
      return res.status(400).json({ error: "Invalid week number" });
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

    const d = {
      ...raw,
      participant_id,
      week_number,
      storage_deleted_gb: decimalMetricGb(raw.storage_deleted_gb),
      downloads_avoided_gb: decimalMetricGb(raw.downloads_avoided_gb),
      streaming_reduction_minutes: decimalMetricMinutes(
        raw.streaming_reduction_minutes
      ),
      screen_time_change_minutes: decimalMetricMinutes(
        raw.screen_time_change_minutes
      ),
      emails_reduced: intMetric(raw.emails_reduced),
      messages_reduced: intMetric(raw.messages_reduced),
      alumni_touchpoints: intMetric(raw.alumni_touchpoints),
      /* Social reduction fields no longer used in UI — persist as 0. */
      tiktok_reduction_minutes: 0,
      instagram_reduction_minutes: 0,
      facebook_reduction_minutes: 0,
      youtube_reduction_minutes: 0,
      llm_queries_reduced: intMetric(raw.llm_queries_reduced),
      ritual_completed: !!raw.ritual_completed,
      reach_out_emails: raw.reach_out_emails
    };

    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS reach_out_emails text`
    );
    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS reach_out_registered_count integer DEFAULT 0`
    );
    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS tiktok_reduction_minutes numeric(14,2) DEFAULT 0`
    );
    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS instagram_reduction_minutes numeric(14,2) DEFAULT 0`
    );
    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS facebook_reduction_minutes numeric(14,2) DEFAULT 0`
    );
    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS youtube_reduction_minutes numeric(14,2) DEFAULT 0`
    );
    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS llm_queries_reduced integer DEFAULT 0`
    );
    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS counts_as_weekly_submission boolean DEFAULT true`
    );

    const baselineRes = await pool.query(
      `SELECT * FROM baseline_metrics WHERE participant_id = $1 LIMIT 1`,
      [d.participant_id]
    );
    const baselineRow = baselineRes.rows[0];
    const capCheck = validateWeeklyAgainstBaseline(
      d.storage_deleted_gb,
      d.streaming_reduction_minutes,
      d.screen_time_change_minutes,
      baselineRow
    );
    if (!capCheck.ok) {
      return res.status(400).json({ error: capCheck.error });
    }

    const payload = weeklyPayloadFromRequestBody(d);
    const co2_saved = Number(
      Number(await calculateWeeklyCO2Savings(payload)).toFixed(4)
    );

    const { storedText: reachOutStored, count: reachOutCount } =
      await computeReachOutRegisteredCount(
        d.participant_id,
        d.reach_out_emails ?? ""
      );

    const existing = await pool.query(
      `SELECT id FROM weekly_progress
WHERE participant_id=$1
AND week_number=$2`,
      [d.participant_id, d.week_number]
    );

    const screenMin = d.screen_time_change_minutes;
    const streamMin = d.streaming_reduction_minutes;
    const tt = d.tiktok_reduction_minutes;
    const ig = d.instagram_reduction_minutes;
    const fb = d.facebook_reduction_minutes;
    const yt = d.youtube_reduction_minutes;
    const llmR = d.llm_queries_reduced;

    if (existing.rows.length > 0) {
      await pool.query(
        `UPDATE weekly_progress
SET
gb_deleted=$1,
downloads_avoided_gb=$2,
streaming_reduction_minutes=$3,
screen_time_change=$4,
emails_reduced=$5,
messages_reduced=$6,
ritual_completed=$7,
alumni_touchpoints=$8,
tiktok_reduction_minutes=$9,
instagram_reduction_minutes=$10,
facebook_reduction_minutes=$11,
youtube_reduction_minutes=$12,
llm_queries_reduced=$13,
co2_saved=$14,
screen_change=$15,
streaming_reduction=$16,
reach_out_emails=$17,
reach_out_registered_count=$18,
counts_as_weekly_submission = true
WHERE participant_id=$19
AND week_number=$20`,
        [
          d.storage_deleted_gb,
          d.downloads_avoided_gb,
          streamMin,
          screenMin,
          d.emails_reduced,
          d.messages_reduced,
          d.ritual_completed,
          d.alumni_touchpoints,
          tt,
          ig,
          fb,
          yt,
          llmR,
          co2_saved,
          screenMin,
          streamMin,
          reachOutStored || null,
          reachOutCount,
          d.participant_id,
          d.week_number
        ]
      );

      return res.json({
        success: true,
        message: "Weekly progress updated",
        co2_saved,
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
)
VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,true)`,
      [
        d.participant_id,
        d.week_number,
        d.storage_deleted_gb,
        d.downloads_avoided_gb,
        streamMin,
        screenMin,
        d.emails_reduced,
        d.messages_reduced,
        d.ritual_completed,
        d.alumni_touchpoints,
        tt,
        ig,
        fb,
        yt,
        llmR,
        co2_saved,
        screenMin,
        streamMin,
        reachOutStored || null,
        reachOutCount
      ]
    );

    res.json({
      success: true,
      message: "Weekly progress saved",
      co2_saved,
      reach_out_registered_count: reachOutCount
    });
  } catch (err) {
    console.error("weekly submission:", err && err.code, err && err.message, err);
    if (err && err.code === "22003") {
      return res.status(400).json({
        error: "One or more numbers are too large. Use smaller values and try again."
      });
    }
    res.status(500).json({ error: "Weekly submission failed" });
  }
};

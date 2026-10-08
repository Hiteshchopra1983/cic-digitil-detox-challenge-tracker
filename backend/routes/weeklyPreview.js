const { pool } = require("../lib/db");
const {
  calculateWeeklyCO2Savings,
  weeklyCo2Breakdown
} = require("../lib/carbonCalculator");
const { validateWeeklyAgainstBaseline } = require("../lib/weeklyBaselineChecks");
const { weeklyPayloadFromRequestBody } = require("./weeklyPayload");
const {
  decimalMetricGb,
  decimalMetricMinutes,
  intMetric
} = require("../lib/metrics");
const { validateWeeklySubmissionWindow } = require("../lib/weeklySubmissionWindow");

/** Same numeric normalization as POST /api/weekly so preview matches saved co2_saved. */
function normalizedWeeklyBody(raw) {
  const r = raw || {};
  return {
    ...r,
    storage_deleted_gb: decimalMetricGb(r.storage_deleted_gb),
    downloads_avoided_gb: decimalMetricGb(r.downloads_avoided_gb),
    streaming_reduction_minutes: decimalMetricMinutes(
      r.streaming_reduction_minutes
    ),
    screen_time_change_minutes: decimalMetricMinutes(
      r.screen_time_change_minutes
    ),
    emails_reduced: intMetric(r.emails_reduced),
    messages_reduced: intMetric(r.messages_reduced),
    tiktok_reduction_minutes: 0,
    instagram_reduction_minutes: 0,
    facebook_reduction_minutes: 0,
    youtube_reduction_minutes: 0,
    llm_queries_reduced: intMetric(r.llm_queries_reduced)
  };
}

module.exports = async (req, res) => {
  try {
    const norm = normalizedWeeklyBody(req.body);
    await pool.query(`
      ALTER TABLE program_config
      ADD COLUMN IF NOT EXISTS program_week_1_start_date date
    `);
    const winCfg = await pool.query(
      `SELECT program_week_1_start_date FROM program_config LIMIT 1`
    );
    const anchor = winCfg.rows[0]?.program_week_1_start_date;
    const weekNum = Number(norm.week_number);

    if (anchor != null && String(anchor).trim() !== "") {
      if (!Number.isFinite(weekNum) || weekNum < 1) {
        return res.status(400).json({
          error:
            "week_number is required for preview when the program uses Monday–Sunday submission windows."
        });
      }
      const windowErr = validateWeeklySubmissionWindow(weekNum, anchor, new Date());
      if (windowErr) {
        return res.status(400).json({ error: windowErr });
      }
    }

    const userId = String((req.user && req.user.id) || "").trim();
    if (userId) {
      const baselineRes = await pool.query(
        `SELECT * FROM baseline_metrics WHERE participant_id = $1 LIMIT 1`,
        [userId]
      );
      const capCheck = validateWeeklyAgainstBaseline(
        norm.storage_deleted_gb,
        norm.streaming_reduction_minutes,
        norm.screen_time_change_minutes,
        baselineRes.rows[0]
      );
      if (!capCheck.ok) {
        return res.status(400).json({ error: capCheck.error });
      }
    }
    const payload = weeklyPayloadFromRequestBody(norm);
    const co2_saved = await calculateWeeklyCO2Savings(payload);
    const rounded = Number(Number(co2_saved).toFixed(4));
    const breakdown = await weeklyCo2Breakdown(payload);
    breakdown.total_kg = Number(Number(breakdown.total_kg).toFixed(4));
    res.json({ co2_saved: rounded, breakdown });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Preview failed" });
  }
};

const { pool } = require("../lib/db");
const { calculateWeeklyCO2Savings } = require("../lib/carbonCalculator");
const { weeklyPayloadFromRequestBody } = require("./weeklyPayload");
const {
  computeReachOutRegisteredCount
} = require("../services/reachOutEmails");
const {
  intMetric,
  decimalMetricGb,
  decimalMetricMinutes
} = require("../lib/metrics");

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
      ritual_completed: !!raw.ritual_completed,
      reach_out_emails: raw.reach_out_emails
    };

    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS reach_out_emails text`
    );
    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS reach_out_registered_count integer DEFAULT 0`
    );

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
co2_saved=$9,
screen_change=$10,
streaming_reduction=$11,
reach_out_emails=$12,
reach_out_registered_count=$13
WHERE participant_id=$14
AND week_number=$15`,
        [
          d.storage_deleted_gb,
          d.downloads_avoided_gb,
          streamMin,
          screenMin,
          d.emails_reduced,
          d.messages_reduced,
          d.ritual_completed,
          d.alumni_touchpoints,
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
co2_saved,
screen_change,
streaming_reduction,
reach_out_emails,
reach_out_registered_count
)
VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
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

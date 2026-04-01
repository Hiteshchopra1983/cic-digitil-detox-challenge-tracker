const { pool } = require("../lib/db");
const { calculateWeeklyCO2Savings } = require("../lib/carbonCalculator");
const { weeklyPayloadFromRequestBody } = require("./weeklyPayload");
const {
  computeReachOutRegisteredCount
} = require("../services/reachOutEmails");

module.exports = async (req, res) => {
  try {
    const d = req.body;

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
          d.storage_deleted_gb || 0,
          d.downloads_avoided_gb || 0,
          d.streaming_reduction_minutes || 0,
          d.screen_time_change_minutes || 0,
          d.emails_reduced || 0,
          d.messages_reduced || 0,
          d.ritual_completed || false,
          d.alumni_touchpoints || 0,
          co2_saved,
          d.screen_time_change_minutes || 0,
          d.streaming_reduction_minutes || 0,
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
        d.storage_deleted_gb || 0,
        d.downloads_avoided_gb || 0,
        d.streaming_reduction_minutes || 0,
        d.screen_time_change_minutes || 0,
        d.emails_reduced || 0,
        d.messages_reduced || 0,
        d.ritual_completed || false,
        d.alumni_touchpoints || 0,
        co2_saved,
        d.screen_time_change_minutes || 0,
        d.streaming_reduction_minutes || 0,
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
    console.error(err);
    res.status(500).json({ error: "Weekly submission failed" });
  }
};

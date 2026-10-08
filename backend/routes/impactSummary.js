const { pool } = require("../lib/db");
const { convertImpact } = require("../services/impactCalculator");
const { calculateWeeklyCO2Savings } = require("../services/co2Calculator");
const { sameParticipantId } = require("../lib/participantAuth");

module.exports = async (req, res) => {
  try {
    const paramId = String(req.params.id || "").trim();
    const tokenId = String((req.user && req.user.id) || "").trim();
    if (!sameParticipantId(tokenId, paramId)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const id = paramId;

    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS counts_as_weekly_submission boolean DEFAULT true`
    );

    const rows = await pool.query(
      `
      SELECT * FROM weekly_progress
      WHERE participant_id = $1
        AND COALESCE(counts_as_weekly_submission, true) = true
      ORDER BY week_number
      `,
      [id]
    );

    const co2Parts = await Promise.all(
      rows.rows.map((row) => calculateWeeklyCO2Savings(row))
    );
    let co2 = 0;
    for (const kg of co2Parts) {
      co2 += Number(kg) || 0;
    }
    co2 = Number(co2.toFixed(4));

    const impact = convertImpact(co2);

    const weeks = await pool.query(
      `
      SELECT COUNT(DISTINCT week_number)::int AS submitted
      FROM weekly_progress
      WHERE participant_id = $1
        AND COALESCE(counts_as_weekly_submission, true) = true
      `,
      [id]
    );

    const config = await pool.query(
      `SELECT COALESCE(
         NULLIF(program_weeks, 0),
         NULLIF(program_duration_weeks, 0),
         6
       )::int AS duration
       FROM program_config LIMIT 1`
    );

    const submitted = Number(weeks.rows[0]?.submitted ?? 0);
    const duration = Number(config.rows[0]?.duration) || 6;

    res.json({
      completed: submitted >= duration,
      submitted,
      duration,
      co2_saved: co2,
      impact
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impact summary failed" });
  }
};

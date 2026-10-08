const { pool } = require("../lib/db");
const { parseProgramWeek1StartDate } = require("../lib/weeklySubmissionWindow");

module.exports = async (req, res) => {
  try {
    await pool.query(`
      ALTER TABLE program_config
      ADD COLUMN IF NOT EXISTS program_week_1_start_date date
    `);

    if (req.method === "GET") {
      const config = await pool.query("SELECT * FROM program_config LIMIT 1");
      return res.json(config.rows[0]);
    }

    if (req.method === "POST") {
      const d = req.body || {};
      const hasAnchor = Object.prototype.hasOwnProperty.call(
        d,
        "program_week_1_start_date"
      );

      if (hasAnchor) {
        const anchorNorm =
          d.program_week_1_start_date === "" || d.program_week_1_start_date == null
            ? null
            : d.program_week_1_start_date;
        const parsed = parseProgramWeek1StartDate(anchorNorm);
        if (!parsed.ok) {
          return res.status(400).json({ error: parsed.error });
        }
        const ymd =
          parsed.date == null ? null : parsed.date.toISOString().slice(0, 10);
        await pool.query(
          `
UPDATE program_config
SET
program_duration_weeks=$1,
weekly_submission_gap_days=$2,
baseline_lock=$3,
program_week_1_start_date=$4
`,
          [
            d.program_duration_weeks,
            d.weekly_submission_gap_days,
            d.baseline_lock,
            ymd
          ]
        );
      } else {
        await pool.query(
          `
UPDATE program_config
SET
program_duration_weeks=$1,
weekly_submission_gap_days=$2,
baseline_lock=$3
`,
          [
            d.program_duration_weeks,
            d.weekly_submission_gap_days,
            d.baseline_lock
          ]
        );
      }

      return res.json({ success: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Config error" });
  }
};
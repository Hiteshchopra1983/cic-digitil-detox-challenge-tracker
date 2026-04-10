const { pool } = require("../lib/db");

function jsonNum(v) {
  if (v == null || v === "") return v;
  const x = Number(v);
  return Number.isFinite(x) ? x : v;
}

module.exports = async (req, res) => {
  try {
    const { participantId, weekNumber } = req.params;

    if (String(req.user.id) !== String(participantId)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const wn = Number(weekNumber);
    if (!Number.isFinite(wn) || wn < 1) {
      return res.status(400).json({ error: "Invalid week" });
    }

    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS reach_out_emails text`
    );
    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS reach_out_registered_count integer DEFAULT 0`
    );

    const result = await pool.query(
      `SELECT * FROM weekly_progress
       WHERE participant_id = $1 AND week_number = $2`,
      [participantId, wn]
    );

    if (result.rows.length === 0) {
      return res.json({ entry: null });
    }

    const row = result.rows[0];
    res.json({
      entry: {
        storage_deleted_gb: jsonNum(row.gb_deleted),
        downloads_avoided_gb: jsonNum(row.downloads_avoided_gb),
        streaming_reduction_minutes: jsonNum(row.streaming_reduction_minutes),
        screen_time_change_minutes: jsonNum(row.screen_time_change),
        emails_reduced: jsonNum(row.emails_reduced),
        messages_reduced: jsonNum(row.messages_reduced),
        ritual_completed: row.ritual_completed,
        alumni_touchpoints: jsonNum(row.alumni_touchpoints),
        reach_out_emails: row.reach_out_emails ?? "",
        reach_out_registered_count: row.reach_out_registered_count ?? 0
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load weekly entry" });
  }
};

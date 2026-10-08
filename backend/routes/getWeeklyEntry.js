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
        tiktok_reduction_minutes: jsonNum(row.tiktok_reduction_minutes),
        instagram_reduction_minutes: jsonNum(row.instagram_reduction_minutes),
        facebook_reduction_minutes: jsonNum(row.facebook_reduction_minutes),
        youtube_reduction_minutes: jsonNum(row.youtube_reduction_minutes),
        llm_queries_reduced: jsonNum(row.llm_queries_reduced),
        reach_out_emails: row.reach_out_emails ?? "",
        reach_out_registered_count: row.reach_out_registered_count ?? 0,
        counts_as_weekly_submission:
          row.counts_as_weekly_submission == null
            ? true
            : !!row.counts_as_weekly_submission
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to load weekly entry" });
  }
};

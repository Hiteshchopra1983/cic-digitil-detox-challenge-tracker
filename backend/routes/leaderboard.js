const express = require("express");
const router = express.Router();
const { pool } = require("../lib/db");

function reachOutBonusKg() {
  const n = Number(process.env.REACH_OUT_LEADERBOARD_BONUS_KG);
  if (Number.isFinite(n) && n >= 0) return n;
  return 0.5;
}

router.get("/", async (req, res) => {
  try {
    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS reach_out_emails text`
    );
    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS reach_out_registered_count integer DEFAULT 0`
    );

    const bonus = reachOutBonusKg();

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        COALESCE(SUM(w.co2_saved), 0)::float8 AS co2_saved,
        COALESCE(SUM(w.reach_out_registered_count), 0)::int AS reach_out_matches,
        COALESCE(SUM(w.gb_deleted), 0)::float8 AS gb_reduction,
        COALESCE(SUM(w.streaming_reduction), 0)::float8 AS streaming_reduction_minutes
      FROM participants p
      LEFT JOIN weekly_progress w ON p.id = w.participant_id
      WHERE p.role = 'participant'
      GROUP BY p.id, p.name
      ORDER BY (
        COALESCE(SUM(w.co2_saved), 0) + ($1::float8 * COALESCE(SUM(w.reach_out_registered_count), 0))
      ) DESC
      LIMIT 20
      `,
      [bonus]
    );

    const rows = result.rows.map((row) => {
      const co2 = Number(row.co2_saved) || 0;
      const matches = Number(row.reach_out_matches) || 0;
      const reachBonus = Number((bonus * matches).toFixed(4));
      const leaderboardScore = Number((co2 + reachBonus).toFixed(4));
      return {
        id: row.id,
        name: row.name,
        co2_saved: co2,
        reach_out_matches: matches,
        reach_out_bonus_kg: reachBonus,
        leaderboard_score: leaderboardScore,
        gb_reduction: Number(row.gb_reduction) || 0,
        streaming_reduction_minutes: Number(row.streaming_reduction_minutes) || 0
      };
    });

    res.json(rows);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Leaderboard failed" });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const { pool } = require("../lib/db");
const { calculateWeeklyCO2Savings } = require("../services/co2Calculator");
const { getProgramWeeklyFromSql } = require("../lib/adminParticipantScope");

function reachOutBonusKg() {
  const n = Number(process.env.REACH_OUT_LEADERBOARD_BONUS_KG);
  if (Number.isFinite(n) && n >= 0) return n;
  return 0.5;
}

const SORT_MODES = new Set([
  "score",
  "co2",
  "storage",
  "screen",
  "streaming",
  "reachouts"
]);

function firstQueryParam(val) {
  if (val == null) return undefined;
  if (Array.isArray(val)) return val[0];
  return val;
}

function normalizeSortMode(raw) {
  const s = String(raw || "score")
    .trim()
    .toLowerCase();
  return SORT_MODES.has(s) ? s : "score";
}

router.get("/", async (req, res) => {
  try {
    const sortMode = normalizeSortMode(firstQueryParam(req.query.sort));
    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS reach_out_emails text`
    );
    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS reach_out_registered_count integer DEFAULT 0`
    );
    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS counts_as_weekly_submission boolean DEFAULT true`
    );

    const bonus = reachOutBonusKg();
    const programWeeklyFrom = await getProgramWeeklyFromSql(pool);

    const [participants, weeks] = await Promise.all([
      pool.query(
        `SELECT id, name FROM participants WHERE role = 'participant'`
      ),
      pool.query(`SELECT wp.* ${programWeeklyFrom}`)
    ]);

    const byId = new Map();
    for (const p of participants.rows) {
      byId.set(String(p.id), {
        id: p.id,
        name: p.name,
        co2_saved: 0,
        reach_out_matches: 0,
        gb_reduction: 0,
        streaming_reduction_minutes: 0,
        screen_reduction_minutes: 0
      });
    }

    const co2Pairs = await Promise.all(
      weeks.rows.map((row) =>
        calculateWeeklyCO2Savings(row).then((kg) => ({
          row,
          kg: Number(kg) || 0
        }))
      )
    );

    for (const { row, kg } of co2Pairs) {
      const id = String(row.participant_id);
      const cur = byId.get(id);
      if (!cur) continue;
      cur.co2_saved += kg;
      cur.reach_out_matches += Number(row.reach_out_registered_count) || 0;
      cur.gb_reduction += Number(row.gb_deleted) || 0;
      cur.streaming_reduction_minutes += Number(row.streaming_reduction) || 0;
      cur.screen_reduction_minutes +=
        Number(row.screen_change ?? row.screen_time_change) || 0;
    }

    const rows = [...byId.values()]
      .map((row) => {
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
          streaming_reduction_minutes: Number(row.streaming_reduction_minutes) || 0,
          screen_reduction_minutes: Number(row.screen_reduction_minutes) || 0
        };
      })
      .filter((row) => row.leaderboard_score > 0)
      .sort((a, b) => {
        let av;
        let bv;
        switch (sortMode) {
          case "co2":
            av = a.co2_saved;
            bv = b.co2_saved;
            break;
          case "storage":
            av = a.gb_reduction;
            bv = b.gb_reduction;
            break;
          case "screen":
            av = a.screen_reduction_minutes;
            bv = b.screen_reduction_minutes;
            break;
          case "streaming":
            av = a.streaming_reduction_minutes;
            bv = b.streaming_reduction_minutes;
            break;
          case "reachouts":
            av = a.reach_out_matches;
            bv = b.reach_out_matches;
            break;
          default:
            av = a.leaderboard_score;
            bv = b.leaderboard_score;
        }
        if (bv !== av) return bv - av;
        return String(a.name).localeCompare(String(b.name));
      })
      .slice(0, 20);

    res.json(rows);
  } catch (err) {
    console.error("Leaderboard error:", err);
    res.status(500).json({ error: "Leaderboard failed" });
  }
});

module.exports = router;

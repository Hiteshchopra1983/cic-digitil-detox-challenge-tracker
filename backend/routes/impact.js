const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { sameParticipantId } = require("../lib/participantAuth");
const { pool } = require("../lib/db");
const {
  baselineStorageGbFromRow,
  storageReductionPercentOfBaseline
} = require("../lib/baselineStorage");
const {
  calculateBaselineCO2,
  calculateWeeklyCO2Savings,
  weeklyCo2Breakdown
} = require("../services/co2Calculator");
const { convertImpact } = require("../services/impactCalculator");

function normParticipantId(v) {
  const s = String(v || "").trim();
  return /^[0-9a-f-]{36}$/i.test(s) ? s.toLowerCase() : s;
}

router.get("/:id", auth, async (req,res)=>{

  try{

    const { id } = req.params;

    if (!sameParticipantId(req.user && req.user.id, id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS counts_as_weekly_submission boolean DEFAULT true`
    );

    const totals = await pool.query(
      `
      SELECT
        COALESCE(SUM(screen_change),0) as screen_reduction,
        COALESCE(SUM(streaming_reduction),0) as streaming_reduction,
        COALESCE(SUM(gb_deleted),0) as gb_deleted,
        COALESCE(SUM(downloads_avoided_gb),0) as downloads_avoided_total,
        COALESCE(SUM(llm_queries_reduced),0) as llm_queries_reduced_total
      FROM weekly_progress
      WHERE participant_id=$1
        AND COALESCE(counts_as_weekly_submission, true) = true
      `,
      [id]
    );

    const baselineRes = await pool.query(
      `SELECT * FROM baseline_metrics WHERE participant_id=$1 LIMIT 1`,
      [id]
    );
    const baselineGb = baselineStorageGbFromRow(baselineRes.rows[0]);
    const gbDeleted = Number(totals.rows[0].gb_deleted || 0);
    const storage_reduction_percent = storageReductionPercentOfBaseline(
      gbDeleted,
      baselineGb
    );

    const weeklyRows = await pool.query(
      `
      SELECT * FROM weekly_progress
      WHERE participant_id=$1
        AND COALESCE(counts_as_weekly_submission, true) = true
      ORDER BY week_number
      `,
      [id]
    );

    const co2PerWeek = await Promise.all(
      weeklyRows.rows.map((row) => calculateWeeklyCO2Savings(row))
    );
    const breakdowns = await Promise.all(
      weeklyRows.rows.map((row) => weeklyCo2Breakdown(row))
    );
    const co2_saved = co2PerWeek.reduce((sum, v) => sum + (Number(v) || 0), 0);
    const weekly = weeklyRows.rows.map((row, i) => {
      const categories = {};
      const lines = breakdowns[i]?.lines || [];
      for (const line of lines) {
        categories[line.key] = Number(Number(line.kg || 0).toFixed(4));
      }
      return {
        week: row.week_number,
        co2: Number(Number(co2PerWeek[i] || 0).toFixed(4)),
        categories
      };
    });

    const category_totals = {};
    for (const w of weekly) {
      for (const [key, value] of Object.entries(w.categories || {})) {
        category_totals[key] = (category_totals[key] || 0) + (Number(value) || 0);
      }
    }
    for (const key of Object.keys(category_totals)) {
      category_totals[key] = Number(Number(category_totals[key]).toFixed(4));
    }

    const impactEquiv = convertImpact(co2_saved);
    const detox_score = Math.min(100, Math.round(co2_saved * 2));

    const leaderboard = await pool.query(`
      SELECT
        participant_id,
        SUM(gb_deleted) as total_gb
      FROM weekly_progress
      GROUP BY participant_id
      ORDER BY total_gb DESC
    `);
    const pid = normParticipantId(id);
    let rank =
      leaderboard.rows.findIndex(
        (r) => normParticipantId(r.participant_id) === pid
      ) + 1;
    if (rank === 0) rank = null;

    let baseline_co2_kg = null;
    const br = baselineRes.rows[0];
    if (br) {
      const raw = await calculateBaselineCO2(br);
      if (Number.isFinite(raw)) {
        baseline_co2_kg = Number(raw.toFixed(4));
      }
    }

    res.json({
      co2_saved: Number(co2_saved.toFixed(4)),
      screen_reduction: Number(totals.rows[0].screen_reduction),
      streaming_reduction: Number(totals.rows[0].streaming_reduction),
      gb_deleted: gbDeleted,
      downloads_avoided_total: Number(totals.rows[0].downloads_avoided_total || 0),
      llm_queries_reduced_total: Number(totals.rows[0].llm_queries_reduced_total || 0),
      baseline_storage_gb: Number(baselineGb.toFixed(2)),
      storage_reduction_percent: storage_reduction_percent,
      baseline_co2_kg,
      weekly_submission_count: weeklyRows.rows.length,
      weekly,
      weeklyChart: weekly,
      category_totals,
      impact: impactEquiv,
      rank,
      detox_score
    });

  }catch(err){

    console.error("Impact error:",err);

    res.status(500).json({error:"Impact failed"});

  }

});

module.exports = router;
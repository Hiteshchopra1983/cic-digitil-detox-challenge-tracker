const { pool } = require("../lib/db");
const { calculateWeeklyCO2Savings } = require("../services/co2Calculator");
const { convertImpact } = require("../services/impactCalculator");
const {
  baselineStorageGbFromRow,
  storageReductionPercentOfBaseline
} = require("../lib/baselineStorage");

module.exports = async (req,res)=>{

  try{

    const userId = req.user.id;

    const baselineRes = await pool.query(
      "SELECT * FROM baseline_metrics WHERE participant_id=$1 LIMIT 1",
      [userId]
    );
    const baselineGb = baselineStorageGbFromRow(baselineRes.rows[0]);

    const weekly = await pool.query(
      "SELECT * FROM weekly_progress WHERE participant_id=$1 ORDER BY week_number",
      [userId]
    );

    let totalCO2 = 0;
    let totalGB = 0;

    const weeklyChart = [];

    for(const w of weekly.rows){

      const co2 = await calculateWeeklyCO2Savings(w);

      totalCO2 += co2;

      totalGB += Number(w.gb_deleted);

      weeklyChart.push({
        week:w.week_number,
        co2:co2
      });

    }

    const impact = convertImpact(totalCO2);

    const leaderboard = await pool.query(`
      SELECT
        participant_id,
        SUM(gb_deleted) as total_gb
      FROM weekly_progress
      GROUP BY participant_id
      ORDER BY total_gb DESC
    `);

    let rank = leaderboard.rows.findIndex(
      r => r.participant_id === userId
    ) + 1;

    if(rank === 0) rank = null;

    const detoxScore = Math.min(100, Math.round(totalCO2 * 2));

    const storage_reduction_percent = storageReductionPercentOfBaseline(
      totalGB,
      baselineGb
    );

    res.json({

      co2_saved:totalCO2,
      gb_deleted:totalGB,
      baseline_storage_gb: Number(baselineGb.toFixed(2)),
      storage_reduction_percent,
      impact,
      weeks:weekly.rows,
      weeklyChart,
      rank,
      detox_score:detoxScore

    });

  }catch(err){

    console.error(err);

    res.status(500).json({
      error:"Participant stats failed"
    });

  }

};
const express = require("express");
const router = express.Router();
const { pool } = require("../lib/db");
const {
  baselineStorageGbFromRow,
  storageReductionPercentOfBaseline
} = require("../lib/baselineStorage");
const { calculateBaselineCO2 } = require("../services/co2Calculator");

router.get("/:id", async (req,res)=>{

  try{

    const { id } = req.params;

    const totals = await pool.query(
      `
      SELECT
        COALESCE(SUM(co2_saved),0) as co2_saved,
        COALESCE(SUM(screen_change),0) as screen_reduction,
        COALESCE(SUM(streaming_reduction),0) as streaming_reduction,
        COALESCE(SUM(gb_deleted),0) as gb_deleted
      FROM weekly_progress
      WHERE participant_id=$1
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

    const weekly = await pool.query(
      `
      SELECT
        week_number as week,
        COALESCE(co2_saved,0) as co2
      FROM weekly_progress
      WHERE participant_id=$1
      ORDER BY week_number
      `,
      [id]
    );

    let baseline_co2_kg = null;
    const br = baselineRes.rows[0];
    if (br) {
      if (br.baseline_co2_kg != null && Number.isFinite(Number(br.baseline_co2_kg))) {
        baseline_co2_kg = Number(Number(br.baseline_co2_kg).toFixed(4));
      } else {
        const raw = await calculateBaselineCO2(br);
        if (Number.isFinite(raw)) {
          baseline_co2_kg = Number(raw.toFixed(4));
        }
      }
    }

    res.json({
      co2_saved: Number(totals.rows[0].co2_saved),
      screen_reduction: Number(totals.rows[0].screen_reduction),
      streaming_reduction: Number(totals.rows[0].streaming_reduction),
      gb_deleted: gbDeleted,
      baseline_storage_gb: Number(baselineGb.toFixed(2)),
      storage_reduction_percent: storage_reduction_percent,
      baseline_co2_kg,
      weekly: weekly.rows
    });

  }catch(err){

    console.error("Impact error:",err);

    res.status(500).json({error:"Impact failed"});

  }

});

module.exports = router;
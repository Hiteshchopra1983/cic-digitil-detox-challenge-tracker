const express = require("express");
const router = express.Router();
const { pool } = require("../lib/db");

router.get("/", async (req,res)=>{

  try{

    const result = await pool.query(
      `
      SELECT
        p.id,
        p.name,
        COALESCE(SUM(w.co2_saved),0) as co2_saved
      FROM participants p
      LEFT JOIN weekly_progress w
      ON p.id = w.participant_id
      GROUP BY p.id
      ORDER BY co2_saved DESC
      LIMIT 20
      `
    );

    res.json(result.rows);

  }catch(err){

    console.error("Leaderboard error:",err);

    res.status(500).json({error:"Leaderboard failed"});

  }

});

module.exports = router;
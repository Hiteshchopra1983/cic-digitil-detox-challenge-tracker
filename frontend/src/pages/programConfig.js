const { pool } = require("../lib/db");

module.exports = async (req,res)=>{

  try{

    if(req.method === "GET"){

      const result = await pool.query(
        "SELECT * FROM program_config LIMIT 1"
      );

      return res.json(result.rows[0]);

    }

    if(req.method === "POST"){

      const d = req.body;

      await pool.query(

        `UPDATE program_config SET
        program_duration_weeks=$1,
        weekly_submission_gap_days=$2,
        baseline_lock=$3`,

        [
          d.program_duration,
          d.week_gap,
          d.baseline_lock
        ]

      );

      return res.json({success:true});

    }

  }catch(err){

    console.error(err);

    res.status(500).json({
      error:"Config failed"
    });

  }

};
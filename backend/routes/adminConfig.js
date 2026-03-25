const { pool } = require("../lib/db");
const { logAction } = require("../services/auditLogger");

module.exports = async (req,res)=>{

  try{

    if(req.method==="GET"){

      const result = await pool.query(
        "SELECT * FROM emission_config LIMIT 1"
      );

      return res.json(result.rows[0]);

    }

    if(req.method==="POST"){

      const d = req.body;

      await pool.query(`

        UPDATE emission_config SET

        streaming_per_hour=$1,
        tiktok_per_min=$2,
        instagram_per_min=$3,
        facebook_per_min=$4,
        youtube_scroll_per_min=$5,
        cloud_per_gb_year=$6,
        email_per=$7,
        text_per=$8,
        download_per_gb=$9

      `,
      [
        d.streaming,
        d.tiktok,
        d.instagram,
        d.facebook,
        d.youtube,
        d.cloud,
        d.email,
        d.text,
        d.download
      ]);

      await logAction({
        admin_id: req.user.id,
        action: "CONFIG_UPDATED",
        details: d
      });

      res.json({success:true});

    }

  }catch(err){

    console.error(err);
    res.status(500).json({error:"Config failed"});

  }
};
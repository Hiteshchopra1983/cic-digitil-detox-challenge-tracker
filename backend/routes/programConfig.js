const { pool } = require("../lib/db");

module.exports = async (req,res)=>{

try{

if(req.method==="GET"){

const config = await pool.query(
"SELECT * FROM program_config LIMIT 1"
);

return res.json(config.rows[0]);

}

if(req.method==="POST"){

const d=req.body;

await pool.query(`
UPDATE program_config
SET
program_duration_weeks=$1,
weekly_submission_gap_days=$2,
baseline_lock=$3
`,
[
d.program_duration_weeks,
d.weekly_submission_gap_days,
d.baseline_lock
]);

return res.json({success:true});

}

}catch(err){

console.error(err);
res.status(500).json({error:"Config error"});

}

};
const { pool } = require("../lib/db");

module.exports = async (req,res)=>{

try{

const id = req.params.id;

const weeks = await pool.query(
`SELECT COUNT(DISTINCT week_number)
FROM weekly_progress
WHERE participant_id=$1`,
[id]
);

const config = await pool.query(
"SELECT program_duration_weeks FROM program_config LIMIT 1"
);

const submitted = parseInt(weeks.rows[0].count);
const duration = config.rows[0].program_duration_weeks;

res.json({
completed: submitted >= duration,
submitted,
duration
});

}catch(err){

console.error(err);
res.status(500).json({error:"Completion check failed"});

}

};
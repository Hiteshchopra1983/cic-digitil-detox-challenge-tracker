const { pool } = require("../lib/db");
const { convertImpact } = require("../lib/impactCalculator");

module.exports = async (req,res)=>{

try{

const id = req.params.id;

/* total CO2 saved */

const total = await pool.query(`
SELECT COALESCE(SUM(co2_saved),0) as total_co2
FROM weekly_progress
WHERE participant_id=$1
`,[id]);

const co2 = Number(total.rows[0].total_co2);

/* impact equivalents */

const impact = convertImpact(co2);

/* weekly progress */

const weeks = await pool.query(`
SELECT COUNT(DISTINCT week_number) as submitted
FROM weekly_progress
WHERE participant_id=$1
`,[id]);

/* program duration */

const config = await pool.query(
"SELECT program_duration_weeks FROM program_config LIMIT 1"
);

const submitted = Number(weeks.rows[0].submitted);
const duration = config.rows[0].program_duration_weeks;

res.json({

completed: submitted >= duration,
submitted,
duration,
co2_saved: co2,
impact

});

}catch(err){

console.error(err);
res.status(500).json({error:"Impact summary failed"});

}

};
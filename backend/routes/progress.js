const { pool } = require("../lib/db");

module.exports = async (req,res)=>{

try{

const participant = req.params.id;

/* PROGRAM CONFIG */

const config = await pool.query(
`SELECT program_weeks FROM program_config LIMIT 1`
);

const duration = config.rows[0]?.program_weeks || 12;

/* WEEKLY SUBMISSIONS */

const weeks = await pool.query(
`SELECT week_number FROM weekly_progress
WHERE participant_id=$1`,
[participant]
);

const submittedWeeks = weeks.rows.map(w=>w.week_number);

/* BUILD WEEK STATUS */

let weekList=[];

for(let i=1;i<=duration;i++){

weekList.push({
week:i,
status:submittedWeeks.includes(i) ? "submitted":"pending"
});

}

res.json({
submitted:submittedWeeks.length,
duration:duration,
weeks:weekList
});

}catch(err){

console.error(err);
res.status(500).json({error:"Progress fetch failed"});

}

};
const { pool } = require("../lib/db");
const { sameParticipantId } = require("../lib/participantAuth");

module.exports = async (req,res)=>{

try{

const id = req.params.id;

if (!sameParticipantId(req.user && req.user.id, id)) {
  return res.status(403).json({ error: "Forbidden" });
}

await pool.query(
  `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS counts_as_weekly_submission boolean DEFAULT true`
);

const weeks = await pool.query(
`SELECT COUNT(DISTINCT week_number)::int AS submitted
FROM weekly_progress
WHERE participant_id=$1
AND COALESCE(counts_as_weekly_submission, true) = true`,
[id]
);

const config = await pool.query(
  `SELECT COALESCE(
     NULLIF(program_weeks, 0),
     NULLIF(program_duration_weeks, 0),
     6
   )::int AS duration
   FROM program_config LIMIT 1`
);

const submitted = Number(weeks.rows[0]?.submitted ?? 0);
const duration = Number(config.rows[0]?.duration) || 6;

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
const { pool } = require("../lib/db");
const { sameParticipantId } = require("../lib/participantAuth");
const {
  getCurrentOpenWeekNumber,
  getSuggestedSubmissionWeek
} = require("../lib/weeklySubmissionWindow");

module.exports = async (req,res)=>{

try{

const participant = req.params.id;

if (!sameParticipantId(req.user && req.user.id, participant)) {
  return res.status(403).json({ error: "Forbidden" });
}

await pool.query(
  `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS counts_as_weekly_submission boolean DEFAULT true`
);

/* PROGRAM CONFIG */

await pool.query(
  `ALTER TABLE program_config ADD COLUMN IF NOT EXISTS program_week_1_start_date date`
);

const config = await pool.query(
  `SELECT COALESCE(
     NULLIF(program_weeks, 0),
     NULLIF(program_duration_weeks, 0),
     6
   )::int AS duration,
   program_week_1_start_date
   FROM program_config LIMIT 1`
);

const duration = Number(config.rows[0]?.duration) || 6;
const programWeek1Start = config.rows[0]?.program_week_1_start_date ?? null;

/* WEEKLY SUBMISSIONS */

const weeks = await pool.query(
`SELECT week_number FROM weekly_progress
WHERE participant_id=$1
AND COALESCE(counts_as_weekly_submission, true) = true`,
[participant]
);

const submittedWeeks = weeks.rows
  .map((w) => Number(w.week_number))
  .filter((n) => Number.isFinite(n));

const now = new Date();
const suggested_week = getSuggestedSubmissionWeek(
  programWeek1Start,
  submittedWeeks,
  now,
  duration
);
const current_open_week = getCurrentOpenWeekNumber(
  programWeek1Start,
  now,
  duration
);

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
weeks:weekList,
suggested_week,
current_open_week
});

}catch(err){

console.error(err);
res.status(500).json({error:"Progress fetch failed"});

}

};
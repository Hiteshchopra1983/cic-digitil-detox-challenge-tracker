const { pool } = require("../lib/db");
const {
  baselineStorageGbFromRow,
  storageReductionPercentOfBaseline
} = require("../lib/baselineStorage");

module.exports = async (req,res)=>{

try{

/* CO2 SAVED PER WEEK */

const co2 = await pool.query(`
SELECT
week_number,
SUM(co2_saved) as co2
FROM weekly_progress
GROUP BY week_number
ORDER BY week_number
`);


/* STORAGE REDUCTION */

const storage = await pool.query(`
SELECT
week_number,
SUM(gb_deleted) as storage
FROM weekly_progress
GROUP BY week_number
ORDER BY week_number
`);


/* STREAMING REDUCTION */

const streaming = await pool.query(`
SELECT
week_number,
SUM(streaming_reduction_minutes) as streaming
FROM weekly_progress
GROUP BY week_number
ORDER BY week_number
`);


/* WEEKLY SUBMISSIONS */

const submissions = await pool.query(`
SELECT
week_number,
COUNT(*) as submissions
FROM weekly_progress
GROUP BY week_number
ORDER BY week_number
`);

const totalDeletedRes = await pool.query(`
SELECT COALESCE(SUM(gb_deleted),0) AS total FROM weekly_progress
`);
const totalGbDeleted = Number(totalDeletedRes.rows[0]?.total || 0);

const baselineRows = await pool.query(`
SELECT
  phone_devices,
  phone_storage_gb,
  laptop_devices,
  laptop_storage_gb,
  tablet_devices,
  tablet_storage_gb,
  cloud_accounts,
  cloud_storage_gb
FROM baseline_metrics bm
INNER JOIN participants p ON p.id = bm.participant_id AND p.role = 'participant'
`);
let totalBaselineGb = 0;
for (const row of baselineRows.rows) {
  totalBaselineGb += baselineStorageGbFromRow(row);
}
const storage_reduction_percent = storageReductionPercentOfBaseline(
  totalGbDeleted,
  totalBaselineGb
);

res.json({

co2:co2.rows,
storage:storage.rows,
streaming:streaming.rows,
submissions:submissions.rows,

storage_summary: {
  gb_deleted: totalGbDeleted,
  baseline_storage_gb: Number(totalBaselineGb.toFixed(2)),
  storage_reduction_percent
}

});

}catch(err){

console.error(err);
res.status(500).json({error:"Impact analytics failed"});

}

};
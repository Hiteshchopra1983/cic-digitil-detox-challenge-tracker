const { pool } = require("../lib/db");
const { convertImpact } = require("../services/impactCalculator");
const {
  baselineStorageGbFromRow,
  storageReductionPercentOfBaseline
} = require("../lib/baselineStorage");

module.exports = async (req,res)=>{

try{

/* TOTAL PARTICIPANTS */

const participants = await pool.query(`
SELECT COUNT(*) 
FROM participants 
WHERE role='participant'
`);


/* ACTIVE PARTICIPANTS */

const active = await pool.query(`
SELECT COUNT(DISTINCT participant_id) 
FROM weekly_progress
`);


/* INACTIVE PARTICIPANTS */

const inactive = await pool.query(`
SELECT COUNT(*)
FROM participants p
WHERE role='participant'
AND p.id NOT IN (
SELECT DISTINCT participant_id
FROM weekly_progress
)
`);


/* TOTAL STORAGE DELETED */

const storage = await pool.query(`
SELECT COALESCE(SUM(gb_deleted),0) as total
FROM weekly_progress
`);

const totalGB = Number(storage.rows[0].total);

/* BASELINE STORAGE FOOTPRINT (sum across participants with baseline) */

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
  totalGB,
  totalBaselineGb
);


/* TOTAL CO2 SAVED */

const co2 = await pool.query(`
SELECT COALESCE(SUM(co2_saved),0) as total
FROM weekly_progress
`);

const totalCO2 = Number(co2.rows[0].total);


/* TOTAL WEEKLY SUBMISSIONS */

const submissions = await pool.query(`
SELECT COUNT(*) 
FROM weekly_progress
`);


/* IMPACT CONVERSION */

const impact = convertImpact(totalCO2);


/* RESPONSE */

res.json({

participants: Number(participants.rows[0].count),

active_participants: Number(active.rows[0].count),

inactive_participants: Number(inactive.rows[0].count),

weekly_submissions: Number(submissions.rows[0].count),

gb_deleted: totalGB,

baseline_storage_gb: Number(totalBaselineGb.toFixed(2)),

storage_reduction_percent: storage_reduction_percent,

co2_saved: totalCO2,

impact

});

}catch(err){

console.error(err);

res.status(500).json({
error:"Admin stats failed"
});

}

};
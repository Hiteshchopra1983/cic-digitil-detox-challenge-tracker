const { pool } = require("../lib/db");

module.exports = async (req,res)=>{

try{

const result = await pool.query(`
SELECT
p.name,
p.email,
p.country,
p.city,
p.cohort,

b.phone_devices,
b.laptop_devices,
b.tablet_devices,
b.cloud_accounts,

w.week_number,
w.gb_deleted,
w.streaming_reduction_minutes,
w.screen_time_change,
w.downloads_avoided_gb,
w.emails_reduced,
w.messages_reduced,
w.co2_saved

FROM participants p

LEFT JOIN baseline_metrics b
ON p.id = b.participant_id

LEFT JOIN weekly_progress w
ON p.id = w.participant_id

WHERE p.role='participant'

ORDER BY p.name,w.week_number
`);

const rows = result.rows;

if(rows.length===0){
return res.status(404).json({error:"No data"});
}


/* Convert to CSV */

const headers = Object.keys(rows[0]).join(",");

const csvRows = rows.map(row =>
Object.values(row)
.map(v => `"${v ?? ""}"`)
.join(",")
);

const csv = [headers,...csvRows].join("\n");


res.setHeader("Content-Type","text/csv");
res.setHeader("Content-Disposition","attachment; filename=detox_data.csv");

res.send(csv);

}catch(err){

console.error(err);
res.status(500).json({error:"Export failed"});

}

};
const { pool } = require("../lib/db");
const { calculateBaselineCO2 } = require("../services/co2Calculator");

/** node-pg returns PostgreSQL `numeric` as string — normalize for JSON clients. */
function jsonNum(v) {
  if (v == null || v === "") return v;
  const x = Number(v);
  return Number.isFinite(x) ? x : v;
}

module.exports = async (req,res)=>{

try{

const participant_id = req.params.id;

const result = await pool.query(
"SELECT * FROM baseline_metrics WHERE participant_id=$1",
[participant_id]
);

if(result.rows.length === 0){

return res.json({
baseline_completed:false
});

}

const r = result.rows[0];

let baseline_co2_kg = 0;
if (r.baseline_co2_kg != null && Number.isFinite(Number(r.baseline_co2_kg))) {
  baseline_co2_kg = Number(Number(r.baseline_co2_kg).toFixed(4));
} else {
  const computed = await calculateBaselineCO2(r);
  baseline_co2_kg = Number(Number(computed).toFixed(4));
}

return res.json({
baseline_completed:true,
baseline_co2_kg,
data:{
phone_devices: jsonNum(r.phone_devices),
phone_storage_gb: jsonNum(r.phone_storage_gb),
laptop_devices: jsonNum(r.laptop_devices),
laptop_storage_gb: jsonNum(r.laptop_storage_gb),
tablet_devices: jsonNum(r.tablet_devices),
tablet_storage_gb: jsonNum(r.tablet_storage_gb),
cloud_accounts: jsonNum(r.cloud_accounts),
cloud_storage_gb: jsonNum(r.cloud_storage_gb),
mailbox_size_gb: jsonNum(r.mailbox_size_gb),
screen_time_hours: jsonNum(r.screen_time_hours),
streaming_hours_week: jsonNum(r.streaming_hours),
tiktok_minutes: jsonNum(r.tiktok_minutes),
instagram_minutes: jsonNum(r.instagram_minutes),
facebook_minutes: jsonNum(r.facebook_minutes),
youtube_minutes: jsonNum(r.youtube_minutes),
downloads_gb_week: jsonNum(r.downloads_gb_week)
}
});

}catch(err){

console.error(err);

res.status(500).json({
error:"Failed to load baseline"
});

}

};
const { pool } = require("../lib/db");
const { calculateBaselineCO2 } = require("../services/co2Calculator");

module.exports = async (req, res) => {
  try {
    const d = req.body;

/* check if baseline already exists */

const existing = await pool.query(
"SELECT * FROM baseline_metrics WHERE participant_id=$1",
[d.participant_id]
);

if(existing.rows.length > 0){

return res.status(400).json({
error:"Baseline already submitted"
});

}

await pool.query(`
ALTER TABLE baseline_metrics
ADD COLUMN IF NOT EXISTS baseline_co2_kg double precision
`);

const rowForCo2 = {
  participant_id: d.participant_id,
  phone_devices: d.phone_devices,
  phone_storage_gb: d.phone_storage_gb,
  laptop_devices: d.laptop_devices,
  laptop_storage_gb: d.laptop_storage_gb,
  tablet_devices: d.tablet_devices,
  tablet_storage_gb: d.tablet_storage_gb,
  cloud_accounts: d.cloud_accounts,
  cloud_storage_gb: d.cloud_storage_gb,
  screen_time_hours: d.screen_time_hours,
  streaming_hours: d.streaming_hours_week,
  tiktok_minutes: d.tiktok_minutes,
  instagram_minutes: d.instagram_minutes,
  facebook_minutes: d.facebook_minutes,
  youtube_minutes: d.youtube_minutes,
  downloads_gb_week: d.downloads_gb_week,
  emails_per_day: d.emails_per_day,
  texts_per_day: d.texts_per_day
};

const baseline_co2_kg = Number(
  Number(await calculateBaselineCO2(rowForCo2)).toFixed(4)
);

await pool.query(
  `
INSERT INTO baseline_metrics(
participant_id,
phone_devices,
phone_storage_gb,
laptop_devices,
laptop_storage_gb,
tablet_devices,
tablet_storage_gb,
cloud_accounts,
cloud_storage_gb,
screen_time_hours,
streaming_hours,
tiktok_minutes,
instagram_minutes,
facebook_minutes,
youtube_minutes,
downloads_gb_week,
baseline_co2_kg
)
VALUES(
$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
)
`,
  [
    d.participant_id,
    d.phone_devices,
    d.phone_storage_gb,
    d.laptop_devices,
    d.laptop_storage_gb,
    d.tablet_devices,
    d.tablet_storage_gb,
    d.cloud_accounts,
    d.cloud_storage_gb,
    d.screen_time_hours,
    d.streaming_hours_week,
    d.tiktok_minutes,
    d.instagram_minutes,
    d.facebook_minutes,
    d.youtube_minutes,
    d.downloads_gb_week,
    baseline_co2_kg
  ]
);

res.json({ success: true, baseline_co2_kg });

}catch(err){

console.error(err);

res.status(500).json({
error:"Baseline failed"
});

}

};
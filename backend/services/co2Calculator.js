const { pool } = require("../lib/db");
const { baselineStorageGbFromRow } = require("../lib/baselineStorage");
<<<<<<< HEAD
=======
const { calculateWeeklyCO2Savings: weeklyKgFromLib } = require("../lib/carbonCalculator");
>>>>>>> 0fc75de (Initial commit: digital detox tracker frontend and backend)

async function getConfig() {
  const res = await pool.query("SELECT * FROM emission_config LIMIT 1");
  return res.rows[0];
}

async function getCo2FactorsMap() {
  const res = await pool.query("SELECT key, value FROM co2_factors");
  const f = {};
  for (const r of res.rows) {
    f[r.key] = Number(r.value) || 0;
  }
  return f;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * emission_config: factors treated as grams per unit → result kg
 */
async function baselineKgFromEmissionConfig(d) {
  const c = (await getConfig()) || {};
  const row = d || {};

  let totalG = 0;

  const storageGb = baselineStorageGbFromRow(row);
  totalG += storageGb * num(c.cloud_per_gb_year);

  totalG += num(row.streaming_hours) * num(c.streaming_per_hour);
  totalG += num(row.tiktok_minutes) * num(c.tiktok_per_min);
  totalG += num(row.instagram_minutes) * num(c.instagram_per_min);
  totalG += num(row.facebook_minutes) * num(c.facebook_per_min);
  totalG += num(row.youtube_minutes) * num(c.youtube_scroll_per_min);
  totalG += num(row.emails_per_day) * num(c.email_per);
  totalG += num(row.texts_per_day) * num(c.text_per);
  totalG += num(row.downloads_gb_week) * num(c.download_per_gb);

  const kg = totalG / 1000;
  return Number.isFinite(kg) ? kg : 0;
}

/**
 * co2_factors: same convention as lib/carbonCalculator (impact per unit, no extra /1000)
 */
function baselineKgFromFactorsMap(d, f) {
  const row = d || {};
  const factors = f || {};

  const storageGb = baselineStorageGbFromRow(row);
  let total = 0;

  total += storageGb * num(factors.storage_per_gb);

  const streamHrs = num(row.streaming_hours);
  total += streamHrs * num(factors.streaming_per_hour);

  const dlGb = num(row.downloads_gb_week);
  total +=
    dlGb *
    num(
      factors.download_wifi_per_gb ||
        factors.download_mobile_per_gb ||
        factors.download_per_gb
    );

  total += num(row.tiktok_minutes) * num(factors.tiktok_per_min);
  total += num(row.instagram_minutes) * num(factors.instagram_per_min);
  total += num(row.facebook_minutes) * num(factors.facebook_per_min);
  total += num(row.youtube_minutes) * num(factors.youtube_per_min);

  total += num(row.emails_per_day) * num(factors.email_per_unit);
  total += num(row.texts_per_day) * num(factors.text_per_unit);

  return Number.isFinite(total) ? total : 0;
}

async function calculateBaselineCO2(data) {
  let kg = await baselineKgFromEmissionConfig(data);
  if (kg > 0) return kg;

  const map = await getCo2FactorsMap();
  if (Object.keys(map).length > 0) {
    kg = baselineKgFromFactorsMap(data, map);
    if (kg > 0) return kg;
  }

  return 0;
}

<<<<<<< HEAD
async function calculateWeeklyCO2Savings(data) {
  const c = (await getConfig()) || {};

  let saved = 0;

  saved += num(data.gb_deleted) * num(c.cloud_per_gb_year);

  saved += (num(data.streaming_reduction_minutes) / 60) * num(c.streaming_per_hour);

  saved += num(data.downloads_avoided_gb) * num(c.download_per_gb);

  saved += num(data.emails_reduced) * num(c.email_per);

  saved += num(data.messages_reduced) * num(c.text_per);

  return saved / 1000;
=======
/** Weekly savings (kg): single implementation in lib/carbonCalculator. */
async function calculateWeeklyCO2Savings(data) {
  return weeklyKgFromLib(data);
>>>>>>> 0fc75de (Initial commit: digital detox tracker frontend and backend)
}

module.exports = {
  calculateBaselineCO2,
  calculateWeeklyCO2Savings
};

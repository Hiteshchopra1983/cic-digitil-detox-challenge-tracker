const { pool } = require("../lib/db");
const { baselineStorageGbFromRow } = require("../lib/baselineStorage");
const {
  calculateWeeklyCO2Savings: weeklyKgFromLib,
  weeklyCo2Breakdown
} = require("../lib/carbonCalculator");

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

/** Baseline form: social + email/text are per day → scale to weekly. */
const DAYS_PER_WEEK = 7;
/**
 * Storage factors (cloud_per_gb_year g/GB·yr, storage_per_gb kg/GB·yr) are annual intensity;
 * baseline headline is interpreted as an estimated weekly footprint, so amortize storage / 52.
 */
const WEEKS_PER_YEAR = 52;

/**
 * emission_config: factors treated as grams per unit → result kg
 */
async function baselineKgFromEmissionConfig(d) {
  const c = (await getConfig()) || {};
  const row = d || {};

  let totalG = 0;

  const storageGb = baselineStorageGbFromRow(row);
  totalG += (storageGb * num(c.cloud_per_gb_year)) / WEEKS_PER_YEAR;

  totalG += num(row.streaming_hours) * num(c.streaming_per_hour);
  totalG += num(row.tiktok_minutes) * DAYS_PER_WEEK * num(c.tiktok_per_min);
  totalG += num(row.instagram_minutes) * DAYS_PER_WEEK * num(c.instagram_per_min);
  totalG += num(row.facebook_minutes) * DAYS_PER_WEEK * num(c.facebook_per_min);
  totalG += num(row.youtube_minutes) * DAYS_PER_WEEK * num(c.youtube_scroll_per_min);
  totalG += num(row.emails_per_day) * DAYS_PER_WEEK * num(c.email_per);
  totalG += num(row.texts_per_day) * DAYS_PER_WEEK * num(c.text_per);
  totalG += num(row.downloads_gb_week) * num(c.download_per_gb);
  totalG += num(row.llm_queries_per_week) * num(c.llm_per_query);

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

  total += (storageGb * num(factors.storage_per_gb)) / WEEKS_PER_YEAR;

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

  total += num(row.tiktok_minutes) * DAYS_PER_WEEK * num(factors.tiktok_per_min);
  total += num(row.instagram_minutes) * DAYS_PER_WEEK * num(factors.instagram_per_min);
  total += num(row.facebook_minutes) * DAYS_PER_WEEK * num(factors.facebook_per_min);
  total += num(row.youtube_minutes) * DAYS_PER_WEEK * num(factors.youtube_per_min);

  total += num(row.emails_per_day) * DAYS_PER_WEEK * num(factors.email_per_unit);
  total += num(row.texts_per_day) * DAYS_PER_WEEK * num(factors.text_per_unit);

  const llmG = num(factors.llm_per_query);
  if (llmG > 0) {
    total += (num(row.llm_queries_per_week) * llmG) / 1000;
  }

  return Number.isFinite(total) ? total : 0;
}

async function calculateBaselineCO2(data) {
  try {
    let kg = await baselineKgFromEmissionConfig(data);
    if (kg > 0) return kg;

    const map = await getCo2FactorsMap();
    if (Object.keys(map).length > 0) {
      kg = baselineKgFromFactorsMap(data, map);
      if (kg > 0) return kg;
    }

    return 0;
  } catch (err) {
    console.error("calculateBaselineCO2:", err?.message || err);
    return 0;
  }
}

/** Weekly savings (kg): single implementation in lib/carbonCalculator. */
async function calculateWeeklyCO2Savings(data) {
  return weeklyKgFromLib(data);
}

module.exports = {
  calculateBaselineCO2,
  calculateWeeklyCO2Savings,
  weeklyCo2Breakdown
};

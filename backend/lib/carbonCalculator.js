const { pool } = require("./db");

async function getFactors() {
  const res = await pool.query("SELECT * FROM co2_factors");

  const f = {};

  res.rows.forEach((r) => {
    f[r.key] = Number(r.value);
  });

  return f;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Normalize request body or weekly_progress DB row for weekly CO₂. */
function normalizeWeeklyPayload(w) {
  const x = w || {};
  return {
    gb_deleted: num(x.gb_deleted),
    downloads_avoided_gb: num(x.downloads_avoided_gb),
    streaming_reduction_minutes: num(x.streaming_reduction_minutes),
    screen_time_change_minutes: num(
      x.screen_time_change_minutes ?? x.screen_time_change
    ),
    emails_reduced: num(x.emails_reduced),
    messages_reduced: num(x.messages_reduced),
    tiktok_reduction_minutes: num(x.tiktok_reduction_minutes),
    instagram_reduction_minutes: num(x.instagram_reduction_minutes),
    facebook_reduction_minutes: num(x.facebook_reduction_minutes),
    youtube_reduction_minutes: num(x.youtube_reduction_minutes)
  };
}

/**
 * Weekly CO₂ savings (kg) using co2_factors (same units as baseline factors path).
 */
function weeklyKgFromFactors(w, f) {
  let total = 0;
  total += num(w.gb_deleted) * num(f.storage_per_gb);
  total += (num(w.streaming_reduction_minutes) / 60) * num(f.streaming_per_hour);
  total += (num(w.screen_time_change_minutes) / 60) * num(f.streaming_per_hour);
  const dl =
    num(f.download_wifi_per_gb) || num(f.download_mobile_per_gb);
  total += num(w.downloads_avoided_gb) * dl;
  total += num(w.emails_reduced) * num(f.email_per_unit);
  total += num(w.messages_reduced) * num(f.text_per_unit);
  total += num(w.tiktok_reduction_minutes) * num(f.tiktok_per_min);
  total += num(w.instagram_reduction_minutes) * num(f.instagram_per_min);
  total += num(w.facebook_reduction_minutes) * num(f.facebook_per_min);
  total += num(w.youtube_reduction_minutes) * num(f.youtube_per_min);
  return total;
}

/**
 * Fallback when co2_factors is empty or all zero: emission_config (grams) → kg.
 */
async function weeklyKgFromEmissionConfig(w) {
  const res = await pool.query("SELECT * FROM emission_config LIMIT 1");
  const c = res.rows[0];
  if (!c) return 0;

  let g = 0;
  g += num(w.gb_deleted) * num(c.cloud_per_gb_year);
  g += (num(w.streaming_reduction_minutes) / 60) * num(c.streaming_per_hour);
  g += (num(w.screen_time_change_minutes) / 60) * num(c.streaming_per_hour);
  g += num(w.downloads_avoided_gb) * num(c.download_per_gb);
  g += num(w.emails_reduced) * num(c.email_per);
  g += num(w.messages_reduced) * num(c.text_per);
  g += num(w.tiktok_reduction_minutes) * num(c.tiktok_per_min);
  g += num(w.instagram_reduction_minutes) * num(c.instagram_per_min);
  g += num(w.facebook_reduction_minutes) * num(c.facebook_per_min);
  g += num(w.youtube_reduction_minutes) * num(c.youtube_scroll_per_min);

  return g / 1000;
}

async function calculateWeeklyCO2Savings(w) {
  const p = normalizeWeeklyPayload(w);
  const f = await getFactors();
  const hasPositiveFactor =
    Object.keys(f).length > 0 &&
    Object.values(f).some((v) => num(v) > 0);

  const fromFactors = weeklyKgFromFactors(p, f);

  if (hasPositiveFactor && fromFactors > 0) {
    return Number(fromFactors.toFixed(6));
  }

  const fromEmission = await weeklyKgFromEmissionConfig(p);
  return Number(fromEmission.toFixed(6));
}

module.exports = {
  calculateWeeklyCO2Savings
};

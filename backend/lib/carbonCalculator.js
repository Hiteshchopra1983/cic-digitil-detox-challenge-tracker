const { pool } = require("./db");

async function getFactors() {
  const res = await pool.query("SELECT * FROM co2_factors");

  const f = {};

  res.rows.forEach((r) => {
    f[r.key] = Number(r.value);
  });

  return f;
}

<<<<<<< HEAD
async function storageCO2(gb) {
  const f = await getFactors();

  return (Number(gb) || 0) * (f.storage_per_gb || 0);
}

async function streamingCO2(minutes) {
  const f = await getFactors();

  return ((Number(minutes) || 0) / 60) * (f.streaming_per_hour || 0);
}

async function emailCO2(emails) {
  const f = await getFactors();

  return (Number(emails) || 0) * (f.email_per_unit || 0);
}

async function textsCO2(texts) {
  const f = await getFactors();

  return (Number(texts) || 0) * (f.text_per_unit || 0);
}

async function downloadCO2(gb, network = "wifi") {
  const f = await getFactors();

  if (network === "mobile") {
    return (Number(gb) || 0) * (f.download_mobile_per_gb || 0);
  }

  return (Number(gb) || 0) * (f.download_wifi_per_gb || 0);
}

async function scrollingCO2(platform, minutes) {
  const f = await getFactors();

  const map = {
    tiktok: f.tiktok_per_min || 0,
    instagram: f.instagram_per_min || 0,
    facebook: f.facebook_per_min || 0,
    youtube: f.youtube_per_min || 0
  };

  return (Number(minutes) || 0) * (map[platform] || 0);
}

async function calculateWeeklyCO2Savings(w) {
  let total = 0;

  total += await storageCO2(w.gb_deleted);

  total += await streamingCO2(w.streaming_reduction_minutes);

  total += await downloadCO2(w.downloads_avoided_gb);

  total += await emailCO2(w.emails_reduced);
  total += await textsCO2(w.messages_reduced);

  total += await scrollingCO2("tiktok", w.tiktok_reduction_minutes);
  total += await scrollingCO2("instagram", w.instagram_reduction_minutes);
  total += await scrollingCO2("facebook", w.facebook_reduction_minutes);
  total += await scrollingCO2("youtube", w.youtube_reduction_minutes);

  return total;
=======
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
>>>>>>> 0fc75de (Initial commit: digital detox tracker frontend and backend)
}

module.exports = {
  calculateWeeklyCO2Savings
};

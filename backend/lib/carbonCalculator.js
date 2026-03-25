const { pool } = require("./db");

async function getFactors() {
  const res = await pool.query("SELECT * FROM co2_factors");

  const f = {};

  res.rows.forEach((r) => {
    f[r.key] = Number(r.value);
  });

  return f;
}

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
}

module.exports = {
  calculateWeeklyCO2Savings
};

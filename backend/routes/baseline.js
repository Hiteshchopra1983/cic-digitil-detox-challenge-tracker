const { pool } = require("../lib/db");
const { calculateBaselineCO2 } = require("../services/co2Calculator");
const {
  intMetric,
  decimalMetricGb,
  decimalMetricMinutes
} = require("../lib/metrics");

function normId(v) {
  if (v == null) return "";
  const s = String(v).trim();
  const uuidish =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidish.test(s)) return s.toLowerCase();
  return s;
}

function pgUserMessage(err) {
  const code = err && err.code;
  if (code === "23505") {
    return "Baseline already submitted for this account.";
  }
  if (code === "23503") {
    return "Your account was not found or is no longer valid. Please log out and log in again.";
  }
  if (code === "22003") {
    return "One or more numbers are too large. Use smaller values and try again.";
  }
  if (code === "22P02") {
    return "Invalid account id. Please log out and log in again.";
  }
  if (code === "42P01" || /relation .* does not exist/i.test(String(err.message || ""))) {
    return "Database setup is incomplete. Please contact support.";
  }
  return null;
}

module.exports = async (req, res) => {
  try {
    const raw = req.body || {};
    const participant_id = normId(raw.participant_id);

    if (!participant_id) {
      return res.status(400).json({ error: "participant_id is required" });
    }

    const tokenId = normId(req.user && req.user.id);
    if (!tokenId || tokenId !== participant_id) {
      return res.status(403).json({
        error:
          "This submission does not match your logged-in account. Please log out and log in again."
      });
    }

    let participantCheck;
    try {
      participantCheck = await pool.query(
        "SELECT 1 FROM participants WHERE id = $1 LIMIT 1",
        [participant_id]
      );
    } catch (e) {
      const u = pgUserMessage(e);
      if (u) return res.status(400).json({ error: u });
      throw e;
    }

    if (participantCheck.rows.length === 0) {
      return res.status(400).json({
        error:
          "Your account was not found. Please log out and sign in again, or register a new account."
      });
    }

    let existing;
    try {
      existing = await pool.query(
        "SELECT 1 FROM baseline_metrics WHERE participant_id = $1 LIMIT 1",
        [participant_id]
      );
    } catch (e) {
      const u = pgUserMessage(e);
      if (u) return res.status(500).json({ error: u });
      throw e;
    }

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Baseline already submitted" });
    }

    await pool.query(`
ALTER TABLE baseline_metrics
ADD COLUMN IF NOT EXISTS baseline_co2_kg double precision
`);

    const d = {
      participant_id,
      phone_devices: intMetric(raw.phone_devices),
      phone_storage_gb: decimalMetricGb(raw.phone_storage_gb),
      laptop_devices: intMetric(raw.laptop_devices),
      laptop_storage_gb: decimalMetricGb(raw.laptop_storage_gb),
      tablet_devices: intMetric(raw.tablet_devices),
      tablet_storage_gb: decimalMetricGb(raw.tablet_storage_gb),
      cloud_accounts: intMetric(raw.cloud_accounts),
      cloud_storage_gb: decimalMetricGb(raw.cloud_storage_gb),
      screen_time_hours: decimalMetricMinutes(raw.screen_time_hours),
      streaming_hours_week: decimalMetricMinutes(raw.streaming_hours_week),
      tiktok_minutes: decimalMetricMinutes(raw.tiktok_minutes),
      instagram_minutes: decimalMetricMinutes(raw.instagram_minutes),
      facebook_minutes: decimalMetricMinutes(raw.facebook_minutes),
      youtube_minutes: decimalMetricMinutes(raw.youtube_minutes),
      downloads_gb_week: decimalMetricGb(raw.downloads_gb_week),
      emails_per_day: intMetric(raw.emails_per_day),
      texts_per_day: intMetric(raw.texts_per_day)
    };

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

    let baseline_co2_kg = 0;
    try {
      const computed = await calculateBaselineCO2(rowForCo2);
      baseline_co2_kg = Number(Number(computed).toFixed(4));
    } catch (co2Err) {
      console.error("baseline CO2 calculation:", co2Err?.message || co2Err);
      baseline_co2_kg = 0;
    }
    if (!Number.isFinite(baseline_co2_kg) || baseline_co2_kg < 0) {
      baseline_co2_kg = 0;
    }

    try {
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
    } catch (insertErr) {
      const u = pgUserMessage(insertErr);
      console.error("baseline insert:", insertErr?.code, insertErr?.message || insertErr);
      if (u) {
        const st = insertErr.code === "42P01" ? 500 : 400;
        return res.status(st).json({ error: u });
      }
      throw insertErr;
    }

    res.json({ success: true, baseline_co2_kg });
  } catch (err) {
    const u = pgUserMessage(err);
    console.error("baseline route:", err?.code || "", err?.message || err);
    if (u) {
      return res.status(500).json({ error: u });
    }
    res.status(500).json({
      error:
        "Baseline could not be saved. Please try again, check your numbers, or contact support if this continues."
    });
  }
};

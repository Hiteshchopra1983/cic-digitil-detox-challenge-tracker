const { pool } = require("./db");

let cachedFactors = null;
let cachedFactorsAt = 0;
const FACTORS_CACHE_MS = 30_000;

async function getFactors() {
  if (cachedFactors && Date.now() - cachedFactorsAt < FACTORS_CACHE_MS) {
    return cachedFactors;
  }
  const res = await pool.query("SELECT * FROM co2_factors");

  const f = {};

  res.rows.forEach((r) => {
    f[r.key] = Number(r.value);
  });

  cachedFactors = f;
  cachedFactorsAt = Date.now();
  return f;
}

let cachedEmissionRow = null;
let cachedEmissionAt = 0;
let cachedEmissionValid = false;

async function getEmissionConfigRow() {
  if (cachedEmissionValid && Date.now() - cachedEmissionAt < FACTORS_CACHE_MS) {
    return cachedEmissionRow;
  }
  const res = await pool.query("SELECT * FROM emission_config LIMIT 1");
  cachedEmissionRow = res.rows[0] || null;
  cachedEmissionAt = Date.now();
  cachedEmissionValid = true;
  return cachedEmissionRow;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Weekly form: streaming + screen reductions are totals for the week; social reductions are per day → ×7. */
const DAYS_PER_WEEK = 7;
/** Storage factors are annual intensity (g/GB·yr or kg/GB·yr); credit 1/52 per reported week. */
const WEEKS_PER_YEAR = 52;

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
    youtube_reduction_minutes: num(x.youtube_reduction_minutes),
    llm_queries_reduced: num(x.llm_queries_reduced)
  };
}

/**
 * Weekly CO₂ savings (kg) using co2_factors (same units as baseline factors path).
 */
function weeklyKgFromFactors(w, f) {
  let total = 0;
  total += (num(w.gb_deleted) * num(f.storage_per_gb)) / WEEKS_PER_YEAR;
  total += (num(w.streaming_reduction_minutes) / 60) * num(f.streaming_per_hour);
  total +=
    (num(w.screen_time_change_minutes) / 60) * num(f.streaming_per_hour);
  const dl =
    num(f.download_wifi_per_gb) || num(f.download_mobile_per_gb);
  total += num(w.downloads_avoided_gb) * dl;
  total += num(w.emails_reduced) * num(f.email_per_unit);
  total += num(w.messages_reduced) * num(f.text_per_unit);
  total +=
    num(w.tiktok_reduction_minutes) * DAYS_PER_WEEK * num(f.tiktok_per_min);
  total +=
    num(w.instagram_reduction_minutes) * DAYS_PER_WEEK * num(f.instagram_per_min);
  total +=
    num(w.facebook_reduction_minutes) * DAYS_PER_WEEK * num(f.facebook_per_min);
  total +=
    num(w.youtube_reduction_minutes) * DAYS_PER_WEEK * num(f.youtube_per_min);
  const llmG = num(f.llm_per_query);
  if (llmG > 0) {
    total += (num(w.llm_queries_reduced) * llmG) / 1000;
  }
  return total;
}

/**
 * Fallback when co2_factors is empty or all zero: emission_config (grams) → kg.
 */
async function weeklyKgFromEmissionConfig(w) {
  const c = await getEmissionConfigRow();
  if (!c) return 0;

  let g = 0;
  g += (num(w.gb_deleted) * num(c.cloud_per_gb_year)) / WEEKS_PER_YEAR;
  g += (num(w.streaming_reduction_minutes) / 60) * num(c.streaming_per_hour);
  g +=
    (num(w.screen_time_change_minutes) / 60) * num(c.streaming_per_hour);
  g += num(w.downloads_avoided_gb) * num(c.download_per_gb);
  g += num(w.emails_reduced) * num(c.email_per);
  g += num(w.messages_reduced) * num(c.text_per);
  g +=
    num(w.tiktok_reduction_minutes) * DAYS_PER_WEEK * num(c.tiktok_per_min);
  g +=
    num(w.instagram_reduction_minutes) * DAYS_PER_WEEK * num(c.instagram_per_min);
  g +=
    num(w.facebook_reduction_minutes) * DAYS_PER_WEEK * num(c.facebook_per_min);
  g +=
    num(w.youtube_reduction_minutes) * DAYS_PER_WEEK * num(c.youtube_scroll_per_min);
  g += num(w.llm_queries_reduced) * num(c.llm_per_query);

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

/**
 * Line-by-line weekly CO₂ avoided (kg) for transparency (same inputs as calculateWeeklyCO2Savings).
 */
async function weeklyCo2Breakdown(w) {
  const p = normalizeWeeklyPayload(w);
  const f = await getFactors();
  const hasPositiveFactor =
    Object.keys(f).length > 0 &&
    Object.values(f).some((v) => num(v) > 0);

  const fromFactors = weeklyKgFromFactors(p, f);

  if (hasPositiveFactor && fromFactors > 0) {
    const dl = num(f.download_wifi_per_gb) || num(f.download_mobile_per_gb);
    const lines = [
      {
        key: "gb_deleted",
        label: "Storage removed",
        kg: (num(p.gb_deleted) * num(f.storage_per_gb)) / WEEKS_PER_YEAR,
        detail: `${num(p.gb_deleted)} GB × ${num(f.storage_per_gb)} kg/GB·yr ÷ ${WEEKS_PER_YEAR} (weekly slice)`
      },
      {
        key: "streaming_reduction",
        label: "Streaming time reduction",
        kg: (num(p.streaming_reduction_minutes) / 60) * num(f.streaming_per_hour),
        detail: `(${num(p.streaming_reduction_minutes)} min ÷ 60) × ${num(f.streaming_per_hour)} kg/h`
      },
      {
        key: "screen_time_change",
        label: "Screen time reduction",
        kg:
          (num(p.screen_time_change_minutes) / 60) * num(f.streaming_per_hour),
        detail: `(${num(p.screen_time_change_minutes)} min ÷ 60) × ${num(f.streaming_per_hour)} kg/h`
      },
      {
        key: "downloads_avoided",
        label: "Downloads avoided",
        kg: num(p.downloads_avoided_gb) * dl,
        detail: `${num(p.downloads_avoided_gb)} GB × ${num(dl)} kg/GB (Wi‑Fi or mobile factor)`
      },
      {
        key: "emails_reduced",
        label: "Emails reduced",
        kg: num(p.emails_reduced) * num(f.email_per_unit),
        detail: `${num(p.emails_reduced)} × ${num(f.email_per_unit)} kg/email`
      },
      {
        key: "messages_reduced",
        label: "Messages reduced",
        kg: num(p.messages_reduced) * num(f.text_per_unit),
        detail: `${num(p.messages_reduced)} × ${num(f.text_per_unit)} kg/message`
      },
      {
        key: "tiktok_reduction",
        label: "TikTok reduction",
        kg:
          num(p.tiktok_reduction_minutes) * DAYS_PER_WEEK * num(f.tiktok_per_min),
        detail: `${num(p.tiktok_reduction_minutes)} min/day × ${DAYS_PER_WEEK} × ${num(f.tiktok_per_min)} kg/min`
      },
      {
        key: "instagram_reduction",
        label: "Instagram reduction",
        kg:
          num(p.instagram_reduction_minutes) *
          DAYS_PER_WEEK *
          num(f.instagram_per_min),
        detail: `${num(p.instagram_reduction_minutes)} min/day × ${DAYS_PER_WEEK} × ${num(f.instagram_per_min)} kg/min`
      },
      {
        key: "facebook_reduction",
        label: "Facebook reduction",
        kg:
          num(p.facebook_reduction_minutes) *
          DAYS_PER_WEEK *
          num(f.facebook_per_min),
        detail: `${num(p.facebook_reduction_minutes)} min/day × ${DAYS_PER_WEEK} × ${num(f.facebook_per_min)} kg/min`
      },
      {
        key: "youtube_reduction",
        label: "YouTube reduction",
        kg:
          num(p.youtube_reduction_minutes) * DAYS_PER_WEEK * num(f.youtube_per_min),
        detail: `${num(p.youtube_reduction_minutes)} min/day × ${DAYS_PER_WEEK} × ${num(f.youtube_per_min)} kg/min`
      },
      {
        key: "llm_queries_reduced",
        label: "LLM queries reduced",
        kg: (num(p.llm_queries_reduced) * num(f.llm_per_query)) / 1000,
        detail: `${num(p.llm_queries_reduced)} queries × (${num(f.llm_per_query)} g/query ÷ 1000)`
      }
    ];
    return {
      mode: "factors",
      total_kg: Number(fromFactors.toFixed(6)),
      lines: lines.map((l) => ({
        ...l,
        kg: Number(Number(l.kg).toFixed(6))
      }))
    };
  }

  const c = await getEmissionConfigRow();
  if (!c) {
    return { mode: "emission", total_kg: 0, lines: [] };
  }

  const gStorage =
    (num(p.gb_deleted) * num(c.cloud_per_gb_year)) / WEEKS_PER_YEAR;
  const gStream =
    (num(p.streaming_reduction_minutes) / 60) * num(c.streaming_per_hour);
  const gScreen =
    (num(p.screen_time_change_minutes) / 60) * num(c.streaming_per_hour);
  const gDl = num(p.downloads_avoided_gb) * num(c.download_per_gb);
  const gEm = num(p.emails_reduced) * num(c.email_per);
  const gTx = num(p.messages_reduced) * num(c.text_per);
  const gTk =
    num(p.tiktok_reduction_minutes) * DAYS_PER_WEEK * num(c.tiktok_per_min);
  const gIg =
    num(p.instagram_reduction_minutes) * DAYS_PER_WEEK * num(c.instagram_per_min);
  const gFb =
    num(p.facebook_reduction_minutes) * DAYS_PER_WEEK * num(c.facebook_per_min);
  const gYt =
    num(p.youtube_reduction_minutes) * DAYS_PER_WEEK * num(c.youtube_scroll_per_min);
  const gLlm = num(p.llm_queries_reduced) * num(c.llm_per_query);

  const lines = [
    {
      key: "gb_deleted",
      label: "Storage removed",
      kg: Number((gStorage / 1000).toFixed(6)),
      detail: `${num(p.gb_deleted)} GB × ${num(c.cloud_per_gb_year)} g/GB·yr ÷ ${WEEKS_PER_YEAR} wks ÷ 1000`
    },
    {
      key: "streaming_reduction",
      label: "Streaming time reduction",
      kg: Number((gStream / 1000).toFixed(6)),
      detail: `(${num(p.streaming_reduction_minutes)} min ÷ 60) × ${num(c.streaming_per_hour)} g/h ÷ 1000`
    },
    {
      key: "screen_time_change",
      label: "Screen time reduction",
      kg: Number((gScreen / 1000).toFixed(6)),
      detail: `(${num(p.screen_time_change_minutes)} min ÷ 60) × ${num(c.streaming_per_hour)} g/h ÷ 1000`
    },
    {
      key: "downloads_avoided",
      label: "Downloads avoided",
      kg: Number((gDl / 1000).toFixed(6)),
      detail: `${num(p.downloads_avoided_gb)} GB × ${num(c.download_per_gb)} g/GB ÷ 1000`
    },
    {
      key: "emails_reduced",
      label: "Emails reduced",
      kg: Number((gEm / 1000).toFixed(6)),
      detail: `${num(p.emails_reduced)} × ${num(c.email_per)} g ÷ 1000`
    },
    {
      key: "messages_reduced",
      label: "Messages reduced",
      kg: Number((gTx / 1000).toFixed(6)),
      detail: `${num(p.messages_reduced)} × ${num(c.text_per)} g ÷ 1000`
    },
    {
      key: "tiktok_reduction",
      label: "TikTok reduction",
      kg: Number((gTk / 1000).toFixed(6)),
      detail: `${num(p.tiktok_reduction_minutes)} min/day × ${DAYS_PER_WEEK} × ${num(c.tiktok_per_min)} g/min ÷ 1000`
    },
    {
      key: "instagram_reduction",
      label: "Instagram reduction",
      kg: Number((gIg / 1000).toFixed(6)),
      detail: `${num(p.instagram_reduction_minutes)} min/day × ${DAYS_PER_WEEK} × ${num(c.instagram_per_min)} g/min ÷ 1000`
    },
    {
      key: "facebook_reduction",
      label: "Facebook reduction",
      kg: Number((gFb / 1000).toFixed(6)),
      detail: `${num(p.facebook_reduction_minutes)} min/day × ${DAYS_PER_WEEK} × ${num(c.facebook_per_min)} g/min ÷ 1000`
    },
    {
      key: "youtube_reduction",
      label: "YouTube reduction",
      kg: Number((gYt / 1000).toFixed(6)),
      detail: `${num(p.youtube_reduction_minutes)} min/day × ${DAYS_PER_WEEK} × ${num(c.youtube_scroll_per_min)} g/min ÷ 1000`
    },
    {
      key: "llm_queries_reduced",
      label: "LLM queries reduced",
      kg: Number((gLlm / 1000).toFixed(6)),
      detail: `${num(p.llm_queries_reduced)} queries × ${num(c.llm_per_query)} g/query ÷ 1000`
    }
  ];

  const totalKg = await weeklyKgFromEmissionConfig(p);

  return {
    mode: "emission",
    total_kg: Number(Number(totalKg).toFixed(6)),
    lines
  };
}

module.exports = {
  calculateWeeklyCO2Savings,
  weeklyCo2Breakdown
};

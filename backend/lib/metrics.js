const INT4_MAX = 2147483647;

/** Sane ceiling so absurd payloads cannot blow up numeric columns or CO₂ math. */
const DECIMAL_ABS_MAX = 1e12;

function n(v, fallback = 0) {
  if (v === "" || v == null) return fallback;
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

/** Counts / device integers — must fit int4. */
function intMetric(v, fallback = 0) {
  const x = n(v, fallback);
  const r = Math.round(x);
  if (!Number.isFinite(r)) return fallback;
  if (r < 0) return 0;
  if (r > INT4_MAX) return INT4_MAX;
  return r;
}

/**
 * GB-like or other measurements stored as numeric(14,4).
 * Preserves decimals; clamps range; limits fractional digits for stable storage.
 */
function decimalMetricGb(v, fallback = 0) {
  return decimalMetric(v, fallback, 4);
}

/**
 * Hours / minutes stored as numeric(14,2).
 */
function decimalMetricMinutes(v, fallback = 0) {
  return decimalMetric(v, fallback, 2);
}

function decimalMetric(v, fallback = 0, maxFractionDigits = 4) {
  const x = n(v, fallback);
  if (!Number.isFinite(x)) return fallback;
  if (x < 0) return 0;
  if (x > DECIMAL_ABS_MAX) return DECIMAL_ABS_MAX;
  return Number(x.toFixed(maxFractionDigits));
}

module.exports = {
  INT4_MAX,
  DECIMAL_ABS_MAX,
  n,
  intMetric,
  decimalMetric,
  decimalMetricGb,
  decimalMetricMinutes
};

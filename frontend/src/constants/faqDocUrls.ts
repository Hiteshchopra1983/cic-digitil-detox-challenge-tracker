const baselineFromEnv = (
  import.meta.env.VITE_HELP_DOC_URL as string | undefined
)?.trim();
const weeklyFromEnv = (
  import.meta.env.VITE_WEEKLY_FAQ_DOC_URL as string | undefined
)?.trim();
const tradeOffsFromEnv = (
  import.meta.env.VITE_DIGITAL_TRADE_OFFS_DOC_URL as string | undefined
)?.trim();

/**
 * Hosted Baseline Assessment FAQ (opens in a new tab).
 * Set VITE_HELP_DOC_URL to override (e.g. http://localhost:5173/baseline-assessment-faq.html).
 */
export const BASELINE_FAQ_DOC_URL =
  baselineFromEnv ||
  "https://baselinefaq.s3.eu-west-3.amazonaws.com/baseline-assessment-faq.html";

/**
 * Hosted Weekly Tracker FAQ (opens in a new tab).
 * Set VITE_WEEKLY_FAQ_DOC_URL after uploading to S3.
 */
export const WEEKLY_TRACKER_FAQ_DOC_URL =
  weeklyFromEnv ||
  "https://weeklytrackerfaq.s3.eu-west-3.amazonaws.com/weekly-tracker-faq.html";

/**
 * Common trade-offs & simple swaps (hosted static page; opens in a new tab).
 * Set VITE_DIGITAL_TRADE_OFFS_DOC_URL to override (e.g. http://localhost:5173/digital-trade-offs-swaps.html for local editing).
 */
export const DIGITAL_TRADE_OFFS_DOC_URL =
  tradeOffsFromEnv ||
  "https://weeklytradeoff.s3.eu-west-3.amazonaws.com/digital-trade-offs-swaps.html";

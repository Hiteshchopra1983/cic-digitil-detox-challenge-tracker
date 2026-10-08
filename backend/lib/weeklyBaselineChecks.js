const { baselineStorageGbFromRow } = require("./baselineStorage");

/** Baseline row stores weekly streaming as `streaming_hours` (hours/week). */
function streamingBaselineMinutesFromRow(row) {
  if (!row) return 0;
  const hrs = Number(row.streaming_hours);
  if (!Number.isFinite(hrs) || hrs <= 0) return 0;
  return hrs * 60;
}

/** Baseline row stores average daily screen time as `screen_time_hours` (hours/day) → weekly minutes. */
function screenBaselineWeeklyMinutesFromRow(row) {
  if (!row) return 0;
  const hrs = Number(row.screen_time_hours);
  if (!Number.isFinite(hrs) || hrs <= 0) return 0;
  return hrs * 60 * 7;
}

/**
 * Ensures weekly "reduction" claims do not exceed what the baseline allows
 * (avoids inflated CO₂ and nonsensical % vs baseline).
 *
 * @param {number} deletedGb — normalized `storage_deleted_gb` for this submission
 * @param {number} streamingReductionMinutes — normalized `streaming_reduction_minutes`
 * @param {number} screenTimeReductionMinutes — normalized `screen_time_change_minutes` (minutes less this week vs usual week)
 * @param {object|undefined} baselineRow — row from `baseline_metrics` or undefined
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
function validateWeeklyAgainstBaseline(
  deletedGb,
  streamingReductionMinutes,
  screenTimeReductionMinutes,
  baselineRow
) {
  const del = Number(deletedGb) || 0;
  const streamMin = Number(streamingReductionMinutes) || 0;
  const screenMin = Number(screenTimeReductionMinutes) || 0;
  const eps = 1e-3;

  const baseGb = baselineStorageGbFromRow(baselineRow);
  if (baseGb > 0 && del > baseGb + eps) {
    return {
      ok: false,
      error: `Storage removed (${del.toFixed(2)} GB) cannot be greater than your baseline total storage footprint (${baseGb.toFixed(2)} GB). If this no longer matches your situation, ask an administrator to reset your baseline.`
    };
  }

  const capStreamMin = streamingBaselineMinutesFromRow(baselineRow);
  if (capStreamMin > 0 && streamMin > capStreamMin + eps) {
    return {
      ok: false,
      error: `Streaming time reduction (${Math.round(streamMin)} min) cannot exceed your baseline weekly streaming time (${Math.round(capStreamMin)} min per week). Lower the value or ask an administrator to reset your baseline.`
    };
  }

  const capScreenMin = screenBaselineWeeklyMinutesFromRow(baselineRow);
  if (capScreenMin > 0 && screenMin > capScreenMin + eps) {
    return {
      ok: false,
      error: `Screen time reduction (${Math.round(screenMin)} min) cannot exceed your typical weekly screen time from baseline (${Math.round(capScreenMin)} min per week). Lower the value or ask an administrator to reset your baseline.`
    };
  }

  return { ok: true };
}

module.exports = {
  validateWeeklyAgainstBaseline,
  streamingBaselineMinutesFromRow,
  screenBaselineWeeklyMinutesFromRow
};

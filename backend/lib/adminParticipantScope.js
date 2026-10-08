/**
 * Shared filters for admin roster vs challenge participants.
 *
 * Roster  = everyone on Admin → Participants (role != super_admin).
 * Program = challenge participants only (role = participant).
 */

const ROSTER_ROLE_SQL = "role IS DISTINCT FROM 'super_admin'";
const PROGRAM_ROLE_SQL = "role = 'participant'";

/** Real weekly tracker submission (excludes reach-out-only placeholder rows). */
const REAL_WEEKLY_SQL =
  "COALESCE(weekly_progress.counts_as_weekly_submission, true) = true";

/** Alias `wp` — use in admin analytics SELECT/JOIN blocks. */
const REAL_WEEKLY_WP_SQL =
  "COALESCE(wp.counts_as_weekly_submission, true) = true";

/** Static clause (no program date filter). Prefer getProgramWeeklyFromSql(pool). */
const PROGRAM_WEEKLY_FROM_SQL = `
  FROM weekly_progress wp
  INNER JOIN participants p ON p.id = wp.participant_id AND ${PROGRAM_ROLE_SQL}
  WHERE ${REAL_WEEKLY_WP_SQL}
`;

/**
 * Same as PROGRAM_WEEKLY_FROM_SQL, plus optional cutoff from program_config.program_week_1_start_date
 * so pre-launch test weekly rows are excluded from admin graphs/leaderboard when configured.
 */
async function getProgramWeeklyFromSql(pool) {
  let dateFilter = "";
  try {
    const cfg = await pool.query(
      "SELECT program_week_1_start_date FROM program_config LIMIT 1"
    );
    const raw = cfg.rows[0]?.program_week_1_start_date;
    if (raw) {
      const ymd =
        raw instanceof Date
          ? raw.toISOString().slice(0, 10)
          : String(raw).trim().slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
        dateFilter = ` AND wp.created_at >= '${ymd}'::date`;
      }
    }
  } catch {
    /* program_config table may be absent on older DBs */
  }
  return `
    FROM weekly_progress wp
    INNER JOIN participants p ON p.id = wp.participant_id AND ${PROGRAM_ROLE_SQL}
    WHERE ${REAL_WEEKLY_WP_SQL}${dateFilter}
  `;
}

module.exports = {
  ROSTER_ROLE_SQL,
  PROGRAM_ROLE_SQL,
  REAL_WEEKLY_SQL,
  REAL_WEEKLY_WP_SQL,
  PROGRAM_WEEKLY_FROM_SQL,
  getProgramWeeklyFromSql
};

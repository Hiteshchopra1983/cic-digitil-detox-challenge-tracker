const { pool } = require("../lib/db");
const { convertImpact } = require("../services/impactCalculator");
const { calculateWeeklyCO2Savings } = require("../services/co2Calculator");
const { aggregateCategoryCo2FromWeeklyRows } = require("../lib/programCo2ByCategory");
const {
  baselineStorageGbFromRow,
  storageReductionPercentOfBaseline
} = require("../lib/baselineStorage");
const {
  ROSTER_ROLE_SQL,
  PROGRAM_ROLE_SQL,
  REAL_WEEKLY_WP_SQL,
  getProgramWeeklyFromSql
} = require("../lib/adminParticipantScope");

module.exports = async (req, res) => {
  try {
    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS counts_as_weekly_submission boolean DEFAULT true`
    );

    const programWeeklyFrom = await getProgramWeeklyFromSql(pool);

    const registered = await pool.query(`
      SELECT COUNT(*)::int AS count
      FROM participants
      WHERE ${ROSTER_ROLE_SQL}
    `);
    const registeredAccounts = Number(registered.rows[0].count);

    const program = await pool.query(`
      SELECT COUNT(*)::int AS count
      FROM participants
      WHERE ${PROGRAM_ROLE_SQL}
    `);
    const programParticipants = Number(program.rows[0].count);

    const byCountry = await pool.query(`
      SELECT
        COALESCE(NULLIF(TRIM(country), ''), 'Unknown') AS label,
        COUNT(*)::int AS count
      FROM participants
      WHERE ${ROSTER_ROLE_SQL}
      GROUP BY 1
      ORDER BY count DESC, label ASC
    `);

    const byCohort = await pool.query(`
      SELECT
        COALESCE(NULLIF(TRIM(cohort), ''), 'Not specified') AS label,
        COUNT(*)::int AS count
      FROM participants
      WHERE ${ROSTER_ROLE_SQL}
      GROUP BY 1
      ORDER BY count DESC, label ASC
    `);

    const baselineCompletion = await pool.query(`
      SELECT COUNT(DISTINCT bm.participant_id)::int AS completed
      FROM baseline_metrics bm
      INNER JOIN participants p ON p.id = bm.participant_id AND ${PROGRAM_ROLE_SQL}
    `);

    const baselineCompletedCount = Number(baselineCompletion.rows[0].completed || 0);
    const baselineCompletionPercent =
      programParticipants > 0
        ? Math.round((baselineCompletedCount / programParticipants) * 100)
        : 0;

    const active = await pool.query(`
      SELECT COUNT(DISTINCT wp.participant_id)::int AS count
      ${programWeeklyFrom}
    `);
    const activeParticipants = Number(active.rows[0].count);

    const inactive = await pool.query(`
      SELECT COUNT(*)::int AS count
      FROM participants p
      WHERE ${PROGRAM_ROLE_SQL}
      AND NOT EXISTS (
        SELECT 1 FROM weekly_progress wp
        WHERE wp.participant_id = p.id
        AND ${REAL_WEEKLY_WP_SQL}
      )
    `);
    const inactiveParticipants = Number(inactive.rows[0].count);

    const storage = await pool.query(`
      SELECT COALESCE(SUM(wp.gb_deleted), 0) AS total
      ${programWeeklyFrom}
    `);
    const totalGB = Number(storage.rows[0].total);

    const baselineRows = await pool.query(`
      SELECT
        bm.phone_devices,
        bm.phone_storage_gb,
        bm.laptop_devices,
        bm.laptop_storage_gb,
        bm.tablet_devices,
        bm.tablet_storage_gb,
        bm.cloud_accounts,
        bm.cloud_storage_gb
      FROM baseline_metrics bm
      INNER JOIN participants p ON p.id = bm.participant_id AND ${PROGRAM_ROLE_SQL}
    `);

    let totalBaselineGb = 0;
    for (const row of baselineRows.rows) {
      totalBaselineGb += baselineStorageGbFromRow(row);
    }

    const storage_reduction_percent = storageReductionPercentOfBaseline(
      totalGB,
      totalBaselineGb
    );

    const weeksForCo2 = await pool.query(`
      SELECT wp.*
      ${programWeeklyFrom}
    `);
    const co2Parts = await Promise.all(
      weeksForCo2.rows.map((row) => calculateWeeklyCO2Savings(row))
    );
    let totalCO2 = 0;
    for (const kg of co2Parts) {
      totalCO2 += Number(kg) || 0;
    }
    totalCO2 = Number(totalCO2.toFixed(4));

    const { category_totals, weekly_co2_by_category } =
      await aggregateCategoryCo2FromWeeklyRows(weeksForCo2.rows);

    const submissions = await pool.query(`
      SELECT COUNT(*)::int AS count
      ${programWeeklyFrom}
    `);
    const weeklySubmissions = Number(submissions.rows[0].count);

    const weeklyEngagementPercent =
      programParticipants > 0
        ? Math.round((activeParticipants / programParticipants) * 100)
        : 0;

    const impact = convertImpact(totalCO2);

    res.json({
      participants: registeredAccounts,
      registered_accounts: registeredAccounts,
      program_participants: programParticipants,
      registration_by_country: byCountry.rows.map((r) => ({
        label: r.label,
        count: Number(r.count)
      })),
      registration_by_cohort: byCohort.rows.map((r) => ({
        label: r.label,
        count: Number(r.count)
      })),
      baseline_completion: {
        completed: baselineCompletedCount,
        total: programParticipants,
        percent: baselineCompletionPercent
      },
      active_participants: activeParticipants,
      inactive_participants: inactiveParticipants,
      weekly_submissions: weeklySubmissions,
      weekly_engagement_percent: weeklyEngagementPercent,
      gb_deleted: totalGB,
      baseline_storage_gb: Number(totalBaselineGb.toFixed(2)),
      storage_reduction_percent: storage_reduction_percent,
      co2_saved: totalCO2,
      category_totals,
      weekly_co2_by_category,
      impact
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Admin stats failed"
    });
  }
};

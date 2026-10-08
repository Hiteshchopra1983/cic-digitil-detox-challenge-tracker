const { pool } = require("../lib/db");
const { calculateWeeklyCO2Savings } = require("../services/co2Calculator");
const { aggregateCategoryCo2FromWeeklyRows } = require("../lib/programCo2ByCategory");
const {
  baselineStorageGbFromRow,
  storageReductionPercentOfBaseline
} = require("../lib/baselineStorage");
const { PROGRAM_ROLE_SQL, getProgramWeeklyFromSql } = require("../lib/adminParticipantScope");

module.exports = async (req, res) => {
  try {
    await pool.query(
      `ALTER TABLE weekly_progress ADD COLUMN IF NOT EXISTS counts_as_weekly_submission boolean DEFAULT true`
    );

    const programWeeklyFrom = await getProgramWeeklyFromSql(pool);

    const weeksAll = await pool.query(`
      SELECT wp.*
      ${programWeeklyFrom}
      ORDER BY wp.week_number
    `);
    const co2Parts = await Promise.all(
      weeksAll.rows.map(async (row) => {
        const kg = Number(await calculateWeeklyCO2Savings(row)) || 0;
        const week_number = Number(row.week_number);
        return { week_number, kg };
      })
    );

    const { category_totals, weekly_co2_by_category } =
      await aggregateCategoryCo2FromWeeklyRows(weeksAll.rows);
    const co2ByWeek = new Map();
    for (const { week_number, kg } of co2Parts) {
      if (!Number.isFinite(week_number)) continue;
      co2ByWeek.set(week_number, (co2ByWeek.get(week_number) || 0) + kg);
    }
    const co2 = {
      rows: [...co2ByWeek.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([week_number, v]) => ({
          week_number,
          co2: Number(v.toFixed(4))
        }))
    };

    const storage = await pool.query(`
      SELECT wp.week_number, SUM(wp.gb_deleted) AS storage
      ${programWeeklyFrom}
      GROUP BY wp.week_number
      ORDER BY wp.week_number
    `);

    const streaming = await pool.query(`
      SELECT
        wp.week_number,
        SUM(COALESCE(wp.streaming_reduction_minutes, 0)) AS streaming
      ${programWeeklyFrom}
      GROUP BY wp.week_number
      ORDER BY wp.week_number
    `);

    const submissions = await pool.query(`
      SELECT wp.week_number, COUNT(*)::int AS submissions
      ${programWeeklyFrom}
      GROUP BY wp.week_number
      ORDER BY wp.week_number
    `);

    const totalDeletedRes = await pool.query(`
      SELECT COALESCE(SUM(wp.gb_deleted), 0) AS total
      ${programWeeklyFrom}
    `);
    const totalGbDeleted = Number(totalDeletedRes.rows[0]?.total || 0);

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
      totalGbDeleted,
      totalBaselineGb
    );

    res.json({
      co2: co2.rows,
      category_totals,
      weekly_co2_by_category,
      storage: storage.rows,
      streaming: streaming.rows,
      submissions: submissions.rows,
      storage_summary: {
        gb_deleted: totalGbDeleted,
        baseline_storage_gb: Number(totalBaselineGb.toFixed(2)),
        storage_reduction_percent
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Impact analytics failed" });
  }
};

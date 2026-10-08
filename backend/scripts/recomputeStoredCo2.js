#!/usr/bin/env node
/**
 * Recompute persisted baseline_co2_kg and weekly_progress.co2_saved using the
 * current server calculators (run after deploying formula changes).
 *
 * Usage (from repo root): node backend/scripts/recomputeStoredCo2.js
 */
require("dotenv").config();
const { pool } = require("../lib/db");
const { calculateWeeklyCO2Savings } = require("../lib/carbonCalculator");
const { calculateBaselineCO2 } = require("../services/co2Calculator");

async function main() {
  const { rows } = await pool.query(
    "SELECT * FROM weekly_progress ORDER BY participant_id, week_number"
  );
  let n = 0;
  for (const row of rows) {
    const kg = Number(Number(await calculateWeeklyCO2Savings(row)).toFixed(4));
    await pool.query("UPDATE weekly_progress SET co2_saved = $1 WHERE id = $2", [
      kg,
      row.id
    ]);
    n += 1;
    if (n % 100 === 0) {
      process.stderr.write(`weekly_progress ${n}/${rows.length}\n`);
    }
  }

  const baselines = await pool.query("SELECT * FROM baseline_metrics");
  for (const r of baselines.rows) {
    const kg = Number(Number(await calculateBaselineCO2(r)).toFixed(4));
    await pool.query(
      "UPDATE baseline_metrics SET baseline_co2_kg = $1 WHERE participant_id = $2",
      [kg, r.participant_id]
    );
  }

  process.stderr.write(
    `Done: ${rows.length} weekly rows, ${baselines.rows.length} baselines.\n`
  );
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

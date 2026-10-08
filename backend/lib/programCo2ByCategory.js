const { weeklyCo2Breakdown } = require("./carbonCalculator");

/**
 * Sum CO₂ breakdown lines across many weekly_progress rows, grouped by challenge week.
 * @param {object[]} rows - DB rows (weekly_progress)
 * @returns {{ category_totals: Record<string, number>, weekly_co2_by_category: { week_number: number, categories: Record<string, number> }[] }}
 */
async function aggregateCategoryCo2FromWeeklyRows(rows) {
  const list = rows || [];
  const breakdowns = await Promise.all(list.map((row) => weeklyCo2Breakdown(row)));
  const category_totals = {};
  const byWeekCat = new Map();

  for (let i = 0; i < list.length; i++) {
    const row = list[i];
    const wn = Number(row.week_number);
    if (!Number.isFinite(wn)) continue;
    const lines = breakdowns[i]?.lines || [];
    for (const line of lines) {
      const k = line.key;
      const kg = Number(line.kg || 0);
      category_totals[k] = (category_totals[k] || 0) + kg;
      if (!byWeekCat.has(wn)) byWeekCat.set(wn, {});
      const m = byWeekCat.get(wn);
      m[k] = (m[k] || 0) + kg;
    }
  }

  for (const k of Object.keys(category_totals)) {
    category_totals[k] = Number(Number(category_totals[k]).toFixed(4));
  }

  const weekly_co2_by_category = [...byWeekCat.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([week_number, cats]) => ({
      week_number,
      categories: Object.fromEntries(
        Object.entries(cats).map(([key, v]) => [key, Number(Number(v).toFixed(4))])
      )
    }));

  return { category_totals, weekly_co2_by_category };
}

module.exports = { aggregateCategoryCo2FromWeeklyRows };

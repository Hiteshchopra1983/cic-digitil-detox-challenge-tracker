/** Matches backend `weeklyCo2Breakdown` line keys. */
export const CO2_CATEGORY_ORDER: { key: string; label: string }[] = [
  { key: "gb_deleted", label: "Storage removed" },
  { key: "streaming_reduction", label: "Streaming time reduction" },
  { key: "screen_time_change", label: "Screen time reduction" },
  { key: "downloads_avoided", label: "Downloads avoided" },
  { key: "emails_reduced", label: "Emails reduced" },
  { key: "messages_reduced", label: "Messages reduced" },
  { key: "llm_queries_reduced", label: "LLM queries reduced" }
];

export const CO2_CATEGORY_CHART_COLORS = [
  { bar: "#a7f3d0", line: "#047857" },
  { bar: "#bae6fd", line: "#0369a1" },
  { bar: "#fde68a", line: "#b45309" },
  { bar: "#ddd6fe", line: "#6d28d9" },
  { bar: "#fecaca", line: "#b91c1c" },
  { bar: "#fed7aa", line: "#c2410c" },
  { bar: "#cffafe", line: "#0e7490" },
  { bar: "#e9d5ff", line: "#7c3aed" },
  { bar: "#fbcfe8", line: "#be185d" },
  { bar: "#d9f99d", line: "#4d7c0f" },
  { bar: "#e5e7eb", line: "#374151" }
];

export type Co2WeeklyCategoryRow = {
  week: number;
  categories?: Record<string, number>;
};

export type Co2CategoryChartConfig = {
  key: string;
  label: string;
  data: { week: string; kg: number; cumulative: number }[];
  colors: { bar: string; line: string };
  totalKg: number;
};

/**
 * Build per-category weekly + cumulative series for Recharts (participant or program-wide).
 */
export function buildCo2CategoryCharts(
  weekly: Co2WeeklyCategoryRow[],
  categoryTotals: Record<string, number>
): Co2CategoryChartConfig[] {
  const labelByKey = Object.fromEntries(CO2_CATEGORY_ORDER.map((c) => [c.key, c.label]));
  const allowedKeys = new Set(CO2_CATEGORY_ORDER.map((c) => c.key));
  const totals = categoryTotals || {};
  const keys = new Set<string>();
  for (const w of weekly) {
    const c = w.categories || {};
    for (const k of Object.keys(c)) {
      if (!allowedKeys.has(k)) continue;
      if (Number(c[k]) !== 0) keys.add(k);
    }
  }
  for (const k of Object.keys(totals)) {
    if (!allowedKeys.has(k)) continue;
    if (Number(totals[k]) !== 0) keys.add(k);
  }
  const orderIndex = new Map(CO2_CATEGORY_ORDER.map((c, i) => [c.key, i]));
  const sorted = Array.from(keys).sort((a, b) => {
    const ia = orderIndex.has(a) ? (orderIndex.get(a) as number) : 999;
    const ib = orderIndex.has(b) ? (orderIndex.get(b) as number) : 999;
    if (ia !== ib) return ia - ib;
    return a.localeCompare(b);
  });
  return sorted.map((key, idx) => {
    let run = 0;
    const data = weekly.map((w) => {
      const v = Number(w.categories?.[key] ?? 0);
      run += v;
      return {
        week: `W${w.week}`,
        kg: v,
        cumulative: Number(run.toFixed(4))
      };
    });
    const colors = CO2_CATEGORY_CHART_COLORS[idx % CO2_CATEGORY_CHART_COLORS.length];
    const totalKg =
      totals[key] != null ? Number(totals[key]) : data.reduce((s, d) => s + d.kg, 0);
    return {
      key,
      label: labelByKey[key] || key.replace(/_/g, " "),
      data,
      colors,
      totalKg: Number(Number(totalKg).toFixed(4))
    };
  });
}

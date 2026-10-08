import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import Layout from "../components/Layout";
import { apiRequest } from "../lib/api";
import { buildCo2CategoryCharts } from "../lib/co2CategoryCharts";

export default function DashboardPage() {
  const navigate = useNavigate();
  const [impact, setImpact] = useState<any>(null);
  const [baselineData, setBaselineData] = useState<Record<string, unknown> | null>(null);
  const [progress, setProgress] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const id = localStorage.getItem("participant_id");
      const [baselineRes, impactData] = await Promise.all([
        apiRequest(`/api/baseline/${id}`, "GET"),
        apiRequest(`/api/impact/${id}`, "GET")
      ]);

      setBaselineData((baselineRes?.data as Record<string, unknown>) ?? null);

      setImpact(impactData);

      await loadProgress();
      await loadLeaderboard();
    } catch (err) {
      console.error("Dashboard load failed", err);
    }
  }

  async function loadProgress() {
    try {
      const id = localStorage.getItem("participant_id");
      const data = await apiRequest(`/api/progress/${id}`, "GET");
      setProgress(data);
    } catch (err) {
      console.error("Progress API error", err);
    }
  }

  async function loadLeaderboard() {
    try {
      const data = await apiRequest("/api/leaderboard", "GET");
      setLeaderboard((data || []).slice(0, 3));
    } catch (err) {
      console.error("Leaderboard API error", err);
    }
  }

  const pctDone =
    progress?.duration > 0
      ? Math.round((progress.submitted / progress.duration) * 100)
      : 0;

  const savedKg = impact?.co2_saved != null ? Number(impact.co2_saved) : 0;
  const weekCount = impact?.weekly?.length ?? 0;

  const categoryCharts = useMemo(() => {
    const weekly = (impact?.weekly ?? []).map((w: { week: number; categories?: Record<string, number> }) => ({
      week: w.week,
      categories: w.categories
    }));
    return buildCo2CategoryCharts(weekly, impact?.category_totals ?? {});
  }, [impact]);

  const categoryBlocks = useMemo(() => {
    const baselineStorage = Number(impact?.baseline_storage_gb ?? 0);
    const baselineStreamingMin = Number(baselineData?.streaming_hours_week ?? 0) * 60;
    const baselineScreenDailyMin = Number(baselineData?.screen_time_hours ?? 0) * 60;
    const baselineScreenWeeklyMin = baselineScreenDailyMin * 7;
    const baselineDownloadsGb = Number(baselineData?.downloads_gb_week ?? 0);
    const baselineLlm = Number(baselineData?.llm_queries_per_week ?? 0);
    const weeks = weekCount > 0 ? weekCount : 1;

    const rows = [
      {
        key: "storage",
        title: "Storage",
        upToDateLabel: "Up to date storage removed",
        unit: "GB",
        baseline: baselineStorage,
        reduced: Number(impact?.gb_deleted ?? 0),
        co2: Number(impact?.category_totals?.gb_deleted ?? 0),
        pct: Number(impact?.storage_reduction_percent ?? 0),
        pctHasValue: baselineStorage > 0
      },
      {
        key: "streaming",
        title: "Streaming time",
        upToDateLabel: "Up to date streaming reduction",
        unit: "min",
        baseline: baselineStreamingMin,
        reduced: Number(impact?.streaming_reduction ?? 0),
        co2: Number(impact?.category_totals?.streaming_reduction ?? 0),
        pct:
          baselineStreamingMin > 0
            ? (Number(impact?.streaming_reduction ?? 0) / (baselineStreamingMin * weeks)) * 100
            : 0,
        pctHasValue: baselineStreamingMin > 0
      },
      {
        key: "screen",
        title: "Screen time",
        upToDateLabel: "Up to date screen time reduction",
        unit: "min",
        baseline: baselineScreenWeeklyMin,
        reduced: Number(impact?.screen_reduction ?? 0),
        co2: Number(impact?.category_totals?.screen_time_change ?? 0),
        pct:
          baselineScreenWeeklyMin > 0
            ? (Number(impact?.screen_reduction ?? 0) / (baselineScreenWeeklyMin * weeks)) * 100
            : 0,
        pctHasValue: baselineScreenWeeklyMin > 0
      },
      {
        key: "downloads",
        title: "Downloads",
        upToDateLabel: "Up to date downloads avoided",
        unit: "GB",
        baseline: baselineDownloadsGb,
        reduced: Number(impact?.downloads_avoided_total ?? 0),
        co2: Number(impact?.category_totals?.downloads_avoided ?? 0),
        pct:
          baselineDownloadsGb > 0
            ? (Number(impact?.downloads_avoided_total ?? 0) / (baselineDownloadsGb * weeks)) * 100
            : 0,
        pctHasValue: baselineDownloadsGb > 0
      },
      {
        key: "llm",
        title: "LLM queries",
        upToDateLabel: "Up to date LLM queries reduced",
        unit: "queries",
        baseline: baselineLlm,
        reduced: Number(impact?.llm_queries_reduced_total ?? 0),
        co2: Number(impact?.category_totals?.llm_queries_reduced ?? 0),
        pct:
          baselineLlm > 0
            ? (Number(impact?.llm_queries_reduced_total ?? 0) / (baselineLlm * weeks)) * 100
            : 0,
        pctHasValue: baselineLlm > 0
      }
    ];

    return rows.map((r) => ({
      ...r,
      baselineText: `${r.baseline.toFixed(r.unit === "queries" ? 0 : 1)} ${r.unit}`,
      reducedText: `${r.reduced.toFixed(r.unit === "queries" ? 0 : 1)} ${r.unit}`,
      co2Text: `${r.co2.toFixed(3)} kg`,
      pctText: r.pctHasValue ? `${r.pct.toFixed(1)}%` : "N/A"
    }));
  }, [baselineData, impact, weekCount]);

  return (
    <Layout>
      <div className="flex max-h-[calc(100dvh-7.5rem)] flex-col gap-3 sm:max-h-[calc(100dvh-6rem)] lg:max-h-[calc(100dvh-5rem)]">
        <header className="shrink-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Dashboard
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Your challenge snapshot — metrics, trend, and progress in one view.
          </p>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-12 lg:overflow-hidden">
          <div className="flex min-h-0 flex-col gap-3 lg:col-span-8 lg:overflow-y-auto lg:pr-1">
            <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
              {categoryBlocks.map((b) => (
                <div
                  key={b.key}
                  className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm"
                >
                  <p className="text-sm font-semibold text-slate-900">{b.title}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                      <p className="text-[11px] text-slate-500">Baseline</p>
                      <p className="font-semibold tabular-nums text-slate-800">{b.baselineText}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 px-2 py-1.5">
                      <p className="text-[11px] text-slate-500">{b.upToDateLabel}</p>
                      <p className="font-semibold tabular-nums text-slate-800">{b.reducedText}</p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 px-2 py-1.5">
                      <p className="text-[11px] text-emerald-700">CO₂ reduced</p>
                      <p className="font-semibold tabular-nums text-emerald-800">{b.co2Text}</p>
                    </div>
                    <div className="rounded-lg bg-cyan-50 px-2 py-1.5">
                      <p className="text-[11px] text-cyan-700">Percentage</p>
                      <p className="font-semibold tabular-nums text-cyan-800">{b.pctText}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {categoryCharts.length > 0 ? (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-emerald-900">
                  CO₂ avoided by category (totals)
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Each tile is the sum of that category across your logged weeks.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
                  {categoryCharts.map((c) => (
                    <div
                      key={c.key}
                      className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2"
                    >
                      <p className="text-[11px] font-medium leading-tight text-slate-600">
                        {c.label}
                      </p>
                      <p className="mt-1 text-lg font-bold tabular-nums text-emerald-800">
                        {c.totalKg.toFixed(3)}{" "}
                        <span className="text-xs font-semibold text-emerald-700/90">kg</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="flex flex-1 flex-col gap-3">
              <div>
                <h2 className="text-sm font-semibold text-emerald-900">
                  Weekly trend by category
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Separate charts: bars = that week&apos;s CO₂ avoided in this category; line =
                  running total for this category only.
                </p>
              </div>
              {categoryCharts.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {categoryCharts.map((cat) => (
                    <div
                      key={cat.key}
                      className="flex min-h-[260px] flex-col rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="text-xs font-semibold text-slate-800">{cat.label}</h3>
                        <span className="text-[11px] font-medium tabular-nums text-slate-500">
                          Total {cat.totalKg.toFixed(3)} kg
                        </span>
                      </div>
                      <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart
                            data={cat.data}
                            margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                          >
                            <XAxis
                              dataKey="week"
                              tick={{ fontSize: 10 }}
                              stroke="#94a3b8"
                            />
                            <YAxis
                              yAxisId="weekly"
                              tick={{ fontSize: 10 }}
                              stroke="#94a3b8"
                              width={36}
                              label={{
                                value: "kg / wk",
                                angle: -90,
                                position: "insideLeft",
                                style: { fontSize: 9, fill: "#64748b" }
                              }}
                            />
                            <YAxis
                              yAxisId="cumulative"
                              orientation="right"
                              tick={{ fontSize: 10 }}
                              stroke="#0e7490"
                              width={40}
                              label={{
                                value: "Σ kg",
                                angle: 90,
                                position: "insideRight",
                                style: { fontSize: 9, fill: "#0e7490" }
                              }}
                            />
                            <Tooltip
                              formatter={(value: number, name: string) => [
                                typeof value === "number" ? value.toFixed(4) : value,
                                name === "kg"
                                  ? "This week (kg)"
                                  : "Cumulative in category (kg)"
                              ]}
                              labelFormatter={(label) => String(label)}
                              contentStyle={{
                                borderRadius: "12px",
                                border: "1px solid #e2e8f0",
                                fontSize: "12px"
                              }}
                            />
                            <Legend
                              wrapperStyle={{ fontSize: "10px", paddingTop: "4px" }}
                              formatter={(value) =>
                                value === "kg" ? "Weekly" : "Cumulative (category)"
                              }
                            />
                            <Bar
                              yAxisId="weekly"
                              dataKey="kg"
                              name="kg"
                              fill={cat.colors.bar}
                              radius={[4, 4, 0, 0]}
                              maxBarSize={40}
                            />
                            <Line
                              yAxisId="cumulative"
                              type="monotone"
                              dataKey="cumulative"
                              name="cumulative"
                              stroke={cat.colors.line}
                              strokeWidth={2}
                              dot={{ r: 2, fill: cat.colors.line }}
                              activeDot={{ r: 4 }}
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  ))}
                </div>
              ) : impact?.weekly?.length ? (
                <p className="rounded-2xl border border-slate-200/90 bg-white p-4 text-sm text-slate-500 shadow-sm">
                  {savedKg > 0
                    ? "Weekly entries are present but category breakdown is unavailable. Try refreshing after an app update."
                    : "You have logged weeks but no CO₂ savings were estimated yet. Keep logging your reductions to see trends by category."}
                </p>
              ) : (
                <p className="rounded-2xl border border-slate-200/90 bg-white p-4 text-sm text-slate-500 shadow-sm">
                  No weekly data yet. Submit a week to see per-category CO₂ trends.
                </p>
              )}
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-3 lg:col-span-4 lg:overflow-y-auto lg:pr-1">
            {progress?.weeks && (
              <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-semibold text-emerald-900">Challenge progress</h2>
                  <span className="text-xs font-semibold text-emerald-700 tabular-nums">
                    {progress.submitted}/{progress.duration} wks
                  </span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all"
                    style={{ width: `${pctDone}%` }}
                  />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                  {progress.weeks.map((w: any) => (
                    <div
                      key={w.week}
                      className={`rounded-lg px-2 py-1.5 text-center text-xs font-medium ${
                        w.status === "submitted"
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      W{w.week}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-emerald-900">Top participants</h2>
              <ul className="mt-2 divide-y divide-slate-100">
                {leaderboard.map((p, index) => {
                  const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "";
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                      <span className="min-w-0 truncate text-slate-800">
                        <span className="mr-1">{medal}</span>
                        {p.name}
                      </span>
                      <span className="shrink-0 font-semibold tabular-nums text-emerald-700">
                        {Number(p.leaderboard_score ?? p.co2_saved ?? 0).toFixed(2)} kg eq.
                      </span>
                    </li>
                  );
                })}
              </ul>
              {leaderboard.length === 0 && (
                <p className="py-3 text-sm text-slate-500">No leaderboard data yet.</p>
              )}
              <button
                type="button"
                onClick={() => navigate("/leaderboard")}
                className="mt-3 w-full rounded-xl bg-[#064e3b] py-2.5 text-sm font-semibold text-white transition hover:bg-[#053d2f]"
              >
                Full leaderboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

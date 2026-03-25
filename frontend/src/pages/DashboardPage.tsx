import { useEffect, useState } from "react";
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

export default function DashboardPage() {
  const navigate = useNavigate();
  const [impact, setImpact] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [co2, setCO2] = useState(0);

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

      const fromBaseline =
        baselineRes?.baseline_completed && baselineRes.baseline_co2_kg != null
          ? Number(baselineRes.baseline_co2_kg)
          : null;
      const fromImpact =
        impactData?.baseline_co2_kg != null ? Number(impactData.baseline_co2_kg) : null;
      const merged =
        fromBaseline != null && Number.isFinite(fromBaseline)
          ? fromBaseline
          : fromImpact != null && Number.isFinite(fromImpact)
            ? fromImpact
            : 0;
      setCO2(merged);

      setImpact(impactData);
      if (impactData?.weekly?.length) {
        let run = 0;
        setChartData(
          impactData.weekly.map((w: { week: number; co2: number }) => {
            const v = Number(w.co2 || 0);
            run += v;
            return {
              week: `W${w.week}`,
              co2: v,
              cumulative: Number(run.toFixed(4))
            };
          })
        );
      } else {
        setChartData([]);
      }

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
  const pctOfBaselineOffset =
    co2 > 0 && Number.isFinite(savedKg)
      ? Math.min(100, Math.round((savedKg / co2) * 100))
      : null;

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
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm">
                <p className="text-xs font-medium text-slate-500">Baseline CO₂ (est.)</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-slate-900 sm:text-2xl">
                  {co2.toFixed(2)} <span className="text-sm font-semibold text-slate-500">kg</span>
                </p>
                {pctOfBaselineOffset != null ? (
                  <p className="mt-1 text-[11px] font-medium text-emerald-700 tabular-nums">
                    Saved ≈ {pctOfBaselineOffset}% of this footprint
                  </p>
                ) : null}
              </div>
              <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm">
                <p className="text-xs font-medium text-slate-500">CO₂ saved</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-emerald-700 sm:text-2xl">
                  {impact?.co2_saved ? Number(impact.co2_saved).toFixed(2) : "0.00"}{" "}
                  <span className="text-sm font-semibold text-emerald-600/80">kg</span>
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm">
                <p className="text-xs font-medium text-slate-500">Storage reduced</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-cyan-800 sm:text-2xl">
                  {impact?.gb_deleted != null ? Number(impact.gb_deleted).toFixed(1) : "0.0"}{" "}
                  <span className="text-sm font-semibold text-cyan-700/90">GB</span>
                </p>
                {impact?.storage_reduction_percent != null &&
                Number(impact.baseline_storage_gb) > 0 ? (
                  <p className="mt-0.5 text-[11px] font-medium tabular-nums text-slate-600">
                    {Number(impact.storage_reduction_percent).toFixed(1)}% vs baseline
                  </p>
                ) : null}
              </div>
              <div className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-sm">
                <p className="text-xs font-medium text-slate-500">Screen time</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-teal-800 sm:text-2xl">
                  {impact?.screen_reduction ?? 0}{" "}
                  <span className="text-sm font-semibold text-teal-700/90">hrs</span>
                </p>
              </div>
            </div>

            <div className="flex min-h-[280px] flex-1 flex-col rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-emerald-900">Progress over time</h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Weekly savings (bars) and running total CO₂ saved (line).
                  </p>
                </div>
              </div>
              {chartData.length > 0 ? (
                <div className="mt-3 h-[220px] w-full sm:h-[240px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                      data={chartData}
                      margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                    >
                      <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                      <YAxis
                        yAxisId="weekly"
                        tick={{ fontSize: 11 }}
                        stroke="#94a3b8"
                        width={40}
                        label={{
                          value: "kg / wk",
                          angle: -90,
                          position: "insideLeft",
                          style: { fontSize: 10, fill: "#64748b" }
                        }}
                      />
                      <YAxis
                        yAxisId="cumulative"
                        orientation="right"
                        tick={{ fontSize: 11 }}
                        stroke="#0e7490"
                        width={44}
                        label={{
                          value: "total kg",
                          angle: 90,
                          position: "insideRight",
                          style: { fontSize: 10, fill: "#0e7490" }
                        }}
                      />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          typeof value === "number" ? value.toFixed(3) : value,
                          name === "co2" ? "This week (kg)" : "Total saved (kg)"
                        ]}
                        labelFormatter={(label) => String(label)}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px"
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                        formatter={(value) =>
                          value === "co2" ? "Weekly CO₂ saved" : "Cumulative saved"
                        }
                      />
                      <Bar
                        yAxisId="weekly"
                        dataKey="co2"
                        name="co2"
                        fill="#a7f3d0"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={48}
                      />
                      <Line
                        yAxisId="cumulative"
                        type="monotone"
                        dataKey="cumulative"
                        name="cumulative"
                        stroke="#047857"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "#047857" }}
                        activeDot={{ r: 5 }}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">No weekly data yet.</p>
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
                        {Number(p.co2_saved || 0).toFixed(2)} kg
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

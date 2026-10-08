import { useEffect, useMemo, useState } from "react";
import { getAdminImpact } from "../lib/api";
import AdminLayout from "../components/AdminLayout";
import { buildCo2CategoryCharts } from "../lib/co2CategoryCharts";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  CartesianGrid,
  Legend,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

function CrossTrendTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload as {
    week: string;
    co2: number;
    storage: number;
    streaming: number;
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-slate-800">{row.week}</p>
      <p className="text-emerald-700">CO₂ saved: {row.co2.toFixed(2)} kg</p>
      <p className="text-blue-700">Storage reduced: {row.storage.toFixed(2)} GB</p>
      <p className="text-violet-700">Streaming reduced: {row.streaming.toFixed(0)} min</p>
      <p className="mt-1 border-t border-slate-100 pt-1 text-slate-500">
        Lines show each series as a % of its own strongest week (so scales are comparable).
      </p>
    </div>
  );
}

export default function AdminImpactPage(){
  const [data,setData] = useState<any>(null);
  const [activeChart,setActiveChart] = useState("storage");

  useEffect(()=>{
    load();
  },[]);

  async function load(){
    try{
      const res = await getAdminImpact();
      setData(res);
    }catch(err){
      console.error(err);
    }
  }

  const categoryCharts = useMemo(() => {
    if (!data?.weekly_co2_by_category?.length && !data?.category_totals) return [];
    return buildCo2CategoryCharts(
      (data.weekly_co2_by_category || []).map((w: { week_number: number; categories?: Record<string, number> }) => ({
        week: w.week_number,
        categories: w.categories
      })),
      data.category_totals || {}
    );
  }, [data]);

  if(!data) return <p className="p-10">Loading analytics...</p>;

  const co2Data = (data.co2 || []).map((d:any)=>({
    week: `W${d.week_number}`,
    value: Number(d.co2 || 0)
  }));

  const storageData = (data.storage || []).map((d:any)=>({
    week: `W${d.week_number}`,
    value: Number(d.storage || 0)
  }));

  const streamingData = (data.streaming || []).map((d:any)=>({
    week: `W${d.week_number}`,
    value: Number(d.streaming || 0)
  }));

  const submissionsData = (data.submissions || []).map((d:any)=>({
    week: `W${d.week_number}`,
    value: Number(d.submissions || 0)
  }));

  const combinedByWeek = (data.co2 || []).map((co2Row:any)=>{
    const week = co2Row.week_number;
    const s = (data.storage || []).find((x:any)=>x.week_number === week);
    const st = (data.streaming || []).find((x:any)=>x.week_number === week);
    return {
      week: `W${week}`,
      co2: Number(co2Row.co2 || 0),
      storage: Number(s?.storage || 0),
      streaming: Number(st?.streaming || 0)
    };
  });

  const maxCo2 = Math.max(...combinedByWeek.map((d: any) => d.co2), 1e-9);
  const maxStorage = Math.max(...combinedByWeek.map((d: any) => d.storage), 1e-9);
  const maxStreaming = Math.max(...combinedByWeek.map((d: any) => d.streaming), 1e-9);
  const crossTrendData = combinedByWeek.map((d: any) => ({
    week: d.week,
    co2: d.co2,
    storage: d.storage,
    streaming: d.streaming,
    co2_pct: (d.co2 / maxCo2) * 100,
    storage_pct: (d.storage / maxStorage) * 100,
    streaming_pct: (d.streaming / maxStreaming) * 100
  }));

  const totalCO2 = co2Data.reduce((a:number,b:any)=>a + b.value,0);
  const totalStorage = storageData.reduce((a:number,b:any)=>a + b.value,0);
  const totalStreaming = streamingData.reduce((a:number,b:any)=>a + b.value,0);
  const totalSubmissions = submissionsData.reduce((a:number,b:any)=>a + b.value,0);
  const ss = data.storage_summary || {};
  const summaryGb = Number(ss.gb_deleted ?? totalStorage);
  const summaryBaseline = Number(ss.baseline_storage_gb ?? 0);
  const summaryPct =
    ss.storage_reduction_percent !== undefined && ss.storage_reduction_percent !== null
      ? Number(ss.storage_reduction_percent)
      : null;

  return(
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Impact Analytics</h1>
        <p className="text-gray-600 mb-6">
          Visual overview of challenge impact trends across all weeks.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white p-3 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500">Total CO₂ (kg)</p>
            <p className="text-lg font-bold text-emerald-700">{totalCO2.toFixed(2)}</p>
            <p className="text-[11px] text-gray-500 mt-1">Sum of all categories · detail below</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500">Storage reduced (GB)</p>
            <p className="text-lg font-bold text-blue-700 tabular-nums">{summaryGb.toFixed(2)} GB</p>
            {summaryPct !== null && summaryBaseline > 0 ? (
              <p className="text-xs text-blue-600 mt-0.5 tabular-nums">
                {summaryPct.toFixed(2)}% of baseline footprint ({summaryBaseline.toFixed(1)} GB)
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-0.5">Weekly sums · % vs baseline when available</p>
            )}
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500">Streaming reduced (min)</p>
            <p className="text-lg font-bold text-violet-700">{totalStreaming.toFixed(0)}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500">Submissions</p>
            <p className="text-lg font-bold text-amber-700">{totalSubmissions}</p>
          </div>
        </div>

        {categoryCharts.length > 0 ? (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-4">
            <h2 className="text-base font-semibold text-emerald-900">CO₂ by category (program-wide)</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Aggregated across all submissions. Each chart is one category only (weekly bar + cumulative line).
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {categoryCharts.map((c) => (
                <div key={c.key} className="rounded-lg border border-gray-100 bg-gray-50/80 px-2 py-1.5">
                  <p className="text-[11px] font-medium text-gray-600 leading-tight">{c.label}</p>
                  <p className="text-sm font-bold tabular-nums text-emerald-800 mt-0.5">
                    {c.totalKg.toFixed(3)} kg
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-1 xl:grid-cols-2 gap-3">
              {categoryCharts.map((cat) => (
                <div key={cat.key} className="rounded-xl border border-gray-100 p-3 bg-gray-50/40">
                  <div className="flex flex-wrap justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-gray-800">{cat.label}</span>
                    <span className="text-[11px] text-gray-500 tabular-nums">Total {cat.totalKg.toFixed(3)} kg</span>
                  </div>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={cat.data} margin={{ top: 6, right: 6, left: 0, bottom: 2 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                        <YAxis
                          yAxisId="weekly"
                          tick={{ fontSize: 10 }}
                          width={34}
                          label={{ value: "kg/wk", angle: -90, position: "insideLeft", style: { fontSize: 9 } }}
                        />
                        <YAxis
                          yAxisId="cumulative"
                          orientation="right"
                          tick={{ fontSize: 10 }}
                          width={36}
                          label={{ value: "Σ kg", angle: 90, position: "insideRight", style: { fontSize: 9 } }}
                        />
                        <Tooltip
                          formatter={(value: number, name: string) => [
                            typeof value === "number" ? value.toFixed(4) : value,
                            name === "kg" ? "This week (kg)" : "Cumulative (kg)"
                          ]}
                        />
                        <Legend wrapperStyle={{ fontSize: "10px" }} formatter={(v) => (v === "kg" ? "Weekly" : "Cumulative")} />
                        <Bar yAxisId="weekly" dataKey="kg" name="kg" fill={cat.colors.bar} radius={[4, 4, 0, 0]} maxBarSize={36} />
                        <Line
                          yAxisId="cumulative"
                          type="monotone"
                          dataKey="cumulative"
                          name="cumulative"
                          stroke={cat.colors.line}
                          strokeWidth={2}
                          dot={{ r: 2 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-800 mb-2">Other weekly metrics</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            <button onClick={()=>setActiveChart("storage")} className={`px-3 py-1.5 rounded-lg text-sm ${activeChart==="storage" ? "bg-blue-700 text-white" : "bg-gray-100"}`}>Storage Area</button>
            <button onClick={()=>setActiveChart("streaming")} className={`px-3 py-1.5 rounded-lg text-sm ${activeChart==="streaming" ? "bg-violet-700 text-white" : "bg-gray-100"}`}>Streaming Line</button>
            <button onClick={()=>setActiveChart("submissions")} className={`px-3 py-1.5 rounded-lg text-sm ${activeChart==="submissions" ? "bg-amber-700 text-white" : "bg-gray-100"}`}>Submissions</button>
            <button onClick={()=>setActiveChart("cross")} className={`px-3 py-1.5 rounded-lg text-sm ${activeChart==="cross" ? "bg-slate-700 text-white" : "bg-gray-100"}`}>Cross trend</button>
          </div>

          {activeChart === "cross" && (
            <p className="text-xs text-gray-500 mb-2">
              Each line is scaled to its own peak week (0–100%). Hover for kg, GB, and minutes.
            </p>
          )}

          <div className="h-[360px]">
            {activeChart === "storage" && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={storageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis label={{ value: "GB", angle: -90, position: "insideLeft" }} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(2)} GB`, "Storage reduced"]} />
                  <Area type="monotone" dataKey="value" fill="#93c5fd" stroke="#2563eb" strokeWidth={2} />
                  <Line type="monotone" dataKey="value" stroke="#1d4ed8" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}

            {activeChart === "streaming" && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={streamingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis label={{ value: "Minutes", angle: -90, position: "insideLeft" }} />
                  <Tooltip formatter={(v: number) => [`${v.toFixed(0)} min`, "Streaming reduced"]} />
                  <Line type="monotone" dataKey="value" stroke="#7c3aed" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeChart === "submissions" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={submissionsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeChart === "cross" && (
              crossTrendData.length === 0 ? (
                <p className="flex h-full items-center justify-center text-sm text-gray-500">
                  No weekly aggregates yet — cross trend appears once CO₂ data exists by week.
                </p>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
              <LineChart data={crossTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis domain={[0, 100]} label={{ value: "% of series max", angle: -90, position: "insideLeft" }} />
                <Tooltip content={<CrossTrendTooltip />} />
                <Legend />
                <Line type="monotone" dataKey="co2_pct" name="CO₂ (% of max week)" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="storage_pct" name="Storage (% of max week)" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="streaming_pct" name="Streaming (% of max week)" stroke="#7c3aed" strokeWidth={2} dot={false} />
              </LineChart>
              </ResponsiveContainer>
              )
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
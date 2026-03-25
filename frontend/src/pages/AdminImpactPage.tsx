import { useEffect, useState } from "react";
import { getAdminImpact } from "../lib/api";
import AdminLayout from "../components/AdminLayout";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  Area,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function AdminImpactPage(){
  const [data,setData] = useState<any>(null);
  const [activeChart,setActiveChart] = useState("co2");

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

  const pieData = [
    { name: "CO2 Saved", value: co2Data.reduce((a:number,b:any)=>a + b.value,0) },
    { name: "Storage", value: storageData.reduce((a:number,b:any)=>a + b.value,0) },
    { name: "Streaming", value: streamingData.reduce((a:number,b:any)=>a + b.value,0) }
  ];
  const pieColors = ["#059669", "#3b82f6", "#7c3aed"];
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
            <p className="text-xs text-gray-500">Total CO2</p>
            <p className="text-lg font-bold text-emerald-700">{totalCO2.toFixed(2)}</p>
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
            <p className="text-xs text-gray-500">Total Streaming</p>
            <p className="text-lg font-bold text-violet-700">{totalStreaming.toFixed(0)}</p>
          </div>
          <div className="bg-white p-3 rounded-xl border border-gray-100">
            <p className="text-xs text-gray-500">Submissions</p>
            <p className="text-lg font-bold text-amber-700">{totalSubmissions}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-wrap gap-2 mb-3">
            <button onClick={()=>setActiveChart("co2")} className={`px-3 py-1.5 rounded-lg text-sm ${activeChart==="co2" ? "bg-emerald-700 text-white" : "bg-gray-100"}`}>CO2 Bar</button>
            <button onClick={()=>setActiveChart("storage")} className={`px-3 py-1.5 rounded-lg text-sm ${activeChart==="storage" ? "bg-blue-700 text-white" : "bg-gray-100"}`}>Storage Area</button>
            <button onClick={()=>setActiveChart("streaming")} className={`px-3 py-1.5 rounded-lg text-sm ${activeChart==="streaming" ? "bg-violet-700 text-white" : "bg-gray-100"}`}>Streaming Line</button>
            <button onClick={()=>setActiveChart("submissions")} className={`px-3 py-1.5 rounded-lg text-sm ${activeChart==="submissions" ? "bg-amber-700 text-white" : "bg-gray-100"}`}>Submissions</button>
            <button onClick={()=>setActiveChart("mix")} className={`px-3 py-1.5 rounded-lg text-sm ${activeChart==="mix" ? "bg-teal-700 text-white" : "bg-gray-100"}`}>Impact Mix</button>
            <button onClick={()=>setActiveChart("cross")} className={`px-3 py-1.5 rounded-lg text-sm ${activeChart==="cross" ? "bg-slate-700 text-white" : "bg-gray-100"}`}>Cross Trend</button>
          </div>

          <div className="h-[360px]">
            {activeChart === "co2" && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={co2Data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeChart === "storage" && (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={storageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" />
                  <YAxis />
                  <Tooltip />
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
                  <YAxis />
                  <Tooltip />
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

            {activeChart === "mix" && (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={110}>
                    {pieData.map((_:any, index:number)=>(
                      <Cell key={index} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}

            {activeChart === "cross" && (
              <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={combinedByWeek}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="storage" fill="#3b82f6" />
                <Line type="monotone" dataKey="co2" stroke="#10b981" strokeWidth={3} />
                <Line type="monotone" dataKey="streaming" stroke="#7c3aed" strokeWidth={2} />
              </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
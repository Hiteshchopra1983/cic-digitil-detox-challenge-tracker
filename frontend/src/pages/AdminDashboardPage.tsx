import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LabelList
} from "recharts";
import { getAdminStats, getLeaderboard, apiRequest, exportData, resetProgram } from "../lib/api";
import AdminLayout from "../components/AdminLayout";

function formatNum(n: number, decimals = 0) {
  if (Number.isNaN(n)) return "0";
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

const chartTooltipStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  color: "#111827",
  boxShadow: "0 8px 24px rgba(15,23,42,0.10)"
};

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="3" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a3 3 0 0 1 0 5.74" />
    </svg>
  );
}

function StorageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <ellipse cx="12" cy="5" rx="7" ry="3" />
      <path d="M5 5v7c0 1.66 3.13 3 7 3s7-1.34 7-3V5" />
      <path d="M5 12v7c0 1.66 3.13 3 7 3s7-1.34 7-3v-7" />
    </svg>
  );
}

function LeafIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M11 20A7 7 0 0 1 4 13C4 7 10 3 20 4c1 10-3 16-9 16Z" />
      <path d="M11 20c-1-4 2-8 8-12" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      <path d="M5 6H3a2 2 0 0 0 2 2" />
      <path d="M19 6h2a2 2 0 0 1-2 2" />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
      <path d="M3 17 9 11l4 4 7-8" />
      <path d="M14 7h6v6" />
    </svg>
  );
}

function medalForRank(rank: number) {
  if (rank === 0) return "🥇";
  if (rank === 1) return "🥈";
  if (rank === 2) return "🥉";
  return "🏅";
}

function CarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M3 13h18" />
      <path d="m5 13 2-5h10l2 5" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

function TreeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M12 22v-5" />
      <path d="m8 17 4-7 4 7Z" />
      <path d="m6 13 6-9 6 9Z" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z" />
    </svg>
  );
}

export default function AdminDashboardPage() {
  const [denseMode, setDenseMode] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [participants,setParticipants] = useState(0);
  const [active,setActive] = useState(0);
  const [inactive,setInactive] = useState(0);
  const [weekly,setWeekly] = useState(0);
  const [gbDeleted,setGbDeleted] = useState(0);
  const [baselineStorageGb,setBaselineStorageGb] = useState(0);
  const [storageReductionPct,setStorageReductionPct] = useState<number | null>(null);
  const [co2Saved,setCO2Saved] = useState(0);
  const [impact,setImpact] = useState({
    car_km:0,
    trees:0,
    phone_charges:0
  });
  const [leaders,setLeaders] = useState<any[]>([]);
  const [showInactive,setShowInactive] = useState(false);
  const [inactiveList,setInactiveList] = useState<any[]>([]);
  const activePct = participants ? Math.round((active / participants) * 100) : 0;
  const weeklyPct = participants ? Math.min(100, Math.round((weekly / participants) * 100)) : 0;
  const avgCo2 = participants ? co2Saved / participants : 0;
  const impactData = [
    {
      key: "car",
      title: "Driving Avoided",
      unit: "km",
      value: Number(impact.car_km || 0),
      color: "bg-sky-500",
      icon: <CarIcon />
    },
    {
      key: "trees",
      title: "Trees Equivalent",
      unit: "trees",
      value: Number(impact.trees || 0),
      color: "bg-emerald-500",
      icon: <TreeIcon />
    },
    {
      key: "charges",
      title: "Phone Charges Avoided",
      unit: "charges",
      value: Number(impact.phone_charges || 0),
      color: "bg-violet-500",
      icon: <BoltIcon />
    }
  ];
  const impactMax = Math.max(...impactData.map((d) => d.value), 1);
  const sectionGapClass = denseMode ? "mb-4" : "mb-6";
  const topGapClass = denseMode ? "mb-5" : "mb-8";
  const gridGapClass = denseMode ? "gap-3" : "gap-4";
  const cardPadClass = denseMode ? "p-4" : "p-5";
  const pieHeight = denseMode ? 220 : 260;
  const leaderboardMaxHeight = denseMode ? "max-h-[280px]" : "max-h-[420px]";

  useEffect(()=>{
    refreshData();
    const hourlyInterval = setInterval(() => {
      refreshData();
    }, 60 * 60 * 1000);
    return () => clearInterval(hourlyInterval);
  },[]);

  async function refreshData() {
    setRefreshing(true);
    await load();
    setLastUpdated(new Date());
    setRefreshing(false);
  }

  async function load(){
    try{
      const stats = await getAdminStats();
      if(!stats) return;

      setParticipants(Number(stats.participants));
      setActive(Number(stats.active_participants));
      setInactive(Number(stats.inactive_participants));
      setWeekly(Number(stats.weekly_submissions));
      setGbDeleted(Number(stats.gb_deleted));
      setBaselineStorageGb(Number(stats.baseline_storage_gb ?? 0));
      setStorageReductionPct(
        stats.storage_reduction_percent === null || stats.storage_reduction_percent === undefined
          ? null
          : Number(stats.storage_reduction_percent)
      );
      setCO2Saved(Number(stats.co2_saved));

      if(stats.impact){
        setImpact(stats.impact);
      }

      const board = await getLeaderboard();
      setLeaders(board || []);
    }catch(err){
      console.error("Admin dashboard load failed",err);
    }
  }

  async function openInactive(){
    try{
      const data = await apiRequest("/api/admin/inactive");
      setInactiveList(data || []);
      setShowInactive(true);
    }catch(err){
      console.error(err);
    }
  }

  return(
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <div className={`flex flex-col lg:flex-row gap-3 justify-between lg:items-center ${topGapClass}`}>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Program-wide performance snapshot and participation health.</p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500 mr-1">
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Updating..."}
            </span>
            <button
              type="button"
              onClick={() => setDenseMode((v) => !v)}
              className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition px-4 py-2 rounded-xl text-sm font-semibold"
            >
              {denseMode ? "Compact View" : "Comfortable View"}
            </button>
            <button
              type="button"
              onClick={refreshData}
              disabled={refreshing}
              className="bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition px-3 py-2 rounded-xl text-xs font-semibold"
            >
              {refreshing ? "Refreshing..." : "Refresh now"}
            </button>
            <button
              onClick={exportData}
              className="bg-[#064e3b] text-white hover:bg-[#053d2f] transition px-4 py-2 rounded-xl text-sm font-semibold"
            >
              Export CSV
            </button>

            <button
              onClick={async ()=>{
                const confirmReset = confirm("Reset program?");
                if(!confirmReset) return;
                const resetBaseline = confirm("Also reset baseline?");
                await resetProgram(resetBaseline);
                alert("Program reset successful");
                window.location.reload();
              }}
              className="bg-gray-900 text-white hover:bg-gray-800 transition px-4 py-2 rounded-xl text-sm font-semibold"
            >
              Reset Program
            </button>
          </div>
        </div>

        <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 ${gridGapClass} ${sectionGapClass}`}>
          <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm ${cardPadClass}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Participants</p>
              <span className="inline-flex w-9 h-9 rounded-lg items-center justify-center bg-emerald-100 text-emerald-700"><UsersIcon /></span>
            </div>
            <p className="text-3xl font-bold text-gray-900 tabular-nums leading-none">{formatNum(participants)}</p>
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${activePct}%` }} />
            </div>
            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1"><TrendIcon /> {activePct}% currently active</p>
          </div>
          <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm ${cardPadClass}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Storage reduced (GB)</p>
              <span className="inline-flex w-9 h-9 rounded-lg items-center justify-center bg-cyan-100 text-cyan-700"><StorageIcon /></span>
            </div>
            <p className="text-3xl font-bold text-gray-900 tabular-nums leading-none">{formatNum(gbDeleted, 1)} GB</p>
            {storageReductionPct !== null && baselineStorageGb > 0 ? (
              <p className="mt-1 text-sm font-semibold text-cyan-800 tabular-nums">
                {formatNum(storageReductionPct, 2)}% of reported baseline footprint
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">% vs baseline when footprint data exists</p>
            )}
            <p className="mt-2 text-xs text-gray-500">
              Baseline footprint (sum): {formatNum(baselineStorageGb, 1)} GB · Avg{" "}
              {formatNum(participants ? gbDeleted / participants : 0, 2)} GB freed / participant
            </p>
          </div>
          <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm ${cardPadClass}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">CO2 Saved (kg)</p>
              <span className="inline-flex w-9 h-9 rounded-lg items-center justify-center bg-violet-100 text-violet-700"><LeafIcon /></span>
            </div>
            <p className="text-3xl font-bold text-emerald-700 tabular-nums leading-none">{formatNum(co2Saved, 2)}</p>
            <p className="mt-3 text-xs text-gray-500">Avg {formatNum(avgCo2, 2)} kg per participant</p>
          </div>
          <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm ${cardPadClass}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-500">Weekly Submissions</p>
              <span className="inline-flex w-9 h-9 rounded-lg items-center justify-center bg-amber-100 text-amber-700"><CalendarIcon /></span>
            </div>
            <p className="text-3xl font-bold text-gray-900 tabular-nums leading-none">{formatNum(weekly)}</p>
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-amber-500" style={{ width: `${weeklyPct}%` }} />
            </div>
            <p className="mt-1 text-xs text-gray-500 flex items-center gap-1"><TrendIcon /> {weeklyPct}% weekly engagement</p>
          </div>
        </div>

        <div className={`bg-white border border-gray-100 rounded-2xl shadow-sm ${cardPadClass} ${sectionGapClass}`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-emerald-900">Program Health</h2>
            <span className="text-xs text-gray-500">Quick status overview</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              <p className="text-xs text-emerald-700 font-medium">Activation Rate</p>
              <p className="text-xl font-bold text-emerald-800 tabular-nums">{activePct}%</p>
            </div>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
              <p className="text-xs text-amber-700 font-medium">Weekly Engagement</p>
              <p className="text-xl font-bold text-amber-800 tabular-nums">{weeklyPct}%</p>
            </div>
            <div className="rounded-xl border border-sky-100 bg-sky-50 p-3">
              <p className="text-xs text-sky-700 font-medium">Avg CO2 / Participant</p>
              <p className="text-xl font-bold text-sky-800 tabular-nums">{formatNum(avgCo2, 2)} kg</p>
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 xl:grid-cols-3 ${gridGapClass} ${sectionGapClass}`}>
          <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 xl:col-span-1 ${cardPadClass}`}>
            <h2 className="text-lg font-semibold text-emerald-900 mb-1">Participation Mix</h2>
            <p className="text-xs text-gray-500 mb-3">Counts and percentages in legend to avoid clipping.</p>
            <ResponsiveContainer width="100%" height={pieHeight}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Active", value: active },
                    { name: "Inactive", value: inactive }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={44}
                  outerRadius={75}
                  paddingAngle={2}
                >
                  <Cell fill="#10b981" stroke="#ffffff" strokeWidth={2} />
                  <Cell fill="#f43f5e" stroke="#ffffff" strokeWidth={2} />
                  <LabelList
                    dataKey="value"
                    position="inside"
                    fill="#ffffff"
                    fontSize={12}
                    fontWeight={700}
                    formatter={(v: number) => formatNum(Number(v))}
                  />
                </Pie>
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value: number, name: string) => [formatNum(Number(value)), name]}
                />
                <Legend
                  formatter={(value, _entry, index) => {
                    const total = active + inactive;
                    const current = index === 0 ? active : inactive;
                    const pct = total ? Math.round((current / total) * 100) : 0;
                    return <span className="text-gray-700 text-sm">{`${value}: ${formatNum(current)} (${pct}%)`}</span>;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 xl:col-span-2 ${cardPadClass}`}>
            <h2 className="text-lg font-semibold text-emerald-900 mb-1">Environmental Impact</h2>
            <p className="text-xs text-gray-500 mb-3">Equivalent metrics in a compact visual format.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {impactData.map((item) => {
                const pct = Math.max(8, Math.round((item.value / impactMax) * 100));
                return (
                  <div key={item.key} className="rounded-xl border border-gray-100 p-3 bg-gray-50/70">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex w-8 h-8 rounded-lg items-center justify-center bg-white border border-gray-100 text-gray-700">
                        {item.icon}
                      </span>
                      <span className="text-xs text-gray-500">{item.unit}</span>
                    </div>
                    <p className="text-xs font-medium text-gray-600">{item.title}</p>
                    <p className="text-2xl font-bold text-gray-900 tabular-nums mt-1">{formatNum(item.value, 2)}</p>
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 ${gridGapClass} ${sectionGapClass}`}>
          <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${cardPadClass}`}>
            <h2 className="text-sm font-medium text-gray-500">Active Participants</h2>
            <p className="text-3xl font-bold text-emerald-700 tabular-nums">{formatNum(active)}</p>
          </div>

          <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${cardPadClass}`}>
            <h2 className="text-sm font-medium text-gray-500">Inactive Participants</h2>
            <button
              type="button"
              className="text-3xl font-bold text-rose-600 hover:underline tabular-nums"
              onClick={openInactive}
            >
              {formatNum(inactive)}
            </button>
          </div>

          <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${cardPadClass}`}>
            <h2 className="text-sm font-medium text-gray-500">Leaderboard Entries</h2>
            <p className="text-3xl font-bold text-gray-900 tabular-nums">{formatNum(leaders.length)}</p>
          </div>
        </div>

        <h2 className={`text-xl font-semibold text-emerald-900 ${denseMode ? "mb-2" : "mb-3"} flex items-center gap-2`}>
          <span className="inline-flex w-8 h-8 rounded-lg items-center justify-center bg-emerald-100 text-emerald-700"><TrophyIcon /></span>
          Leaderboard
        </h2>
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${leaderboardMaxHeight} overflow-y-auto`}>
          {leaders.length===0 && (
            <p className="p-6 text-gray-500">No participants yet</p>
          )}
          {leaders.map((l:any,index:number)=>{
            const co2 = Number(l.co2_saved || 0);
            return(
              <div key={index} className="flex justify-between items-center gap-3 p-4 border-b border-gray-100 last:border-0">
                <span className="text-gray-800 min-w-0 flex items-center">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-sm font-semibold mr-2 shrink-0">
                    {medalForRank(index)}
                  </span>
                  <span className="truncate">{l.name}</span>
                </span>
                <span className="font-semibold text-emerald-700 tabular-nums shrink-0">{formatNum(co2, 2)} kg CO2</span>
              </div>
            );
          })}
        </div>

        {showInactive && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-xl border border-gray-100">
              <h2 className="text-xl font-semibold text-emerald-900 mb-4">Inactive Participants</h2>
              {inactiveList.map((p:any)=>(
                <div key={p.id} className="border-b border-gray-100 py-2">
                  <div className="font-semibold text-gray-900">{p.name}</div>
                  <div className="text-sm text-gray-500 break-all">{p.email}</div>
                </div>
              ))}
              <button
                onClick={()=>setShowInactive(false)}
                className="mt-6 bg-[#064e3b] hover:bg-[#053d2f] text-white px-4 py-2 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
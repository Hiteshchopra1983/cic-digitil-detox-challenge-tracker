import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import { apiRequest } from "../lib/api";

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await apiRequest("/api/leaderboard", "GET");
    setLeaders(Array.isArray(data) ? data : []);
  }

  const myId = localStorage.getItem("participant_id");
  const myRank = useMemo(
    () => leaders.findIndex((l) => String(l.id) === String(myId)) + 1,
    [leaders, myId]
  );

  return (
    <Layout>
      <div className="flex max-h-[calc(100dvh-7rem)] flex-col gap-3 sm:max-h-[calc(100dvh-6rem)]">
        <header className="shrink-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Leaderboard</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Rankings use cumulative CO₂ saved plus a bonus for verified reach-out emails (each address
            you list weekly that matches another registered participant).
          </p>
        </header>

        {myRank > 0 && (
          <div className="shrink-0 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900">
            Your rank: <span className="font-bold tabular-nums">#{myRank}</span>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="max-h-full overflow-y-auto">
            <div className="sticky top-0 z-10 grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(3rem,1fr)_minmax(3rem,1fr)_minmax(3.25rem,1fr)_minmax(2.5rem,1fr)_minmax(3.5rem,1fr)] gap-x-1.5 gap-y-1 border-b border-slate-100 bg-slate-50/95 px-3 py-2.5 text-[9px] font-semibold uppercase leading-tight tracking-wide text-slate-600 backdrop-blur-sm sm:gap-x-2 sm:px-5 sm:text-[10px]">
              <div>#</div>
              <div className="min-w-0">Participant</div>
              <div className="text-right">CO₂</div>
              <div className="text-right leading-snug" title="Cumulative GB removed across weekly entries">
                GB reduction
              </div>
              <div className="text-right leading-snug" title="Cumulative streaming time reduced (minutes)">
                <span className="hidden sm:inline">Streaming time reduction</span>
                <span className="sm:hidden">Stream ↓</span>
              </div>
              <div className="text-right">Reach-out</div>
              <div className="text-right">Score</div>
            </div>
            {leaders.map((p, index) => (
              <div
                key={p.id}
                className="grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(3rem,1fr)_minmax(3rem,1fr)_minmax(3.25rem,1fr)_minmax(2.5rem,1fr)_minmax(3.5rem,1fr)] gap-x-1.5 gap-y-1 border-b border-slate-50 px-3 py-2.5 text-xs sm:gap-x-2 sm:px-5 sm:text-sm"
              >
                <div className="font-semibold tabular-nums text-slate-700">{index + 1}</div>
                <div className="min-w-0 truncate font-medium text-slate-900">{p.name || "Anonymous"}</div>
                <div className="text-right tabular-nums text-slate-700">
                  {Number(p.co2_saved || 0).toFixed(2)}
                  <span className="text-[9px] font-normal text-slate-500 sm:text-[10px]"> kg</span>
                </div>
                <div className="text-right tabular-nums text-cyan-800">
                  {Number(p.gb_reduction ?? 0).toFixed(1)}
                </div>
                <div className="text-right tabular-nums text-sky-800">
                  {Math.round(Number(p.streaming_reduction_minutes ?? 0))}
                </div>
                <div className="text-right tabular-nums text-cyan-800">
                  {Number(p.reach_out_matches ?? 0)}
                  <span className="hidden text-[9px] font-normal text-slate-500 sm:inline sm:text-[10px]">
                    {" "}
                    verified
                  </span>
                </div>
                <div className="text-right font-semibold tabular-nums text-emerald-700">
                  {Number(p.leaderboard_score ?? p.co2_saved ?? 0).toFixed(2)}
                  <span className="text-[9px] font-normal text-slate-500 sm:text-[10px]"> kg eq.</span>
                </div>
              </div>
            ))}
            {leaders.length === 0 && (
              <div className="p-10 text-center text-sm text-slate-500">No leaderboard data yet.</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

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
            Program rankings by cumulative CO₂ savings.
          </p>
        </header>

        {myRank > 0 && (
          <div className="shrink-0 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900">
            Your rank: <span className="font-bold tabular-nums">#{myRank}</span>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="max-h-full overflow-y-auto">
            <div className="sticky top-0 z-10 grid grid-cols-12 gap-2 border-b border-slate-100 bg-slate-50/95 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-slate-600 backdrop-blur-sm sm:px-5">
              <div className="col-span-2">#</div>
              <div className="col-span-6 sm:col-span-7">Participant</div>
              <div className="col-span-4 sm:col-span-3 text-right">CO₂ saved</div>
            </div>
            {leaders.map((p, index) => (
              <div
                key={p.id}
                className="grid grid-cols-12 gap-2 border-b border-slate-50 px-4 py-3 text-sm sm:px-5"
              >
                <div className="col-span-2 font-semibold tabular-nums text-slate-700">
                  {index + 1}
                </div>
                <div className="col-span-6 truncate font-medium text-slate-900 sm:col-span-7">
                  {p.name || "Anonymous"}
                </div>
                <div className="col-span-4 text-right font-semibold tabular-nums text-emerald-700 sm:col-span-3">
                  {Number(p.co2_saved || 0).toFixed(2)} kg
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

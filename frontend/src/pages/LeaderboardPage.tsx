import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import { apiRequest } from "../lib/api";

const SORT_OPTIONS = [
  { id: "co2", label: "CO₂ reduction" },
  { id: "storage", label: "Storage reduction" },
  { id: "screen", label: "Screen time reduction" },
  { id: "reachouts", label: "Reach-outs" }
] as const;

type SortId = (typeof SORT_OPTIONS)[number]["id"];

function normalizeSortFromUrl(raw: string | null): SortId {
  const s = (raw || "co2").trim().toLowerCase();
  const ok = SORT_OPTIONS.some((o) => o.id === s);
  return (ok ? s : "co2") as SortId;
}

export default function LeaderboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sortMode = useMemo(
    () => normalizeSortFromUrl(searchParams.get("sort")),
    [searchParams]
  );

  const [leaders, setLeaders] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const q =
        sortMode === "co2" ? "" : `?sort=${encodeURIComponent(sortMode)}`;
      const data = await apiRequest(`/api/leaderboard${q}`, "GET");
      if (!cancelled) {
        setLeaders(Array.isArray(data) ? data : []);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sortMode]);

  function setSort(next: SortId) {
    setSearchParams(next === "co2" ? {} : { sort: next }, { replace: true });
  }

  const myId = localStorage.getItem("participant_id");
  const myRank = useMemo(
    () => leaders.findIndex((l) => String(l.id) === String(myId)) + 1,
    [leaders, myId]
  );

  const sortDescription = useMemo(() => {
    switch (sortMode) {
      case "co2":
        return "Ranked by total estimated CO₂ saved (kg) from all weekly entries — same formula as your tracker.";
      case "storage":
        return "Ranked by total GB removed across all weeks you logged.";
      case "screen":
        return "Ranked by total minutes of screen-time reduction (each week: minutes below your usual week, summed).";
      case "reachouts":
        return "Ranked by verified reach-out matches (invite emails that belong to other registered participants).";
      default:
        return "Ranked by total estimated CO₂ saved (kg) from all weekly entries — same formula as your tracker.";
    }
  }, [sortMode]);

  return (
    <Layout>
      <div className="flex max-h-[calc(100dvh-7rem)] flex-col gap-3 sm:max-h-[calc(100dvh-6rem)]">
        <header className="shrink-0 space-y-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Leaderboard</h1>
            <p className="mt-0.5 text-sm text-slate-600">{sortDescription}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSort(opt.id)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                  sortMode === opt.id
                    ? "border-emerald-800 bg-emerald-700 text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-700 hover:border-emerald-400 hover:text-emerald-900"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <details className="rounded-xl border border-slate-100 bg-slate-50/90 px-3 py-2 text-xs text-slate-700 sm:px-4 sm:text-sm">
            <summary className="cursor-pointer select-none font-semibold text-emerald-900">
              How metrics are calculated
            </summary>
            <ul className="mt-2 list-disc space-y-1.5 pl-4 leading-relaxed">
              <li>
                <span className="font-medium text-slate-800">CO₂ column:</span> sum of weekly CO₂
                estimates (kg) using the same rules as the tracker.
              </li>
              <li>
                <span className="font-medium text-slate-800">GB reduction:</span> cumulative{" "}
                <code className="rounded bg-white px-1 py-0.5 text-[11px]">gb_deleted</code> across
                weeks.
              </li>
              <li>
                <span className="font-medium text-slate-800">Screen time reduction:</span> cumulative
                minutes from your weekly form (each week: total minutes less screen time vs your usual week).
              </li>
              <li>
                <span className="font-medium text-slate-800">Streaming reduction:</span> cumulative{" "}
                <code className="rounded bg-white px-1 py-0.5 text-[11px]">streaming_reduction</code>{" "}
                (minutes) across weeks.
              </li>
              <li>
                <span className="font-medium text-slate-800">Reach-out:</span> cumulative verified
                invite matches (not yourself).
              </li>
              <li>
                Use the <strong>filters</strong> above to re-rank the same top 20 by the metric you care
                about.
              </li>
            </ul>
          </details>
        </header>

        {myRank > 0 && (
          <div className="shrink-0 rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-900">
            Your rank: <span className="font-bold tabular-nums">#{myRank}</span>
            <span className="text-emerald-800"> (for this view)</span>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="max-h-full overflow-x-auto overflow-y-auto">
            <div className="min-w-[820px]">
              <div className="sticky top-0 z-10 grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(3.25rem,1fr)_minmax(3rem,1fr)_minmax(3.25rem,1fr)_minmax(3.25rem,1fr)_minmax(2.5rem,1fr)] gap-x-1.5 gap-y-1 border-b border-slate-100 bg-slate-50/95 px-3 py-2.5 text-[9px] font-semibold uppercase leading-tight tracking-wide text-slate-600 backdrop-blur-sm sm:gap-x-2 sm:px-5 sm:text-[10px]">
                <div>#</div>
                <div className="min-w-0">Participant</div>
                <div
                  className={`text-right ${sortMode === "co2" ? "text-emerald-900 ring-1 ring-emerald-200/80 ring-offset-1 rounded" : ""}`}
                >
                  CO₂
                </div>
                <div
                  className={`text-right leading-snug ${sortMode === "storage" ? "text-emerald-900 ring-1 ring-emerald-200/80 ring-offset-1 rounded" : ""}`}
                  title="Cumulative GB removed"
                >
                  <span className="hidden sm:inline">Storage</span>
                  <span className="sm:hidden">GB</span>
                </div>
                <div
                  className={`text-right leading-snug ${sortMode === "screen" ? "text-emerald-900 ring-1 ring-emerald-200/80 ring-offset-1 rounded" : ""}`}
                  title="Cumulative screen time reduction (minutes this week vs usual week, summed)"
                >
                  <span className="hidden sm:inline">Screen ↓</span>
                  <span className="sm:hidden">Scr</span>
                </div>
                <div
                  className="text-right leading-snug"
                  title="Cumulative streaming time reduced (minutes)"
                >
                  <span className="hidden sm:inline">Stream ↓</span>
                  <span className="sm:hidden">Str</span>
                </div>
                <div
                  className={`text-right ${sortMode === "reachouts" ? "text-emerald-900 ring-1 ring-emerald-200/80 ring-offset-1 rounded" : ""}`}
                >
                  Reach
                </div>
              </div>
              {leaders.map((p, index) => (
                <div
                  key={p.id}
                  className="grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(3.25rem,1fr)_minmax(3rem,1fr)_minmax(3.25rem,1fr)_minmax(3.25rem,1fr)_minmax(2.5rem,1fr)] gap-x-1.5 gap-y-1 border-b border-slate-50 px-3 py-2.5 text-xs sm:gap-x-2 sm:px-5 sm:text-sm"
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
                  <div className="text-right tabular-nums text-violet-900">
                    {Math.round(Number(p.screen_reduction_minutes ?? 0))}
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
                </div>
              ))}
              {leaders.length === 0 && (
                <div className="p-10 text-center text-sm text-slate-500">No leaderboard data yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

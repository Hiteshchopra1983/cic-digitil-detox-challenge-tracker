import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { apiRequest } from "../lib/api";
import { useParticipantJourney } from "../contexts/ParticipantJourneyContext";

export default function InviteParticipantsPage() {
  const { refresh } = useParticipantJourney();
  const participant_id = localStorage.getItem("participant_id");

  const [progress, setProgress] = useState<{
    duration: number;
    weeks?: Array<{ week: number; status: string }>;
  } | null>(null);
  const [emails, setEmails] = useState("");
  const [weekOverride, setWeekOverride] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const firstPending = useMemo(() => {
    if (progress?.suggested_week != null) {
      const n = Number(progress.suggested_week);
      if (Number.isFinite(n) && n >= 1) return n;
    }
    const w = progress?.weeks?.find((x) => x.status === "pending");
    return w?.week ?? null;
  }, [progress?.suggested_week, progress?.weeks]);

  const activeWeek = weekOverride ?? firstPending ?? 1;

  const loadProgress = useCallback(async () => {
    if (!participant_id) return;
    const data = await apiRequest(`/api/progress/${participant_id}`, "GET");
    if (data && !("error" in data && data.error)) {
      setProgress(
        data as {
          duration: number;
          weeks?: Array<{ week: number; status: string }>;
        }
      );
    }
  }, [participant_id]);

  useEffect(() => {
    void loadProgress();
  }, [loadProgress]);

  useEffect(() => {
    if (!participant_id) return;
    let cancelled = false;
    (async () => {
      const res = await apiRequest(
        `/api/weekly/entry/${participant_id}/${activeWeek}`,
        "GET"
      );
      if (cancelled) return;
      if (res?.entry) {
        setEmails(String(res.entry.reach_out_emails ?? ""));
      } else {
        setEmails("");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [participant_id, activeWeek]);

  async function save() {
    if (!participant_id) return;
    setSaving(true);
    setBanner(null);
    try {
      const res = await apiRequest("/api/weekly/reach-out", "POST", {
        participant_id,
        week_number: activeWeek,
        reach_out_emails: emails.trim()
      });
      if (res && typeof res === "object" && "error" in res && res.error) {
        setBanner({ type: "err", text: String(res.error) });
        return;
      }
      const n = Number((res as { reach_out_registered_count?: number }).reach_out_registered_count ?? 0);
      setBanner({
        type: "ok",
        text: `Saved for week ${activeWeek}. Emails matching registered participants (excluding you): ${n}.`
      });
      await refresh();
      await loadProgress();
    } catch {
      setBanner({ type: "err", text: "Save failed. Try again." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <div className="p-4 sm:p-6">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Invite participants
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            This uses the same reach-out list as the weekly tracker and the same leaderboard matching
            rules.
          </p>

          {progress ? (
            <div className="mt-5 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">
                Program week
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Array.from({ length: progress.duration || 6 }, (_, i) => i + 1).map((wn) => (
                  <button
                    key={wn}
                    type="button"
                    className={`rounded-lg px-2.5 py-1 text-sm font-medium tabular-nums ${
                      activeWeek === wn
                        ? "bg-emerald-700 text-white"
                        : "bg-slate-100 text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                    }`}
                    onClick={() => setWeekOverride(wn)}
                  >
                    W{wn}
                  </button>
                ))}
              </div>
              {weekOverride != null ? (
                <button
                  type="button"
                  className="text-sm font-medium text-emerald-800 underline decoration-dotted"
                  onClick={() => setWeekOverride(null)}
                >
                  Use default week
                </button>
              ) : null}
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">Loading program…</p>
          )}

          <label
            className="mt-6 block text-sm font-semibold text-slate-800"
            htmlFor="invite-emails"
          >
            Reach out — invite participants (emails)
          </label>
          <textarea
            id="invite-emails"
            className="input mt-2 min-h-[120px] resize-y"
            placeholder="friend1@school.edu, friend2@school.edu"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
          />
          <p className="help mt-2">
            Separate with commas. Each address that matches another registered participant (not
            your own account) counts toward your leaderboard reach-out bonus, same as on the weekly
            tracker.
          </p>

          {banner ? (
            <p
              className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
                banner.type === "ok"
                  ? "border-emerald-200 bg-emerald-50/90 text-emerald-900"
                  : "border-amber-200 bg-amber-50/90 text-amber-950"
              }`}
            >
              {banner.text}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              disabled={saving || !participant_id}
              onClick={() => void save()}
              className="rounded-xl bg-[#064e3b] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#053d2f] disabled:bg-slate-300"
            >
              {saving ? "Saving…" : "Save invites"}
            </button>
            <Link
              to="/weekly"
              className="text-center text-sm font-semibold text-emerald-800 underline decoration-emerald-600/40 underline-offset-2 hover:text-emerald-950 sm:text-left"
            >
              Open weekly tracker
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

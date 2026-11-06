import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import Dd2Shell from "../components/Dd2Shell";
import { getCheckin, saveCheckin, type CheckinState, type Dd2Actions } from "../lib/api";

type ActionKey = keyof Dd2Actions;

const EMPTY_ACTIONS: Dd2Actions = {
  cleanup: "",
  inbox: "",
  notif: "",
  streaming: ""
};

function weekLabel(week: number, monthLabel?: string) {
  if (monthLabel) return `Week ${week} · ${monthLabel}`;
  return `Week ${week}`;
}

export default function CheckInPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const participantId = localStorage.getItem("participant_id");
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const weekParam = params.get("week");
  const fromReminder = params.get("src") === "reminder" || params.get("from") === "reminder";

  const [state, setState] = useState<CheckinState | null>(null);
  const [actions, setActions] = useState<Dd2Actions>({ ...EMPTY_ACTIONS });
  const [expanded, setExpanded] = useState<ActionKey | null>("cleanup");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!participantId) return;
    setLoading(true);
    setError(null);
    const week = weekParam ? Number(weekParam) : undefined;
    const data = await getCheckin(participantId, week);
    if ((data as { error?: string }).error) {
      setError((data as { error: string }).error);
      setLoading(false);
      return;
    }
    const s = data as CheckinState;
    setState(s);
    if (s.this_week?.actions) {
      setActions({ ...EMPTY_ACTIONS, ...s.this_week.actions });
      setExpanded(null);
    } else {
      setActions({ ...EMPTY_ACTIONS });
      setExpanded("cleanup");
    }
    setLoading(false);
  }, [participantId, weekParam]);

  useEffect(() => {
    load();
  }, [load]);

  const allChosen = useMemo(
    () =>
      (["cleanup", "inbox", "notif", "streaming"] as ActionKey[]).every(
        (k) => !!actions[k]
      ),
    [actions]
  );

  const thisWeekDone = useMemo(
    () =>
      (["cleanup", "inbox", "notif", "streaming"] as ActionKey[]).filter(
        (k) => actions[k] && actions[k] !== "Not this week"
      ).length,
    [actions]
  );

  if (!token || !participantId) {
    const next = encodeURIComponent(
      `/check-in${weekParam ? `?week=${weekParam}` : ""}${
        fromReminder ? `${weekParam ? "&" : "?"}src=reminder` : ""
      }`
    );
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const pick = (key: ActionKey, choice: string) => {
    setActions((prev) => ({ ...prev, [key]: choice }));
    setSavedFlash(null);
    const order: ActionKey[] = ["cleanup", "inbox", "notif", "streaming"];
    const idx = order.indexOf(key);
    const following = order.slice(idx + 1).find((k) => {
      const val = k === key ? choice : actions[k];
      return !val;
    });
    setExpanded(following || null);
  };

  const onSave = async (skipWeek = false) => {
    if (!participantId || !state) return;
    if (!skipWeek && !allChosen) {
      setError("Choose a chip for each action (or skip the week).");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await saveCheckin({
      participant_id: participantId,
      week_number: state.week_number,
      skip_week: skipWeek,
      actions: skipWeek ? undefined : actions
    });
    setSaving(false);
    if ((res as { error?: string }).error) {
      setError((res as { error: string }).error);
      return;
    }
    setSavedFlash(
      skipWeek ? "Week skipped — come back anytime." : "Week saved. You’re done for now."
    );
    await load();
  };

  const banner = fromReminder
    ? "Opened from weekly reminder · email / WhatsApp"
    : state?.this_week?.skipped
      ? "This week was skipped — you can still edit or move on."
      : undefined;

  return (
    <Dd2Shell banner={banner}>
      {loading || !state ? (
        <p className="text-sm text-slate-600">Loading your check-in…</p>
      ) : (
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              {weekLabel(state.week_number, state.month?.label)}
            </p>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 mt-1">
              Weekly check-in
            </h2>
            <p className="text-sm text-slate-500 mt-1 leading-snug">
              About one minute. Report all, some, or none — then you’re done.
            </p>
          </div>

          {/* Month strip */}
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between mb-2.5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                {state.month?.label || "Your pace"}
              </p>
              <p className="text-[11px] text-slate-400">4 months · own pace</p>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {(state.month?.weeks || []).map((w) => {
                const st = w.status;
                const filled = st === "done";
                const current = st === "current";
                const skipped = st === "skipped";
                return (
                  <button
                    key={w.week}
                    type="button"
                    onClick={() => navigate(`/check-in?week=${w.week}`)}
                    className={[
                      "h-9 rounded-lg text-xs font-bold",
                      filled
                        ? "bg-[#064e3b] text-white"
                        : current
                          ? "bg-emerald-100 text-[#064e3b] border-[1.5px] border-[#064e3b]"
                          : skipped
                            ? "bg-slate-50 text-slate-400 border border-dashed border-slate-300"
                            : "bg-slate-50 text-slate-400 border border-slate-200"
                    ].join(" ")}
                  >
                    W{w.week}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Filled = checked in · dashed = skipped · outline = this week
            </p>
          </div>

          {/* Progress */}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-[#064e3b] p-3 text-white">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-200">
                This week
              </p>
              <p className="text-base font-bold mt-1.5 tracking-tight">
                {thisWeekDone} of 4
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Start to date
              </p>
              <p className="text-base font-bold mt-1.5 tracking-tight text-slate-900">
                {state.start_to_date.weeks_checked_in} week
                {state.start_to_date.weeks_checked_in === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {savedFlash ? (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-[#064e3b]">
              {savedFlash}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {/* Actions */}
          {(state.actions_catalog || []).map((def) => {
            const key = def.key as ActionKey;
            const value = actions[key];
            const isOpen = expanded === key;
            const status =
              value === "Not this week"
                ? "Not this week"
                : value || "Tap to check in";
            return (
              <div
                key={key}
                className={[
                  "rounded-xl border bg-white p-3",
                  isOpen ? "border-emerald-100" : "border-slate-200"
                ].join(" ")}
              >
                <button
                  type="button"
                  className="w-full flex items-start justify-between gap-2 text-left"
                  onClick={() => setExpanded(isOpen ? null : key)}
                >
                  <span className="text-sm font-bold text-slate-900">{def.title}</span>
                  <span
                    className={[
                      "text-xs font-bold text-right max-w-[7.5rem]",
                      value === "Not this week"
                        ? "text-slate-400"
                        : value
                          ? "text-[#064e3b]"
                          : "text-emerald-800"
                    ].join(" ")}
                  >
                    {status}
                  </span>
                </button>

                {isOpen ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-slate-500">{def.question}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {def.choices.map((c) => {
                        const on = value === c;
                        return (
                          <button
                            key={c}
                            type="button"
                            onClick={() => pick(key, c)}
                            className={[
                              "rounded-xl px-2.5 py-2.5 text-xs font-bold text-center",
                              on
                                ? "bg-[#064e3b] text-white"
                                : "bg-emerald-50 text-slate-900 border border-emerald-100"
                            ].join(" ")}
                          >
                            {c}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-center text-slate-400">
                      One tap · no typing required
                    </p>
                  </div>
                ) : null}
              </div>
            );
          })}

          <button
            type="button"
            disabled={saving || !allChosen}
            onClick={() => onSave(false)}
            className="w-full rounded-xl bg-[#064e3b] text-white py-3.5 text-sm font-bold disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save this week"}
          </button>

          <button
            type="button"
            disabled={saving}
            onClick={() => onSave(true)}
            className="w-full text-center text-xs font-semibold text-slate-400 py-1"
          >
            Skip this week entirely →
          </button>

          <p className="text-[11px] text-center text-slate-400 pt-1">
            Missed a week? No problem — join anytime, any week.
          </p>
        </div>
      )}
    </Dd2Shell>
  );
}

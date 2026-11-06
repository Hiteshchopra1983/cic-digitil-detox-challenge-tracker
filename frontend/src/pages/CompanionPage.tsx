import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import Dd2Shell from "../components/Dd2Shell";
import {
  COMPANION_GREETING,
  COMPANION_PROMPTS,
  type CompanionPrompt
} from "../lib/dd2Companion";

type ChatItem =
  | { kind: "bot"; text: string; cta?: { label: string; to: string } }
  | { kind: "user"; text: string };

export default function CompanionPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const participantId = localStorage.getItem("participant_id");
  const role = localStorage.getItem("role");

  const [thread, setThread] = useState<ChatItem[]>([
    { kind: "bot", text: COMPANION_GREETING }
  ]);

  const usedIds = useMemo(() => {
    const labels = new Set(
      thread.filter((t) => t.kind === "user").map((t) => t.text)
    );
    return COMPANION_PROMPTS.filter((p) => labels.has(p.label)).map((p) => p.id);
  }, [thread]);

  if (!token || !participantId) {
    return <Navigate to={`/login?next=${encodeURIComponent("/companion")}`} replace />;
  }
  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const ask = (prompt: CompanionPrompt) => {
    setThread((prev) => [
      ...prev,
      { kind: "user", text: prompt.label },
      {
        kind: "bot",
        text: prompt.reply.text,
        cta: prompt.reply.cta
      }
    ]);
  };

  return (
    <Dd2Shell showFab={false}>
      <div className="flex flex-col min-h-[70vh]">
        <div className="rounded-xl border border-slate-200 bg-white p-3 mb-3">
          <p className="text-sm font-bold text-[#064e3b]">AI Companion</p>
          <p className="text-xs text-slate-500 mt-1 leading-snug">
            Guided prompts only — helps you check in and understand the challenge.
            Does not invent programme numbers.
          </p>
        </div>

        <div className="flex-1 space-y-2.5 mb-4">
          {thread.map((item, i) =>
            item.kind === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[#064e3b] text-white px-3 py-2.5 text-xs leading-snug">
                  {item.text}
                </div>
              </div>
            ) : (
              <div key={i} className="flex justify-start">
                <div className="max-w-[92%] rounded-2xl rounded-bl-sm border border-emerald-100 bg-emerald-50 px-3 py-2.5 text-xs text-slate-900 leading-snug">
                  {item.text}
                  {item.cta ? (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => navigate(item.cta!.to)}
                        className="inline-block rounded-lg bg-[#064e3b] text-white text-[11px] font-bold px-2.5 py-1.5"
                      >
                        {item.cta.label}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            )
          )}
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Suggested prompts
          </p>
          <div className="flex flex-wrap gap-1.5">
            {COMPANION_PROMPTS.map((p) => {
              const used = usedIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => ask(p)}
                  className={[
                    "rounded-full border px-2.5 py-1.5 text-[11px] font-semibold",
                    used
                      ? "border-slate-200 bg-slate-50 text-slate-400"
                      : "border-slate-200 bg-white text-[#064e3b] hover:border-emerald-200"
                  ].join(" ")}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        <p className="text-[11px] text-center text-slate-400 mt-4">
          Tip: use the prompts — free typing isn’t needed for v1.
        </p>
      </div>
    </Dd2Shell>
  );
}

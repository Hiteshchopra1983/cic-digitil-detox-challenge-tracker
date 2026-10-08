import { Link, Navigate } from "react-router-dom";
import DirectChatPanel from "../components/DirectChatPanel";

export default function DirectChatWindowPage() {
  const token = localStorage.getItem("token");
  const participantId = localStorage.getItem("participant_id");

  if (!token || !participantId) {
    return <Navigate to="/login" replace />;
  }

  const role = localStorage.getItem("role");
  const backTo = role === "admin" ? "/admin" : "/participant-welcome";

  return (
    <div className="flex h-screen min-h-0 flex-col bg-gradient-to-br from-slate-100 via-white to-emerald-50/40 text-slate-900">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-slate-200/90 bg-white/90 px-4 py-2.5 backdrop-blur-sm">
        <p className="text-xs text-slate-600 sm:text-sm">
          Chat runs in this window — keep it open to stay connected. New messages play a short ping.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={backTo}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-sm hover:bg-slate-50 sm:text-sm"
          >
            Back to app
          </Link>
          <button
            type="button"
            onClick={() => window.close()}
            className="rounded-lg bg-[#064e3b] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#053d2f] sm:text-sm"
          >
            Close window
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">
        <DirectChatPanel />
      </div>
    </div>
  );
}

import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  children: ReactNode;
  banner?: string;
  /** Floating AI Help button (default on). Hide on Companion itself. */
  showFab?: boolean;
};

/** Minimal CIC shell for DD 2.0 PWA check-in (no sidebar / baseline). */
export default function Dd2Shell({ children, banner, showFab = true }: Props) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("participant_id");
    localStorage.removeItem("role");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 relative">
      <header className="bg-[#064e3b] text-white px-4 pt-3 pb-4">
        <div className="mx-auto max-w-lg flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate("/check-in")}
            className="text-left"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-200">
              CIC Challenge
            </p>
            <h1 className="text-lg font-bold tracking-tight mt-0.5">Digital Detox</h1>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/companion")}
              className="text-xs font-semibold text-emerald-100/90 border border-white/25 rounded-lg px-2.5 py-1.5 hover:bg-white/10"
            >
              AI Help
            </button>
            <button
              type="button"
              onClick={logout}
              className="text-xs font-semibold text-emerald-100/90 border border-white/25 rounded-lg px-2.5 py-1.5 hover:bg-white/10"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {banner ? (
        <div className="bg-emerald-100 border-b border-emerald-200 px-4 py-2">
          <p className="mx-auto max-w-lg text-xs font-semibold text-[#064e3b] leading-snug">
            {banner}
          </p>
        </div>
      ) : null}

      <main className="mx-auto max-w-lg px-3 py-4 pb-24">{children}</main>

      {showFab ? (
        <button
          type="button"
          onClick={() => navigate("/companion")}
          aria-label="Open AI Companion"
          className="fixed z-40 right-4 bottom-5 w-[52px] h-[52px] rounded-full bg-[#065f46] text-white flex flex-col items-center justify-center leading-tight shadow-none border border-emerald-800/30"
        >
          <span className="text-[11px] font-bold">AI</span>
          <span className="text-[9px] font-semibold opacity-90">Help</span>
        </button>
      ) : null}
    </div>
  );
}

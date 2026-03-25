import { useLocation, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { useParticipantJourney } from "../contexts/ParticipantJourneyContext";

type SidebarProps = {
  onNavigate?: () => void;
};

export default function Sidebar({ onNavigate }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const role = localStorage.getItem("role");
  const admin = role === "admin";

  const {
    loading,
    baselineCompleted,
    hasWeeklySubmission,
    isParticipantJourney
  } = useParticipantJourney();

  const journeyApplies = admin ? false : isParticipantJourney;

  const weeklyLocked =
    journeyApplies && (loading || !baselineCompleted);
  const dashboardLocked =
    journeyApplies && (loading || !baselineCompleted || !hasWeeklySubmission);
  const leaderboardLocked = dashboardLocked;

  function handleLockedNav() {
    if (!baselineCompleted) {
      navigate("/baseline");
    } else if (!hasWeeklySubmission) {
      navigate("/weekly");
    }
    onNavigate?.();
  }

  function go(path: string, locked: boolean) {
    if (locked) {
      handleLockedNav();
      return;
    }
    navigate(path);
    onNavigate?.();
  }

  const items: {
    label: string;
    path: string;
    locked: boolean;
  }[] = [
    { label: "Dashboard", path: "/dashboard", locked: dashboardLocked },
    { label: "Baseline", path: "/baseline", locked: false },
    { label: "Weekly Tracker", path: "/weekly", locked: weeklyLocked },
    { label: "Leaderboard", path: "/leaderboard", locked: leaderboardLocked },
    { label: "Profile", path: "/profile", locked: false },
    ...(role === "admin" ? [{ label: "Admin", path: "/admin", locked: false }] : [])
  ];

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("participant_id");
    localStorage.removeItem("role");
    navigate("/");
    onNavigate?.();
  }

  return (
    <div className="flex h-full flex-col bg-[#064e3b] p-4 text-white md:p-5">
      <div className="mb-5 border-b border-white/15 pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-200/90">
          CIC Challenge
        </p>
        <h2 className="mt-1 text-lg font-bold tracking-tight">Digital Detox</h2>
      </div>

      <nav className="flex-1 space-y-1">
        {items.map((item) => (
          <button
            key={item.path}
            type="button"
            onClick={() => go(item.path, item.locked && !admin)}
            title={
              item.locked && !admin
                ? !baselineCompleted
                  ? "Complete your baseline first"
                  : "Submit your first week to unlock"
                : undefined
            }
            className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
              location.pathname === item.path
                ? "bg-white/20 text-white shadow-inner"
                : item.locked && !admin
                  ? "text-emerald-200/60 hover:bg-white/5"
                  : "text-emerald-100 hover:bg-white/10"
            }`}
          >
            {item.locked && !admin ? (
              <Lock className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            ) : (
              <span className="w-4 shrink-0" aria-hidden />
            )}
            <span className="min-w-0 flex-1">{item.label}</span>
          </button>
        ))}
      </nav>

      <button
        type="button"
        onClick={logout}
        className="mt-4 w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-100 transition hover:bg-red-950/35"
      >
        Logout
      </button>
    </div>
  );
}

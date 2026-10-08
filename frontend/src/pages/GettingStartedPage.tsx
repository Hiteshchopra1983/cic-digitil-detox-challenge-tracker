import { Navigate, useNavigate } from "react-router-dom";
import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Trophy,
  Users
} from "lucide-react";
import Layout from "../components/Layout";
import { useParticipantJourney } from "../contexts/ParticipantJourneyContext";

export default function GettingStartedPage() {
  const navigate = useNavigate();
  const { loading, baselineCompleted, hasWeeklySubmission } = useParticipantJourney();

  const token = localStorage.getItem("token");
  const participantId = localStorage.getItem("participant_id");
  const role = localStorage.getItem("role");

  if (!token || !participantId) {
    return <Navigate to="/login" replace />;
  }

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  function continuePath() {
    if (!baselineCompleted) return "/baseline";
    if (!hasWeeklySubmission) return "/weekly";
    return "/dashboard";
  }

  function continueLabel() {
    if (!baselineCompleted) return "Continue to baseline";
    if (!hasWeeklySubmission) return "Continue to weekly tracker";
    return "Go to dashboard";
  }

  const supportItems = [
    {
      icon: Mail,
      text: "Each week for six weeks, the CIC will email you tips for reducing your digital footprint in a particular area, such as streaming."
    },
    {
      icon: CalendarDays,
      text: "At the end of each week, open the Weekly Tracker tab and record your achievements for the week."
    },
    {
      icon: Trophy,
      text: "Watch the Leaderboard to see where you rank — can you reach the top ten?"
    },
    {
      icon: MessageCircle,
      text: "Use the chat button to connect with other participants and exchange ideas."
    }
  ];

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm">
          <div className="border-b border-emerald-950/10 bg-gradient-to-r from-[#064e3b] to-emerald-800 px-5 py-6 text-white sm:px-8 sm:py-8">
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Your next steps</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-emerald-100/95">
              Let&apos;s take the challenge together to measure and reduce your footprint over the
              coming six weeks.
            </p>
          </div>

          <div className="space-y-8 px-5 py-6 sm:px-8 sm:py-8">
            <section className="space-y-3 text-sm leading-relaxed text-slate-700">
              <h2 className="text-base font-semibold text-slate-900">Create your baseline</h2>
              <p>
                Take your time to record your current digital footprint. Click the{" "}
                <strong className="text-slate-900">Baseline</strong> tab on the left to get started.
              </p>
            </section>

            <section className="space-y-3 text-sm leading-relaxed text-slate-700">
              <h2 className="text-base font-semibold text-slate-900">Spread the word</h2>
              <p>
                If you were surprised too and want others to join you: each week on the{" "}
                <strong className="text-slate-900">Weekly Tracker</strong>, use the{" "}
                <strong className="text-slate-900">Invite participants (emails)</strong> field to add
                friends and family so they can join the challenge.
              </p>
              <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs text-slate-600">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-emerald-800" aria-hidden />
                <span>
                  Invites you add there can count toward your reach-out score on the leaderboard when
                  those addresses match registered participants.
                </span>
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
                <BarChart3 className="h-5 w-5 text-emerald-800" aria-hidden />
                How CIC supports this journey
              </h2>
              <p className="text-sm font-medium text-slate-600">What happens next</p>
              <ul className="space-y-3">
                {supportItems.map(({ icon: Icon, text }, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-3 py-3 text-sm leading-relaxed text-slate-700"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-800 shadow-sm ring-1 ring-slate-200/80">
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <span className="pt-0.5">{text}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-emerald-100 bg-emerald-50/50 px-4 py-4 text-sm text-slate-700">
              <p className="font-medium text-slate-900">Questions?</p>
              <p className="mt-1">
                Email{" "}
                <a
                  href="mailto:digital-detox@communityimpactchallenge.org"
                  className="font-semibold text-emerald-900 underline-offset-2 hover:underline"
                >
                  digital-detox@communityimpactchallenge.org
                </a>
              </p>
            </section>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                disabled={loading}
                onClick={() => navigate(continuePath())}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#064e3b] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#053d2f] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LayoutDashboard className="h-4 w-4 opacity-90" aria-hidden />
                {loading ? "Loading…" : continueLabel()}
              </button>
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="text-sm font-medium text-emerald-800 underline-offset-2 hover:underline"
              >
                Review your profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

import { Navigate } from "react-router-dom";
import { CalendarDays, Mail, MessageCircle, Trophy } from "lucide-react";
import Layout from "../components/Layout";
import whatsappGroupIcon from "@/assets/branding/whatsapp-group-icon.png";
import { DIGITAL_TRADE_OFFS_DOC_URL } from "../constants/faqDocUrls";

const SUPPORT_EMAIL = "digital-detox@communityimpactchallenge.org";

/** Production WhatsApp group; override with VITE_WHATSAPP_CHANNEL_URL if needed. */
const WHATSAPP_GROUP_INVITE_URL =
  (import.meta.env.VITE_WHATSAPP_CHANNEL_URL as string | undefined)?.trim() ||
  "https://chat.whatsapp.com/Ds4TT49Batd0KV1uFnWEbL";

const journeySteps = [
  {
    icon: Mail,
    title: "Weekly tips on WhatsApp",
    body: "Each week for 6 weeks, the CIC will post practical tips on WhatsApp for reducing your digital footprint in a focused area—for example, streaming."
  },
  {
    icon: CalendarDays,
    title: "Log progress weekly",
    body: "At the end of each week, open the Weekly Tracker tab and record how you reduced your footprint that week."
  },
  {
    icon: Trophy,
    title: "Follow the leaderboard",
    body: "Watch the Leaderboard to see where you stand among participants."
  },
  {
    icon: MessageCircle,
    title: "Connect with others",
    body: "Use Chat to message other participants and exchange ideas."
  }
] as const;

const weekSections: { id: string; title: string; intro?: string; bullets: string[] }[] = [
  {
    id: "week-0",
    title: "Week 0 (May 15 - 24) — Know Your Starting Point",
    intro:
      "Take a quick snapshot of your digital life. What’s taking up space? What’s draining your attention? Set your goals and pick a few simple actions to reduce your footprint.",
    bullets: []
  },
  {
    id: "week-1",
    title: "Week 1 (May 25 - 31) — Tame Your Phone & Tablet",
    intro: "Your pocket shouldn’t feel overwhelming.",
    bullets: ["Declutter apps", "Silence noisy notifications", "Delete unused photos & downloads"]
  },
  {
    id: "week-2",
    title: "Week 2 (Jun 1 - 7) — Clean Up Your Computer",
    intro: "Time to give your laptop/desktop a fresh start.",
    bullets: [
      "Organize files and folders",
      "Uninstall what you don’t use",
      "Clear out that chaotic Downloads folder"
    ]
  },
  {
    id: "week-3",
    title: "Week 3 (Jun 8 - 14) — Declutter the Cloud",
    intro: "Out of sight does not mean out of mind.",
    bullets: [
      "Review cloud storage (Drive, Dropbox, iCloud, etc.)",
      "Remove duplicates and old files",
      "Keep only what matters"
    ]
  },
  {
    id: "week-4",
    title: "Week 4 (Jun 15 - 21) — Inbox Reset",
    intro: "Let’s turn inbox stress into inbox zen.",
    bullets: ["Unsubscribe from clutter", "Archive or delete old emails", "Set up simple filters"]
  },
  {
    id: "week-5",
    title: "Week 5 (Jun 22 - 30) — Maintain Your New Balance",
    intro: "You’ve done the hard part. Now make it stick.",
    bullets: ["Build small weekly habits", "Do quick clean-ups", "Stay intentional with your digital use"]
  }
];

/** Compact, lightweight surfaces — mobile + desktop */
function cardClass() {
  return "rounded-xl border border-slate-200/90 bg-white p-3 shadow-sm ring-1 ring-slate-900/[0.03] sm:p-3.5 lg:p-3";
}

export default function ParticipantWelcomePage() {
  const isPreviewMode =
    import.meta.env.DEV &&
    new URLSearchParams(window.location.search).get("preview") === "1";

  const token = localStorage.getItem("token");
  const participantId = localStorage.getItem("participant_id");
  const role = localStorage.getItem("role");

  if (!token || !participantId) {
    if (!isPreviewMode) {
      return <Navigate to="/login" replace />;
    }
  }

  if (role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const body = "text-xs leading-snug text-slate-700 lg:text-[12.5px] lg:leading-snug";
  const bodyMuted = "text-xs leading-snug text-slate-600 lg:text-[12.5px] lg:leading-snug";
  const stepTitle = "text-xs font-semibold text-slate-900 lg:text-[13px]";
  const cardTitle = "text-base font-bold text-slate-900 lg:text-[15px] lg:leading-tight";
  const kicker = "text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500";

  return (
    <Layout dense pinFooterToMain>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="app-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain pb-2">
          <div className="flex flex-col gap-2.5 sm:gap-3">
          <header className="rounded-xl border border-slate-200/90 bg-white px-3 py-2 shadow-sm ring-1 ring-slate-900/[0.03] sm:px-3.5 sm:py-2.5">
            <h1 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl lg:text-2xl lg:leading-tight">
              Welcome to the Digital Detox challenge
            </h1>
            <p className={`mt-1 ${bodyMuted}`}>
              Use the menu on the left anytime to move between sections.
            </p>
            <p className={`mt-2 ${bodyMuted}`}>
              The challenge is about smarter digital choices—for yourself, your work, and your family.{" "}
              <a
                href={DIGITAL_TRADE_OFFS_DOC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-emerald-800 underline decoration-emerald-400/70 underline-offset-2 hover:text-emerald-950 hover:decoration-emerald-600"
              >
                Common trade-offs &amp; simple swaps
              </a>{" "}
              (opens in a new tab).
            </p>
          </header>

          <section className="grid items-start gap-2.5 sm:gap-3 lg:grid-cols-3 lg:gap-3">
            <article className={cardClass()} aria-labelledby="getting-started-heading">
            <div className="mb-2 border-b border-slate-100 pb-2">
              <p className={kicker}>Quick Start</p>
              <h2 id="getting-started-heading" className={`mt-0.5 ${cardTitle}`}>
                Getting started
              </h2>
            </div>

            <div className="space-y-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2">
                <p className={stepTitle}>1) Create your Baseline</p>
                <p className={`mt-0.5 ${body}`}>
                  Record your current digital footprint. Open the{" "}
                  <span className="font-semibold text-slate-900">Baseline</span> tab in the left menu
                  to get started.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2">
                <p className={stepTitle}>2) Spread the word</p>
                <p className={`mt-0.5 ${body}`}>
                  If you want others to join you: use the{" "}
                  <span className="font-semibold text-slate-900">Invite Participants</span> tab and add
                  email addresses of friends and family who can take the challenge with you.
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 py-2">
                <p className={stepTitle}>3) Join the WhatsApp group</p>
                <div className={`mt-2 flex flex-col items-center gap-2.5 sm:flex-row sm:items-start`}>
                  <a
                    href={WHATSAPP_GROUP_INVITE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group shrink-0 rounded-2xl p-1 ring-2 ring-transparent transition hover:ring-emerald-500/35 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                    aria-label="Open WhatsApp group invite in a new tab"
                  >
                    <img
                      src={whatsappGroupIcon}
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-2xl object-contain shadow-sm"
                      decoding="async"
                    />
                  </a>
                  <p className={`${body} text-center sm:text-left`}>
                    Tap the icon or{" "}
                    <a
                      href={WHATSAPP_GROUP_INVITE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-emerald-800 underline decoration-emerald-400/70 underline-offset-2 hover:text-emerald-950 hover:decoration-emerald-600"
                    >
                      join the WhatsApp group
                    </a>{" "}
                    for weekly tips and to connect with fellow participants.
                  </p>
                </div>
              </div>
            </div>
            </article>

            <article className={cardClass()} aria-labelledby="six-week-heading">
            <div className="mb-2 border-b border-slate-100 pb-2">
              <p className={kicker}>Program Overview</p>
              <h2 id="six-week-heading" className={`mt-0.5 ${cardTitle}`}>
                Our 6-Week Digital Detox Challenge
              </h2>
              <p className={`mt-1 ${bodyMuted}`}>Program window: May 15 – June 30</p>
            </div>

            <p className={body}>
              Ready to clear the clutter and reclaim your digital space? Let&apos;s do this—one step at
              a time.
            </p>

            <div className="mt-2 space-y-1.5">
              {weekSections.map((week) => (
                <details
                  key={week.id}
                  className="rounded-lg border border-slate-200 bg-slate-50/60 px-2 py-1.5 lg:px-2 lg:py-1.5"
                >
                  <summary className="cursor-pointer list-none pr-3 text-xs font-semibold text-slate-900 lg:text-[12.5px]">
                    {week.title}
                  </summary>
                  {week.intro ? <p className={`mt-1 ${body}`}>{week.intro}</p> : null}
                  {week.bullets.length ? (
                    <ul className="mt-1 space-y-0.5 text-xs text-slate-700 lg:text-[12.5px]">
                      {week.bullets.map((b) => (
                        <li key={b} className="flex gap-1.5 leading-snug">
                          <span aria-hidden className="shrink-0">
                            •
                          </span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </details>
              ))}
            </div>

            <p className={`mt-2 text-xs font-medium leading-snug text-slate-800 lg:text-[12.5px]`}>
              Remember: You don&apos;t have to wait—mix and match actions across devices anytime during
              the 6 weeks. Progress over perfection.
            </p>
            </article>

            <article className={cardClass()} aria-labelledby="journey-support-heading">
            <div className="mb-2 border-b border-slate-100 pb-2">
              <p className={kicker}>CIC Support</p>
              <h2 id="journey-support-heading" className={`mt-0.5 ${cardTitle}`}>
                How CIC supports this journey
              </h2>
            </div>

            <div className="space-y-1.5">
              {journeySteps.map(({ icon: Icon, title, body: blurb }) => (
                <div
                  key={title}
                  className="rounded-lg border border-slate-200 bg-slate-50/75 px-2.5 py-2 transition hover:bg-white lg:py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-slate-700 shadow-sm ring-1 ring-slate-200/80 lg:h-7 lg:w-7">
                      <Icon className="h-3 w-3 lg:h-3.5 lg:w-3.5" aria-hidden />
                    </span>
                    <h3 className="text-xs font-bold text-slate-900 lg:text-[12.5px]">{title}</h3>
                  </div>
                  <p className={`mt-1 ${bodyMuted}`}>{blurb}</p>
                </div>
              ))}
            </div>

            <div className="mt-2 rounded-lg border border-slate-200 bg-slate-100/70 px-2.5 py-2 lg:py-1.5">
              <p className="text-xs font-bold text-slate-900 lg:text-[12.5px]">
                Can you reach the top 10 on the leaderboard?
              </p>
              <p className={`mt-0.5 ${bodyMuted}`}>
                Small, consistent weekly changes add up—your rank reflects both impact and community
                reach-out.
              </p>
            </div>
            </article>
          </section>
          </div>
        </div>

        <footer className="shrink-0 -mx-2.5 border-t border-slate-200 bg-slate-50/95 px-3 py-3 pr-14 sm:-mx-4 sm:px-4 sm:pr-16">
          <p className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">Questions?</p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-1.5 block break-all text-sm font-semibold text-slate-800 underline decoration-slate-400 underline-offset-2 hover:text-slate-950 hover:decoration-slate-600"
          >
            {SUPPORT_EMAIL}
          </a>
        </footer>
      </div>
    </Layout>
  );
}

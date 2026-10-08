import { useNavigate } from "react-router-dom";
import { Leaf, Mail, Shield, Sparkles, UserPlus } from "lucide-react";
import sattvaSponsorLogo from "@/assets/branding/sattva-sponsor-logo.png";

/** Full policy document (S3). Path segments encoded for a reliable browser request. */
const GDPR_POLICY_URL = `https://gdprpolicy.s3.eu-west-3.amazonaws.com/${encodeURIComponent(
  "20250126 CIC General Data Protection Regulation (GDPR) Policy.docx"
)}`;

/** Short GDPR notice; full legal text is in the linked Word document. */
const GDPR_INTRO =
  "We handle personal data carefully and only for this challenge—registration, your activity in the program, and related communications—consistent with the GDPR and French data-protection law.";

const steps = [
  {
    step: 1,
    title: "Register your profile",
    body: "Create your account to track your journey securely."
  },
  {
    step: 2,
    title: "Sign in",
    body: "Record your baseline and update your progress over six weeks."
  }
] as const;

export default function WelcomeLandingPage() {
  const navigate = useNavigate();

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#022c22] pb-10">
      {/* Background atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-950/50 via-transparent to-teal-950/60"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-32 top-0 h-[28rem] w-[28rem] rounded-full bg-emerald-400/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 bottom-0 h-[24rem] w-[24rem] rounded-full bg-teal-300/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-15%,rgba(52,211,153,0.22),transparent)]"
        aria-hidden
      />

      <div className="relative z-[1] mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {/* Brand strip + sponsor */}
        <header className="mb-8 flex w-full min-w-0 shrink-0 flex-col items-stretch gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="inline-flex w-full max-w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3 shadow-lg shadow-black/10 backdrop-blur-md sm:inline-flex sm:w-auto sm:max-w-[min(100%,28rem)] sm:shrink sm:px-5 sm:py-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/30 to-emerald-900/40 ring-1 ring-white/20">
              <Leaf className="h-5 w-5 text-emerald-100" aria-hidden strokeWidth={2.25} />
            </div>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200/95">
                Community Impact Challenge
              </p>
              <p className="truncate text-sm font-bold tracking-tight text-white sm:text-base">
                Digital Detox
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2.5 self-end sm:self-auto sm:gap-3">
            <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-200/85 sm:text-[11px]">
              Sponsored by
            </span>
            <img
              src={sattvaSponsorLogo}
              alt="Sattva — Delivering High Impact."
              className="h-9 w-auto max-w-[min(100%,12rem)] object-contain object-left sm:h-10 sm:max-w-[14rem]"
              width={220}
              height={48}
              loading="lazy"
              decoding="async"
            />
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col justify-center gap-10">
          <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-14">
            {/* Hero */}
            <div className="text-white lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl border border-white/12 bg-gradient-to-br from-white/[0.09] to-white/[0.02] p-6 shadow-xl shadow-black/15 ring-1 ring-white/10 backdrop-blur-md sm:p-7 lg:p-8">
                <div
                  className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-400/15 blur-3xl"
                  aria-hidden
                />
                <div className="relative">
                  <p className="inline-flex items-center gap-2 rounded-full border border-emerald-300/40 bg-emerald-950/30 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-50">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-200" aria-hidden />
                    Six-week challenge
                  </p>
                  <h1 className="mt-5 text-pretty text-3xl font-bold leading-[1.12] tracking-tight text-white sm:text-4xl lg:text-[2.2rem] lg:leading-[1.1]">
                    Welcome to the
                    <br />
                    Digital Detox Challenge
                  </h1>
                  <p className="mt-5 max-w-md text-pretty text-base leading-relaxed text-emerald-50/95 sm:text-[1.05rem]">
                    Your digital footprint can emit more CO₂ than you think. Discover how much, measure
                    it, and reduce it over six weeks with CIC support.
                  </p>
                  <div
                    className="mt-6 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-emerald-200/80"
                    aria-hidden
                  >
                    <span className="h-1 w-1 rounded-full bg-emerald-300/90" />
                    <span>Measure</span>
                    <span className="h-1 w-1 rounded-full bg-emerald-300/90" />
                    <span>Reduce</span>
                    <span className="h-1 w-1 rounded-full bg-emerald-300/90" />
                    <span>Compete</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mx-auto w-full max-w-xl lg:col-span-7 lg:mx-0 lg:max-w-none">
              <div className="overflow-hidden rounded-[1.65rem] border border-slate-200/90 bg-white font-welcome-card text-[0.9375rem] leading-snug shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/60 antialiased sm:text-[0.96875rem] sm:leading-normal">
                {/* Section 1 — intro */}
                <div className="border-b border-slate-100 bg-white px-5 py-4 sm:px-6 sm:py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 sm:text-[11px]">
                    Get started
                  </p>
                  <p className="mt-1 text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                    Two quick steps
                  </p>
                </div>

                {/* Sections 2–4 — shared horizontal padding + dividers */}
                <div className="divide-y divide-slate-100">
                  <div className="bg-gradient-to-b from-white to-slate-50/25 px-5 py-4 sm:px-6 sm:py-5">
                    <ol className="relative space-y-0">
                      {steps.map(({ step, title, body }, i) => (
                        <li key={step} className="relative flex gap-3 pb-5 last:pb-0 sm:gap-3.5">
                          {i < steps.length - 1 ? (
                            <span
                              className="absolute left-[13px] top-8 bottom-0.5 w-px bg-gradient-to-b from-slate-200 to-transparent sm:left-[15px] sm:top-9"
                              aria-hidden
                            />
                          ) : null}
                          <span className="relative z-[1] flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-600 to-emerald-900 text-[10px] font-bold text-white shadow-sm ring-2 ring-white sm:h-8 sm:w-8 sm:text-[11px]">
                            {step}
                          </span>
                          <div className="min-w-0 pt-0.5">
                            <p className="text-[13px] font-semibold leading-tight tracking-tight text-slate-900 sm:text-sm">
                              {title}
                            </p>
                            <p className="mt-1 text-[11px] leading-snug text-slate-600 sm:text-xs sm:leading-relaxed">
                              {body}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <section
                    className="bg-slate-50/90 px-5 py-4 sm:px-6 sm:py-5"
                    aria-labelledby="gdpr-heading"
                  >
                    <div className="flex gap-3 sm:gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-slate-200/80 sm:h-11 sm:w-11 sm:rounded-2xl">
                        <Shield className="h-5 w-5 text-slate-600 sm:h-[1.35rem] sm:w-[1.35rem]" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1 space-y-2.5 text-slate-800">
                        <div>
                          <h2
                            id="gdpr-heading"
                            className="text-[13px] font-bold leading-snug tracking-tight text-slate-900 sm:text-sm"
                          >
                            General Data Protection Regulation (GDPR) Policy
                          </h2>
                          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 sm:text-[11px]">
                            Why is data protection important?
                          </p>
                        </div>
                        <p className="rounded-lg border border-slate-200/90 bg-white px-3 py-2.5 text-[11px] leading-relaxed text-slate-600 sm:text-xs sm:leading-relaxed">
                          {GDPR_INTRO}{" "}
                          <a
                            href={GDPR_POLICY_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-emerald-800 underline decoration-emerald-300/80 underline-offset-2 transition hover:text-emerald-950"
                          >
                            See more
                          </a>
                        </p>

                        <div className="flex flex-col gap-2 pt-0.5 sm:flex-row sm:gap-2.5">
                          <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-b from-emerald-700 to-emerald-900 px-4 py-2.5 text-[11px] font-semibold text-white shadow-sm transition duration-200 hover:from-emerald-800 hover:to-emerald-950 sm:text-xs"
                          >
                            Sign in
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate("/signup")}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[11px] font-semibold text-slate-800 shadow-sm transition duration-200 hover:border-emerald-200 hover:bg-emerald-50/90 sm:text-xs"
                          >
                            <UserPlus className="h-3 w-3 text-emerald-800 sm:h-3.5 sm:w-3.5" aria-hidden />
                            Signup for the challenge
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  <div className="flex items-start justify-center gap-2 bg-gradient-to-r from-slate-50/95 via-white to-slate-50/95 px-5 py-3 text-center sm:items-center sm:justify-start sm:gap-2.5 sm:px-6 sm:py-3 sm:text-left">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200/80 sm:mt-0 sm:h-8 sm:w-8">
                      <Mail className="h-3 w-3 text-slate-500 sm:h-3.5 sm:w-3.5" aria-hidden />
                    </span>
                    <p className="min-w-0 text-left text-[11px] leading-snug text-slate-600 sm:text-xs">
                      <span className="text-sm font-bold text-slate-900 sm:text-base">Questions?</span>{" "}
                      <a
                        href="mailto:digital-detox@communityimpactchallenge.org"
                        className="break-all font-semibold text-emerald-800 underline decoration-slate-300 underline-offset-2 transition hover:text-emerald-950"
                      >
                        digital-detox@communityimpactchallenge.org
                      </a>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

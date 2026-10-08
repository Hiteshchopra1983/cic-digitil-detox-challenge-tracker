import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Info } from "lucide-react";
import { apiRequest } from "../lib/api";
import Layout from "../components/Layout";
import { FieldLabelWithInfo } from "../components/FieldLabelWithInfo";
import { useParticipantJourney } from "../contexts/ParticipantJourneyContext";
import { WEEKLY_TRACKER_FAQ_DOC_URL } from "../constants/faqDocUrls";

function baselineFootprintGbFromData(d: Record<string, unknown> | undefined) {
  if (!d) return 0;
  return (
    Number(d.phone_devices || 0) * Number(d.phone_storage_gb || 0) +
    Number(d.laptop_devices || 0) * Number(d.laptop_storage_gb || 0) +
    Number(d.tablet_devices || 0) * Number(d.tablet_storage_gb || 0) +
    Number(d.cloud_accounts || 0) * Number(d.cloud_storage_gb || 0)
  );
}

export default function WeeklySubmitPage() {
  const navigate = useNavigate();
  const { refresh } = useParticipantJourney();

  const [form, setForm] = useState<any>({});
  const [progress, setProgress] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [baselineFootprintGb, setBaselineFootprintGb] = useState(0);
  const [previewCo2, setPreviewCo2] = useState(0);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [co2Breakdown, setCo2Breakdown] = useState<{
    mode: string;
    total_kg: number;
    lines: Array<{ key: string; label: string; kg: number; detail: string }>;
  } | null>(null);
  const [editWeekOverride, setEditWeekOverride] = useState<number | null>(null);

  const participant_id = localStorage.getItem("participant_id");

  const firstPending = useMemo(() => {
    if (progress?.suggested_week != null) {
      const n = Number(progress.suggested_week);
      if (Number.isFinite(n) && n >= 1) return n;
    }
    const w = progress?.weeks?.find((x: { status: string }) => x.status === "pending");
    return w?.week ?? null;
  }, [progress?.suggested_week, progress?.weeks]);

  const activeWeek = editWeekOverride ?? firstPending;

  const programComplete =
    progress &&
    progress.duration > 0 &&
    progress.submitted >= progress.duration &&
    firstPending === null;

  const refreshCo2Preview = useCallback(async () => {
    if (!participant_id || activeWeek == null) return;
    const res = await apiRequest("/api/weekly/preview", "POST", {
      week_number: activeWeek,
      storage_deleted_gb: Number(form.storage_deleted_gb) || 0,
      downloads_avoided_gb: Number(form.downloads_avoided_gb) || 0,
      streaming_reduction_minutes: Number(form.streaming_reduction_minutes) || 0,
      screen_time_change_minutes: Number(form.screen_time_change_minutes) || 0,
      emails_reduced: Number(form.emails_reduced) || 0,
      messages_reduced: Number(form.messages_reduced) || 0,
      llm_queries_reduced: Number(form.llm_queries_reduced) || 0
    });
    if (res?.error) {
      setPreviewError(String(res.error));
      setPreviewCo2(0);
      setCo2Breakdown(null);
      return;
    }
    setPreviewError(null);
    if (res?.co2_saved != null) {
      setPreviewCo2(Number(res.co2_saved));
    } else {
      setPreviewCo2(0);
    }
    if (res?.breakdown && typeof res.breakdown === "object") {
      setCo2Breakdown(
        res.breakdown as {
          mode: string;
          total_kg: number;
          lines: Array<{ key: string; label: string; kg: number; detail: string }>;
        }
      );
    } else {
      setCo2Breakdown(null);
    }
  }, [participant_id, activeWeek, form]);

  useEffect(() => {
    initPage();
  }, []);

  useEffect(() => {
    if (!participant_id || activeWeek == null) return;
    let cancelled = false;
    (async () => {
      const res = await apiRequest(
        `/api/weekly/entry/${participant_id}/${activeWeek}`,
        "GET"
      );
      if (cancelled) return;
      if (res?.entry) {
        setForm({
          storage_deleted_gb: res.entry.storage_deleted_gb ?? "",
          downloads_avoided_gb: res.entry.downloads_avoided_gb ?? "",
          streaming_reduction_minutes: res.entry.streaming_reduction_minutes ?? "",
          screen_time_change_minutes: res.entry.screen_time_change_minutes ?? "",
          emails_reduced: res.entry.emails_reduced ?? "",
          messages_reduced: res.entry.messages_reduced ?? "",
          ritual_completed: !!res.entry.ritual_completed,
          alumni_touchpoints: res.entry.alumni_touchpoints ?? "",
          reach_out_emails: res.entry.reach_out_emails ?? "",
          tiktok_reduction_minutes: res.entry.tiktok_reduction_minutes ?? "",
          instagram_reduction_minutes: res.entry.instagram_reduction_minutes ?? "",
          facebook_reduction_minutes: res.entry.facebook_reduction_minutes ?? "",
          youtube_reduction_minutes: res.entry.youtube_reduction_minutes ?? "",
          llm_queries_reduced: res.entry.llm_queries_reduced ?? ""
        });
      } else {
        setForm({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [participant_id, activeWeek]);

useEffect(() => {
  if (!participant_id) return;
  const t = window.setTimeout(() => {
    refreshCo2Preview();
  }, 320);
  return () => clearTimeout(t);
}, [participant_id, refreshCo2Preview]);


  async function initPage() {
    if (!participant_id) return;

    const data = await apiRequest(`/api/baseline/${participant_id}`, "GET");
    if (data?.data) {
      setBaselineFootprintGb(
        baselineFootprintGbFromData(data.data as Record<string, unknown>)
      );
    }

    await loadProgress();
  }


/* ---------- LOAD PROGRESS ---------- */

async function loadProgress(){

try{

const data = await apiRequest(`/api/progress/${participant_id}`,"GET");

setProgress(data);

}catch(err){

console.error(err);

}

}


function update(field:string,value:any){
setForm({
...form,
[field]:value
});

}


  async function submit() {
    if (!progress || activeWeek == null) return;

    if (submitting) return;

    setSubmitting(true);

    try {
      const res = await apiRequest("/api/weekly", "POST", {
        participant_id,
        week_number: activeWeek,
        ...form,
        storage_deleted_gb: Number(form.storage_deleted_gb) || 0,
        downloads_avoided_gb: Number(form.downloads_avoided_gb) || 0,
        streaming_reduction_minutes: Number(form.streaming_reduction_minutes) || 0,
        screen_time_change_minutes: Number(form.screen_time_change_minutes) || 0,
        emails_reduced: Number(form.emails_reduced) || 0,
        messages_reduced: Number(form.messages_reduced) || 0,
        ritual_completed: !!form.ritual_completed,
        alumni_touchpoints: Number(form.alumni_touchpoints) || 0,
        llm_queries_reduced: Number(form.llm_queries_reduced) || 0,
        reach_out_emails: String(form.reach_out_emails ?? "").trim()
      });

      if (res?.success) {
        const ro = Number((res as { reach_out_registered_count?: number }).reach_out_registered_count ?? 0);
        const roMsg =
          ro > 0
            ? ` Verified reach-outs on platform this week: ${ro} (counts toward leaderboard).`
            : "";
        alert(
          (editWeekOverride != null
            ? "Week updated — only this week's saved row changed."
            : "Weekly progress saved") + roMsg
        );
        setEditWeekOverride(null);
        await loadProgress();
        await refresh();
        await refreshCo2Preview();
      } else {
        console.error("Weekly submission failed", res);
        alert(res?.error || "Submission failed");
      }
    } catch (err) {
      console.error(err);
      alert("Submission failed");
    }

    setSubmitting(false);
  }


/* -------- Impact Calculations -------- */

const storage = Number(form.storage_deleted_gb || 0);
const weekStoragePct =
  baselineFootprintGb > 0
    ? Math.min(100, (storage / baselineFootprintGb) * 100)
    : null;
const streaming = Number(form.streaming_reduction_minutes || 0);

  const impactScore = Math.round(previewCo2 * 10);
  const hiddenBreakdownKeys = new Set([
    "emails_reduced",
    "messages_reduced",
    "tiktok_reduction",
    "instagram_reduction",
    "facebook_reduction",
    "youtube_reduction"
  ]);
  const visibleBreakdownLines =
    co2Breakdown?.lines?.filter((line) => !hiddenBreakdownKeys.has(line.key)) ?? [];

  const submittedWeekNums =
    progress?.weeks
      ?.filter((x: { status: string }) => x.status === "submitted")
      .map((x: { week: number }) => x.week) ?? [];

  const earliestPendingWeek = progress?.weeks?.find(
    (x: { status: string }) => x.status === "pending"
  )?.week;
  const skippedEarlierWeek =
    editWeekOverride == null &&
    activeWeek != null &&
    earliestPendingWeek != null &&
    earliestPendingWeek < activeWeek;

  if (programComplete) {
    return (
      <Layout>
        <div className="mx-auto max-w-lg rounded-2xl border border-slate-200/90 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Challenge complete</h1>
          <p className="mt-2 text-sm text-slate-600">
            You have submitted all program weeks. Open your dashboard for totals and rankings.
          </p>
          <button
            type="button"
            className="mt-5 w-full rounded-xl bg-[#064e3b] py-3 text-sm font-semibold text-white hover:bg-[#053d2f]"
            onClick={() => navigate("/dashboard")}
          >
            Go to dashboard
          </button>
        </div>
      </Layout>
    );
  }

  /* -------- UI -------- */

  return (
    <Layout>

<div className="mx-auto grid grid-cols-1 gap-4 xl:grid-cols-3 xl:items-start">

{/* FORM SECTION */}

<div className="rounded-2xl border border-slate-200/90 bg-white shadow-sm xl:col-span-2">

<div className="p-4 sm:p-5 md:p-6">

<h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
Weekly tracker
</h1>

<p className="mt-0.5 text-sm text-slate-600">
Reflect on how your digital habits changed this week.
</p>
<a
  href={WEEKLY_TRACKER_FAQ_DOC_URL}
  target="_blank"
  rel="noopener noreferrer"
  className="mt-1 inline-block text-sm font-semibold text-emerald-800 underline decoration-emerald-600/50 underline-offset-2 hover:text-emerald-900"
>
  How to find these numbers (FAQ)
</a>

<p className="mt-2 rounded-xl border border-amber-100 bg-amber-50/90 px-3 py-2 text-xs font-medium text-amber-950 sm:text-sm">
  You may update your information throughout the week. Only the latest entry will be stored.
</p>

{skippedEarlierWeek ? (
  <p className="mt-2 rounded-xl border border-sky-100 bg-sky-50/90 px-3 py-2 text-xs text-sky-950 sm:text-sm">
    You&apos;re on the <strong>current program week</strong> ({activeWeek}). An earlier week
    wasn&apos;t submitted before its window closed — you can still log this week&apos;s progress.
  </p>
) : null}

{progress && (
<div className="mb-5 mt-4 space-y-3">
<div className="mb-1.5 flex flex-wrap items-center justify-between gap-2 text-sm">
<span className="font-semibold text-slate-800">
{activeWeek != null ? (
<>
Editing <span className="tabular-nums">week {activeWeek}</span> of{" "}
<span className="tabular-nums">{progress.duration}</span>
{editWeekOverride != null ? (
<span className="ml-1 text-amber-800"> (updating saved week)</span>
) : null}
</>
) : (
<span className="text-slate-500">Loading week…</span>
)}
</span>
<span className="font-medium text-emerald-700 tabular-nums">
Completed: {progress.submitted}/{progress.duration} wk
</span>
</div>
<div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
<div
className="h-2 rounded-full bg-emerald-600 transition-all"
style={{ width: `${(progress.submitted / progress.duration) * 100}%` }}
/>
</div>
{submittedWeekNums.length > 0 ? (
<div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2 text-xs text-slate-600">
<p className="mb-1.5 font-medium text-slate-700">Update a past week (same week keeps one DB row)</p>
<div className="flex flex-wrap gap-1.5">
{submittedWeekNums.map((wn: number) => (
<button
key={wn}
type="button"
className={`rounded-lg px-2 py-1 font-medium tabular-nums ${
editWeekOverride === wn ? "bg-emerald-700 text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"
}`}
onClick={() => setEditWeekOverride(wn)}
>
W{wn}
</button>
))}
{editWeekOverride != null ? (
<button
type="button"
className="rounded-lg px-2 py-1 font-medium text-slate-600 underline decoration-dotted"
onClick={() => setEditWeekOverride(null)}
>
Back to current week
</button>
) : null}
</div>
</div>
) : null}
</div>
)}

{/* STORAGE */}

<h2 className="mb-2 mt-1 text-xs font-semibold uppercase tracking-wide text-emerald-900">
Storage & downloads
</h2>

<div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-4 mb-6">

<div>

<FieldLabelWithInfo hint="How much data did you delete this week across your devices? (files, photos, apps). Estimate is fine.">
Storage Removed (GB)
</FieldLabelWithInfo>

<input
className="input"
title="How much data did you delete this week across your devices? (files, photos, apps). Estimate is fine."
value={form.storage_deleted_gb || ""}
onChange={(e)=>update("storage_deleted_gb",e.target.value)}
/>

<p className="help">
How much data did you delete this week across your devices? (files, photos, apps). Estimate is fine.
</p>

</div>

<div>

<FieldLabelWithInfo hint="How much data did you choose NOT to download this week? (apps, videos, files). Ballpark estimate is fine.">
Estimated Downloads Avoided (GB)
</FieldLabelWithInfo>

<input
className="input"
title="How much data did you choose NOT to download this week? (apps, videos, files). Ballpark estimate is fine."
value={form.downloads_avoided_gb || ""}
onChange={(e)=>update("downloads_avoided_gb",e.target.value)}
/>

<p className="help">
How much data did you choose NOT to download this week? (apps, videos, files). Ballpark estimate is fine.
</p>

</div>

</div>

{/* STREAMING */}

<h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-900">
Streaming & screen time
</h2>

<div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">

<div>

<FieldLabelWithInfo hint="Enter how many minutes LESS of screen time you spent across your devices this week vs your usual. Example: if baseline screen time is 1000 mins and now use 800 mins → enter 200.">
Screen Time Reduction (minutes)
</FieldLabelWithInfo>

<input
className="input"
  title="Enter how many minutes LESS of screen time you spent across your devices this week vs your usual. Example: if baseline screen time is 1000 mins and now use 800 mins, enter 200."
value={form.screen_time_change_minutes || ""}
onChange={(e)=>update("screen_time_change_minutes",e.target.value)}
/>

<p className="help">
Enter how many minutes LESS of screen time you spent across your devices this week vs your usual. Example: if baseline screen time is 1000 mins and now use 800 mins, enter 200.
</p>

</div>

<div>

<FieldLabelWithInfo hint="Enter how many minutes LESS you spent on streaming this week vs your usual. Example: if you watched 600 mins as baseline and now 450 mins, enter 150.">
Streaming Time Reduction (minutes)
</FieldLabelWithInfo>

<input
className="input"
  title="Enter how many minutes LESS you spent on streaming this week vs your usual. Example: if you watched 600 mins as baseline and now 450 mins, enter 150."
value={form.streaming_reduction_minutes || ""}
onChange={(e)=>update("streaming_reduction_minutes",e.target.value)}
/>

<p className="help">
Enter how many minutes LESS you spent on streaming this week vs your usual. Example: if you watched 600 mins as baseline and now 450 mins, enter 150.
</p>

</div>

</div>

<h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-900">
Number of prompts / questions to ChatGPT (and other similar AI tools)
</h2>

<div className="mb-6 max-w-md">
<FieldLabelWithInfo hint="How many fewer times did you use AI tools (like ChatGPT) this week compared to your usual?">
Fewer prompts / questions this week (vs your usual)
</FieldLabelWithInfo>
<input
className="input"
inputMode="numeric"
title="How many fewer times did you use AI tools (like ChatGPT) this week compared to your usual?"
value={form.llm_queries_reduced || ""}
onChange={(e)=>update("llm_queries_reduced",e.target.value)}
/>
<p className="help">
How many fewer times did you use AI tools (like ChatGPT) this week compared to your usual?
</p>
</div>

{/* BEHAVIOUR */}

<h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-900">
Behaviour
</h2>

<label className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-sm">

<input
type="checkbox"
checked={form.ritual_completed || false}
onChange={(e)=>update("ritual_completed",e.target.checked)}
/>

<span className="flex min-w-0 flex-1 items-center gap-1.5 font-medium">
<span>Completed Digital Detox Ritual</span>
<span
className="inline-flex shrink-0 cursor-help rounded p-0.5 text-slate-400 transition hover:bg-white/80 hover:text-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/45"
title="Check this if you completed the program's Digital Detox Ritual activity for this week."
tabIndex={0}
aria-label="Check this if you completed the program's Digital Detox Ritual activity for this week."
>
<Info className="h-4 w-4" strokeWidth={2} aria-hidden />
</span>
</span>

</label>
<p className="-mt-2 mb-4 text-[11px] text-slate-500">
Check this if you completed the program&apos;s Digital Detox Ritual activity for this week.
</p>

<div className="mb-2">

<FieldLabelWithInfo hint="Number of meaningful interactions with other participants this week, or new members invited to this challenge.">
Community Engagement (Interactions)
</FieldLabelWithInfo>

<input
className="input"
title="Number of meaningful interactions with other participants this week, or new members invited to this challenge."
value={form.alumni_touchpoints || ""}
onChange={(e)=>update("alumni_touchpoints",e.target.value)}
/>

<p className="help">
Number of meaningful interactions with other participants this week, or new members invited to this challenge.
</p>

</div>

<div className="mb-2 mt-6 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-3 text-sm text-slate-700">
<p className="font-medium text-emerald-950">Invite participants</p>
<p className="mt-1 text-xs leading-relaxed text-slate-600">
  Add or change invite emails anytime on the{" "}
  <Link
    to="/invite-participants"
    className="font-semibold text-emerald-800 underline decoration-emerald-500/50 underline-offset-2 hover:text-emerald-950"
  >
    Invite Participants
  </Link>{" "}
  page. It saves to the same week as this tracker and uses the same leaderboard rules. Emails you
  save there are included when you submit this week.
</p>
</div>

</div>

<div className="border-t border-slate-100 bg-slate-50/40 px-4 py-3 sm:px-6 sm:py-4">
<button
type="button"
onClick={submit}
disabled={submitting || activeWeek == null}
className="w-full rounded-xl bg-[#064e3b] py-3 text-sm font-semibold text-white transition hover:bg-[#053d2f] disabled:bg-slate-300 sm:text-base"
>
{submitting ? "Submitting…" : "Save this week"}
</button>
</div>

</div>

{/* IMPACT PANEL */}

<div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5 xl:sticky xl:top-0">

<div className="flex flex-wrap items-center gap-2">
<h2 className="text-sm font-semibold text-emerald-900">
Your Impact This Week
</h2>
</div>

<p
className="mt-3 cursor-help text-xs font-medium uppercase tracking-wide text-slate-500"
title="Estimated emissions avoided through reduced digital activity this week."
>
Estimated CO₂ Avoided
</p>
<p className="text-2xl font-bold tabular-nums text-emerald-700">
{previewCo2.toFixed(2)} <span className="text-sm font-semibold">kg</span>
</p>
{previewError ? (
<p className="mt-1 text-[11px] text-amber-800">
CO₂ preview unavailable ({previewError}). Your saved week still uses the server calculation after submit.
</p>
) : (
<p className="mt-1 text-[11px] text-slate-500">
Uses CO₂ factors when set; otherwise program emission config (same as baseline).
</p>
)}

{co2Breakdown && visibleBreakdownLines.length > 0 ? (
<details className="mt-3 rounded-lg border border-slate-100 bg-slate-50/90 px-2 py-2 text-[11px] text-slate-700 sm:text-xs">
<summary className="cursor-pointer select-none font-semibold text-emerald-900">
How this week&apos;s CO₂ is calculated
</summary>
<p className="mt-2 leading-snug text-slate-600">
{co2Breakdown.mode === "factors"
? "Components use program co₂_factors (kg). The headline total matches what is saved as co₂_saved for this week."
: "Components use emission_config (g), shown below as kg (÷ 1000). Same path as when co₂_factors are empty."}
</p>
<table className="mt-2 w-full border-collapse text-left">
<thead>
<tr className="border-b border-slate-200 text-[10px] font-medium uppercase tracking-wide text-slate-500">
<th className="py-1 pr-2">Component</th>
<th className="py-1 text-right">kg CO₂e</th>
</tr>
</thead>
<tbody>
{visibleBreakdownLines.map((line) => (
<tr key={line.key} className="border-b border-slate-100 last:border-0">
<td className="max-w-[14rem] py-1 pr-2 align-top">
<div className="font-medium text-slate-800">{line.label}</div>
<div className="mt-0.5 text-[10px] leading-snug text-slate-500">{line.detail}</div>
</td>
<td className="py-1 text-right align-top tabular-nums font-medium text-slate-900">
{Number(line.kg).toFixed(4)}
</td>
</tr>
))}
</tbody>
<tfoot>
<tr className="border-t border-slate-200 font-semibold text-emerald-900">
<td className="pt-2">Total</td>
<td className="pt-2 text-right tabular-nums">{Number(co2Breakdown.total_kg).toFixed(4)}</td>
</tr>
</tfoot>
</table>
</details>
) : null}

<p
className="mt-4 cursor-help text-xs font-medium uppercase tracking-wide text-slate-500"
title="Reduction in data stored across devices and cloud."
>
Storage Reduction
</p>
<p className="text-xl font-semibold tabular-nums text-slate-900">{storage.toFixed(1)} GB</p>
{weekStoragePct !== null && (
<>
<p className="text-sm text-cyan-800 mt-1 tabular-nums font-medium">
  {weekStoragePct.toFixed(2)}% of your baseline footprint ({baselineFootprintGb.toFixed(1)} GB)
</p>
<p className="mt-1 max-w-[17rem] text-[11px] leading-snug text-slate-500">
Baseline GB is the total from your baseline form: storage per device × device counts, plus cloud storage you reported. Large numbers are normal if you summed several devices.
</p>
</>
)}
{baselineFootprintGb <= 0 && (
<p className="text-xs text-gray-500 mt-1">Complete baseline with device storage to see %.</p>
)}

<p
className="mt-4 cursor-help text-xs font-medium uppercase tracking-wide text-slate-500"
title="Time reduced from your usual weekly streaming."
>
Streaming Reduction
</p>
<p className="text-xl font-semibold tabular-nums text-slate-900">{streaming} min</p>

<p
className="mt-4 cursor-help text-xs font-medium uppercase tracking-wide text-slate-500"
title="Overall score based on your digital habit improvements."
>
Impact Score
</p>
<p className="text-xl font-bold tabular-nums text-cyan-700">{impactScore.toFixed(0)}</p>

{progress && (

<div className="mt-6 border-t border-slate-100 pt-4">

<p
className="mb-1.5 cursor-help text-xs font-medium text-slate-500"
title="Your progress through the challenge so far."
>
Program completion
</p>

<div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">

<div
className="h-2 rounded-full bg-emerald-600"
style={{
width:`${(progress.submitted / progress.duration) * 100}%`
}}
></div>

</div>

</div>

)}

</div>

</div>

</Layout>
  );
}

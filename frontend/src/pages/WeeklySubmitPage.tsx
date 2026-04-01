import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../lib/api";
import Layout from "../components/Layout";
import { useParticipantJourney } from "../contexts/ParticipantJourneyContext";

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
  const [editWeekOverride, setEditWeekOverride] = useState<number | null>(null);

  const participant_id = localStorage.getItem("participant_id");

  const firstPending = useMemo(() => {
    const w = progress?.weeks?.find((x: { status: string }) => x.status === "pending");
    return w?.week ?? null;
  }, [progress?.weeks]);

  const activeWeek = editWeekOverride ?? firstPending;

  const programComplete =
    progress &&
    progress.duration > 0 &&
    progress.submitted >= progress.duration &&
    firstPending === null;

const refreshCo2Preview = useCallback(async () => {
  if (!participant_id) return;
  const res = await apiRequest("/api/weekly/preview", "POST", {
    storage_deleted_gb: Number(form.storage_deleted_gb) || 0,
    downloads_avoided_gb: Number(form.downloads_avoided_gb) || 0,
    streaming_reduction_minutes: Number(form.streaming_reduction_minutes) || 0,
    screen_time_change_minutes: Number(form.screen_time_change_minutes) || 0,
    emails_reduced: Number(form.emails_reduced) || 0,
    messages_reduced: Number(form.messages_reduced) || 0,
    tiktok_reduction_minutes: Number(form.tiktok_reduction_minutes) || 0,
    instagram_reduction_minutes: Number(form.instagram_reduction_minutes) || 0,
    facebook_reduction_minutes: Number(form.facebook_reduction_minutes) || 0,
    youtube_reduction_minutes: Number(form.youtube_reduction_minutes) || 0
  });
  if (res?.co2_saved != null) {
    setPreviewCo2(Number(res.co2_saved));
  }
}, [participant_id, form]);

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
          tiktok_reduction_minutes: "",
          instagram_reduction_minutes: "",
          facebook_reduction_minutes: "",
          youtube_reduction_minutes: ""
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
        tiktok_reduction_minutes: Number(form.tiktok_reduction_minutes) || 0,
        instagram_reduction_minutes: Number(form.instagram_reduction_minutes) || 0,
        facebook_reduction_minutes: Number(form.facebook_reduction_minutes) || 0,
        youtube_reduction_minutes: Number(form.youtube_reduction_minutes) || 0,
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

  const submittedWeekNums =
    progress?.weeks
      ?.filter((x: { status: string }) => x.status === "submitted")
      .map((x: { week: number }) => x.week) ?? [];

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

<label className="label">
Storage Deleted from Devices (GB)
</label>

<input
className="input"
value={form.storage_deleted_gb || ""}
onChange={(e)=>update("storage_deleted_gb",e.target.value)}
/>

<p className="help">
Total storage removed from phones, laptops, or cloud.
</p>

</div>

<div>

<label className="label">
Downloads Avoided (GB)
</label>

<input
className="input"
value={form.downloads_avoided_gb || ""}
onChange={(e)=>update("downloads_avoided_gb",e.target.value)}
/>

<p className="help">
Estimate how much data you avoided downloading.
</p>

</div>

</div>

{/* STREAMING */}

<h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-900">
Streaming & screen time
</h2>

<div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-6">

<div>

<label className="label">
Streaming Time Reduced (minutes)
</label>

<input
className="input"
value={form.streaming_reduction_minutes || ""}
onChange={(e)=>update("streaming_reduction_minutes",e.target.value)}
/>

<p className="help">
Minutes less streaming compared to your usual week.
</p>

</div>

<div>

<label className="label">
Screen Time Change (minutes)
</label>

<input
className="input"
value={form.screen_time_change_minutes || ""}
onChange={(e)=>update("screen_time_change_minutes",e.target.value)}
/>

<p className="help">
Reduction in your overall daily screen time.
</p>

</div>

</div>

{/* SOCIAL */}

<h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-900">
Social media (minutes)
</h2>

<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 mb-6">

<input className="input" value={form.tiktok_reduction_minutes || ""} placeholder="TikTok Reduction" onChange={(e)=>update("tiktok_reduction_minutes",e.target.value)}/>
<input className="input" value={form.instagram_reduction_minutes || ""} placeholder="Instagram Reduction" onChange={(e)=>update("instagram_reduction_minutes",e.target.value)}/>
<input className="input" value={form.facebook_reduction_minutes || ""} placeholder="Facebook Reduction" onChange={(e)=>update("facebook_reduction_minutes",e.target.value)}/>
<input className="input" value={form.youtube_reduction_minutes || ""} placeholder="YouTube Reduction" onChange={(e)=>update("youtube_reduction_minutes",e.target.value)}/>

</div>

{/* BEHAVIOUR */}

<h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-900">
Behaviour
</h2>

<label className="mb-4 flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-sm">

<input
type="checkbox"
checked={form.ritual_completed || false}
onChange={(e)=>update("ritual_completed",e.target.checked)}
/>

Completed my Digital Detox Ritual this week

</label>

<div className="mb-2">

<label className="label">
Community / Alumni Engagement Touchpoints
</label>

<input
className="input"
value={form.alumni_touchpoints || ""}
onChange={(e)=>update("alumni_touchpoints",e.target.value)}
/>

<p className="help">
Number of meaningful interactions with other participants.
</p>

</div>

<h2 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-emerald-900">
Reach out
</h2>

<div className="mb-2">
<label className="label" htmlFor="reach-out-emails">
Invite emails (comma-separated)
</label>
<textarea
id="reach-out-emails"
className="input min-h-[88px] resize-y"
placeholder="friend1@school.edu, friend2@school.edu"
value={form.reach_out_emails || ""}
onChange={(e) => update("reach_out_emails", e.target.value)}
/>
<p className="help">
People you encouraged to join the challenge. Use commas between addresses. On the leaderboard, each
address that matches a registered participant (not your own account) adds a small bonus to your rank
score.
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

<h2 className="text-sm font-semibold text-emerald-900">
This week&apos;s impact
</h2>

<p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">Est. CO₂ saved</p>
<p className="text-2xl font-bold tabular-nums text-emerald-700">
{previewCo2.toFixed(2)} <span className="text-sm font-semibold">kg</span>
</p>
<p className="mt-1 text-[11px] text-slate-500">From admin-configured CO₂ factors (preview).</p>

<p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">Storage reduced</p>
<p className="text-xl font-semibold tabular-nums text-slate-900">{storage.toFixed(1)} GB</p>
{weekStoragePct !== null && (
<p className="text-sm text-cyan-800 mt-1 tabular-nums font-medium">
  {weekStoragePct.toFixed(2)}% of your baseline footprint ({baselineFootprintGb.toFixed(1)} GB)
</p>
)}
{baselineFootprintGb <= 0 && (
<p className="text-xs text-gray-500 mt-1">Complete baseline with device storage to see %.</p>
)}

<p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">Streaming reduced</p>
<p className="text-xl font-semibold tabular-nums text-slate-900">{streaming} min</p>

<p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">Impact score</p>
<p className="text-xl font-bold tabular-nums text-cyan-700">{impactScore.toFixed(0)}</p>

{progress && (

<div className="mt-6 border-t border-slate-100 pt-4">

<p className="mb-1.5 text-xs font-medium text-slate-500">
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

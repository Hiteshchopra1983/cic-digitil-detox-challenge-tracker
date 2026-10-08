import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import AdminLayout from "../components/AdminLayout";
import {
  utcCalendarYmd,
  utcMondayContainingToday,
  utcMondayNextWeek
} from "../lib/utcProgramMonday";

export default function AdminConfigPage(){

const [config,setConfig] = useState<any>({
program_duration_weeks:6,
weekly_submission_gap_days:7,
baseline_lock:true,
program_week_1_start_date:""
});
const [saving,setSaving] = useState(false);

useEffect(()=>{
load();
},[]);


async function load(){

try{

let data = await apiRequest("/api/program-config","GET");
if(!data){
  data = await apiRequest("/api/adminConfig","GET");
}

if(data){
setConfig(data);
}

}catch(err){

console.error(err);

}

}


async function save(override?: Record<string, unknown>) {
  setSaving(true);
  const payload = override ? { ...config, ...override } : config;

  try {
    let res = await apiRequest("/api/program-config", "POST", payload);
    if (!res) {
      res = await apiRequest("/api/adminConfig", "POST", payload);
    }

    if (
      !res ||
      (typeof res === "object" &&
        res !== null &&
        "error" in res &&
        (res as { error?: string }).error)
    ) {
      const err =
        res && typeof res === "object" && res !== null && "error" in res
          ? String((res as { error?: string }).error)
          : "";
      alert(err || "Update failed");
      return;
    }

    await load();
    alert("Configuration updated");
  } catch (err) {
    console.error(err);
    alert("Update failed");
  } finally {
    setSaving(false);
  }
}

async function kickOffProgram(week1Ymd: string, label: string) {
  const ok = window.confirm(
    `Officially kick off the program?\n\nWeek 1 will open on ${week1Ymd} (${label}). This will save program configuration.`
  );
  if (!ok) return;

  setSaving(true);
  const payload = { ...config, program_week_1_start_date: week1Ymd };

  try {
    let res = await apiRequest("/api/program-config", "POST", payload);
    if (!res) {
      res = await apiRequest("/api/adminConfig", "POST", payload);
    }

    if (!res || (typeof res === "object" && res !== null && "error" in res)) {
      const err =
        res && typeof res === "object" && res !== null && "error" in res
          ? String((res as { error?: string }).error)
          : "";
      alert(err || "Kick-off failed");
      return;
    }

    await load();
    alert(
      `Program kick-off saved. Week 1 is anchored to Monday ${week1Ymd} (UTC). Participants submit within each week’s Mon–Sun window.`
    );
  } catch (err) {
    console.error(err);
    alert("Kick-off failed");
  } finally {
    setSaving(false);
  }
}


return(

<AdminLayout>
<div className="max-w-7xl mx-auto">

<h1 className="text-2xl md:text-3xl font-bold mb-2">
Program Configuration
</h1>
<p className="text-gray-600 mb-6">
Configure challenge duration, weekly cadence, baseline locking, and optional Monday–Sunday
submission windows (UTC).
</p>

<div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm max-w-2xl border border-gray-100">


{/* PROGRAM DURATION */}

<div className="mb-6">

<label className="block mb-2 font-semibold">
Program Duration (weeks)
</label>

<input
type="number"
value={config.program_duration_weeks}
onChange={(e)=>setConfig({
...config,
program_duration_weeks:Number(e.target.value)
})}
className="input"
/>
<p className="help">
Total number of weeks participants can submit weekly updates for this program.
</p>

</div>


{/* WEEKLY GAP */}

<div className="mb-6">

<label className="block mb-2 font-semibold">
Weekly Submission Gap (days)
</label>

<input
type="number"
value={config.weekly_submission_gap_days}
onChange={(e)=>setConfig({
...config,
weekly_submission_gap_days:Number(e.target.value)
})}
className="input"
/>
<p className="help">
Minimum number of days between two weekly submissions for each participant.
</p>

</div>

<div className="mb-6">

<label className="block mb-2 font-semibold">
Week 1 opens (Monday, UTC)
</label>

<input
type="date"
value={
  config.program_week_1_start_date
    ? String(config.program_week_1_start_date).slice(0, 10)
    : ""
}
onChange={(e)=>setConfig({
...config,
program_week_1_start_date:e.target.value
})}
className="input"
/>
<p className="help">
Leave empty to allow submissions any time (no calendar window). When set, this must be a
<strong> Monday </strong>
on the UTC calendar. Week <em>N</em> accepts submissions from that week&apos;s Monday 00:00 UTC
through Sunday 23:59:59 UTC; week <em>N+1</em> opens the following Monday.
</p>

</div>

<div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 md:p-5">
  <h2 className="text-base font-bold text-slate-900">Kick off program</h2>
  <p className="mt-1 text-sm leading-relaxed text-slate-700">
    Officially start the challenge by anchoring <strong>Week 1</strong> to a Monday (UTC). This
    saves configuration immediately and enforces weekly submission windows for participants.
  </p>
  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
    <button
      type="button"
      disabled={saving}
      onClick={() =>
        kickOffProgram(utcCalendarYmd(utcMondayContainingToday()), "Monday of the current UTC week")
      }
      className="rounded-xl bg-[#064e3b] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#053d2f] disabled:bg-slate-400"
    >
      Kick off: this week&apos;s Monday (UTC)
    </button>
    <button
      type="button"
      disabled={saving}
      onClick={() => kickOffProgram(utcCalendarYmd(utcMondayNextWeek()), "the following Monday")}
      className="rounded-xl border border-emerald-800/25 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50 disabled:bg-slate-100"
    >
      Schedule: next Monday (UTC)
    </button>
  </div>
  <p className="mt-2 text-xs text-slate-600">
    Use <em>this week&apos;s Monday</em> if the program is already live for the current week. Use{" "}
    <em>next Monday</em> to open submissions starting the upcoming week. You can still edit the date
    above and click Save Configuration.
  </p>
</div>

{/* BASELINE LOCK */}

<div className="mb-6 flex items-center gap-3">

<input
type="checkbox"
checked={config.baseline_lock}
onChange={(e)=>setConfig({
...config,
baseline_lock:e.target.checked
})}
/>

<label className="font-semibold">
Lock Baseline After Submission
</label>
<p className="help">
When enabled, baseline data becomes read-only after first successful submission.
</p>

</div>


{/* SAVE BUTTON */}

<button
  type="button"
  onClick={() => save()}
  disabled={saving}
  className="rounded-xl bg-[#064e3b] px-6 py-2.5 text-white transition hover:bg-[#053d2f] disabled:bg-gray-400"
>
  {saving ? "Saving..." : "Save Configuration"}
</button>

</div>

</div>
</AdminLayout>

);

}
import { useState, useEffect } from "react";
import { apiRequest } from "../lib/api";
import Layout from "../components/Layout";
import { useParticipantJourney } from "../contexts/ParticipantJourneyContext";

export default function BaselinePage() {
  const { refresh } = useParticipantJourney();

const [form,setForm] = useState<any>({});
const [baselineCompleted,setBaselineCompleted] = useState(false);

const participant_id = localStorage.getItem("participant_id");

useEffect(()=>{
loadBaseline();
},[]);

/* ---------- LOAD BASELINE ---------- */

async function loadBaseline(){

try{

const data = await apiRequest(`/api/baseline/${participant_id}`, "GET");
setBaselineCompleted(!!data?.baseline_completed);

if(data?.data){

setForm({
...data.data,
streaming_hours_week:
data.data.streaming_hours_week || data.data.streaming_hours
});

}

}catch(err){
console.log("Baseline not submitted yet");
setBaselineCompleted(false);
}

}

/* ---------- FORM ---------- */

function update(field:string,value:any){
if(baselineCompleted) return;
setForm({
...form,
[field]:value
});
}

/* ---------- SUBMIT ---------- */

async function submit(){
if(baselineCompleted){
alert("Baseline already submitted");
return;
}

try{

await apiRequest("/api/baseline","POST",{
participant_id,
...form
});

alert("Baseline submitted");
setBaselineCompleted(true);
await refresh();

}catch(err){
console.error(err);
alert("Submission failed");
}

}

/* ---------- UI ---------- */

return(
<Layout>

<div className="mx-auto max-w-5xl rounded-2xl border border-slate-200/90 bg-white shadow-sm">

<div className="p-4 sm:p-5 md:p-6">

<h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
Baseline assessment
</h1>

<p className="mt-1 text-sm text-slate-600">
Estimate your current digital footprint to personalize impact metrics.
</p>

{baselineCompleted ? (
<p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-sm text-emerald-900">
Baseline is submitted and locked. Continue with the weekly tracker.
</p>
) : null}

{/* DEVICES */}

<h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-emerald-900">
Devices & storage
</h2>

<div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-5 md:gap-y-4">

<div>
<label className="label">Phones Owned</label>
<input
className="input"
value={form.phone_devices || ""}
onChange={(e)=>update("phone_devices",e.target.value)}
/>
<p className="help">Number of smartphones you use.</p>
</div>

<div>
<label className="label">Phone Storage Used (GB)</label>
<input
className="input"
value={form.phone_storage_gb || ""}
onChange={(e)=>update("phone_storage_gb",e.target.value)}
/>
<p className="help">Storage currently used on your phone.</p>
</div>

<div>
<label className="label">Laptops Owned</label>
<input
className="input"
value={form.laptop_devices || ""}
onChange={(e)=>update("laptop_devices",e.target.value)}
/>
<p className="help">Number of laptops/desktops used.</p>
</div>

<div>
<label className="label">Laptop Storage Used (GB)</label>
<input
className="input"
value={form.laptop_storage_gb || ""}
onChange={(e)=>update("laptop_storage_gb",e.target.value)}
/>
<p className="help">Approximate storage used.</p>
</div>

<div>
<label className="label">Tablets Owned</label>
<input
className="input"
value={form.tablet_devices || ""}
onChange={(e)=>update("tablet_devices",e.target.value)}
/>
</div>

<div>
<label className="label">Tablet Storage Used (GB)</label>
<input
className="input"
value={form.tablet_storage_gb || ""}
onChange={(e)=>update("tablet_storage_gb",e.target.value)}
/>
</div>

<div>
<label className="label">Cloud Accounts</label>
<input
className="input"
value={form.cloud_accounts || ""}
onChange={(e)=>update("cloud_accounts",e.target.value)}
/>
<p className="help">Google Drive, Dropbox etc.</p>
</div>

<div>
<label className="label">Cloud Storage Used (GB)</label>
<input
className="input"
value={form.cloud_storage_gb || ""}
onChange={(e)=>update("cloud_storage_gb",e.target.value)}
/>
</div>

</div>


{/* SCREEN */}

<h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-emerald-900">
Screen time
</h2>

<div className="grid grid-cols-1 gap-4 md:grid-cols-2">

<div>
<label className="label">Daily Screen Time (hrs)</label>
<input
className="input"
value={form.screen_time_hours || ""}
onChange={(e)=>update("screen_time_hours",e.target.value)}
/>
</div>

<div>
<label className="label">Streaming Hours / Week</label>
<input
className="input"
value={form.streaming_hours_week || ""}
onChange={(e)=>update("streaming_hours_week",e.target.value)}
/>
</div>

</div>


{/* SOCIAL */}

<h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-emerald-900">
Social media (mins/day)
</h2>

<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

<input
className="input"
placeholder="TikTok (mins/day)"
value={form.tiktok_minutes || ""}
onChange={(e)=>update("tiktok_minutes",e.target.value)}
/>

<input
className="input"
placeholder="Instagram (mins/day)"
value={form.instagram_minutes || ""}
onChange={(e)=>update("instagram_minutes",e.target.value)}
/>

<input
className="input"
placeholder="Facebook (mins/day)"
value={form.facebook_minutes || ""}
onChange={(e)=>update("facebook_minutes",e.target.value)}
/>

<input
className="input"
placeholder="YouTube (mins/day)"
value={form.youtube_minutes || ""}
onChange={(e)=>update("youtube_minutes",e.target.value)}
/>

</div>


{/* DOWNLOADS */}

<h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-emerald-900">
Downloads
</h2>

<div>

<label className="label">Downloads per week (GB)</label>

<input
className="input"
value={form.downloads_gb_week || ""}
onChange={(e)=>update("downloads_gb_week",e.target.value)}
/>

<p className="help">
Apps, media, files downloaded weekly.
</p>

</div>


{/* SUBMIT */}

<button
type="button"
onClick={submit}
disabled={baselineCompleted}
className="mt-8 w-full rounded-xl bg-[#064e3b] py-3 text-sm font-semibold text-white transition hover:bg-[#053d2f] disabled:cursor-not-allowed disabled:bg-slate-300 sm:text-base"
>
{baselineCompleted ? "Baseline submitted" : "Submit baseline assessment"}
</button>

</div>

</div>

</Layout>

);
}
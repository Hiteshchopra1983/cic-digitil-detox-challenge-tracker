import { useEffect,useState } from "react";
import { apiRequest } from "../lib/api";
import AdminLayout from "../components/AdminLayout";

export default function AdminConfigPage(){

const [config,setConfig] = useState<any>({
program_duration_weeks:4,
weekly_submission_gap_days:7,
baseline_lock:true
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


async function save(){
setSaving(true);

try{

let res = await apiRequest("/api/program-config","POST",config);
if(!res){
  res = await apiRequest("/api/adminConfig","POST",config);
}

if(!res){
  alert("Update failed");
  return;
}

alert("Configuration updated");

}catch(err){

console.error(err);
alert("Update failed");

}finally{
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
Configure challenge duration, weekly cadence, and baseline locking behavior.
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
onClick={save}
disabled={saving}
className="bg-[#064e3b] hover:bg-[#053d2f] transition text-white px-6 py-2.5 rounded-xl disabled:bg-gray-400"
>
{saving ? "Saving..." : "Save Configuration"}
</button>

</div>

</div>
</AdminLayout>

);

}
import { useEffect, useMemo, useRef, useState } from "react";
import {
  adminBulkImportParticipants,
  apiRequest,
  sendNotification,
  type BulkImportSummary
} from "../lib/api";
import AdminLayout from "../components/AdminLayout";

const CSV_TEMPLATE = `name,email,country,city,cohort,password
Jane Doe,jane.doe@university.edu,US,New York,Cohort A,
John Smith,john.smith@university.edu,GB,London,Cohort A,MyP@ssw0rd!`;

function downloadCsvTemplate() {
  const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "participants_import_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminParticipantsPage(){

const [users,setUsers] = useState<any[]>([]);
const [loading,setLoading] = useState(false);
const [search,setSearch] = useState("");
const [editedRoles,setEditedRoles] = useState<Record<string,string>>({});
const [showNotify,setShowNotify] = useState(false);
const [type,setType] = useState("inactive");
const [channel,setChannel] = useState<"in_app" | "email" | "both">("both");
const [title,setTitle] = useState("Digital Detox Update");
const [message,setMessage] = useState("");
const [sending,setSending] = useState(false);
const [page,setPage] = useState(1);
const PAGE_SIZE = 20;

const importFileRef = useRef<HTMLInputElement>(null);
const [importing,setImporting] = useState(false);
const [importResult,setImportResult] = useState<BulkImportSummary | null>(null);
const [importError,setImportError] = useState<string | null>(null);


/* LOAD USERS */

useEffect(()=>{
load();
},[]);


async function load(){

try{

setLoading(true);

const data = await apiRequest("/api/admin/participants","GET");

setUsers(data || []);
setEditedRoles({});
setPage(1);

}catch(err){

console.error(err);

}

setLoading(false);

}


/* UPDATE ROLE */

async function updateRole(id:string,role:string){

try{

await apiRequest("/api/admin/role","POST",{
user_id:id,
role
});

load();

}catch(err){

console.error(err);
alert("Role update failed");

}

}

function onRoleSelect(id:string,role:string){
setEditedRoles((prev)=>({
...prev,
[id]:role
}));
}

const filteredUsers = useMemo(()=>{
const q = search.trim().toLowerCase();
if(!q) return users;
return users.filter((u:any)=>{
const text = `${u.name || ""} ${u.email || ""} ${u.country || ""} ${u.city || ""}`.toLowerCase();
return text.includes(q);
});
},[users,search]);

const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
const pageStart = (page - 1) * PAGE_SIZE;
const paginatedUsers = filteredUsers.slice(pageStart, pageStart + PAGE_SIZE);

useEffect(()=>{
setPage(1);
},[search]);

useEffect(()=>{
if(page > totalPages){
setPage(totalPages);
}
},[page,totalPages]);

async function runBulkImport(file: File){
setImportError(null);
setImportResult(null);
setImporting(true);
try{
const text = await file.text();
const result = await adminBulkImportParticipants(text);
setImportResult(result);
await load();
}catch(err:any){
console.error(err);
setImportError(err?.message || "Import failed");
}finally{
setImporting(false);
if(importFileRef.current) importFileRef.current.value = "";
}
}

function onImportFileChange(e: React.ChangeEvent<HTMLInputElement>){
const f = e.target.files?.[0];
if(f) void runBulkImport(f);
}

async function notifyParticipants(){
if(!message.trim()){
alert("Please enter a notification message");
return;
}

setSending(true);
try{
const res = await sendNotification(type,message.trim(),title.trim(),channel);
if(!res?.success){
alert("Notification failed");
return;
}
alert(
`Delivered to ${res.sent ?? 0} participants\nIn-app: ${res.notificationCount ?? 0}\nEmail: ${res.emailCount ?? 0}`
);
setShowNotify(false);
setMessage("");
setTitle("Digital Detox Update");
setChannel("both");
}catch(err){
console.error(err);
alert("Notification failed");
}finally{
setSending(false);
}
}


/* DELETE USER */

async function remove(id:string){

const confirmDelete = confirm("Are you sure you want to delete this user?");

if(!confirmDelete) return;

try{

await apiRequest(`/api/admin/delete/${id}`,"DELETE");

load();

}catch(err){

console.error(err);
alert("Delete failed");

}

}


/* UI */

return(

<AdminLayout>
<div className="max-w-7xl mx-auto">

<h1 className="text-3xl font-bold mb-8">
Participant Management
</h1>

<div className="bg-white rounded-xl shadow border border-emerald-100 p-5 mb-6">
<h2 className="text-lg font-semibold text-emerald-900 mb-2">
Bulk import participants
</h2>
<p className="text-sm text-gray-600 mb-4">
Upload a CSV with columns <code className="text-xs bg-gray-100 px-1 rounded">name</code>,{" "}
<code className="text-xs bg-gray-100 px-1 rounded">email</code>,{" "}
<code className="text-xs bg-gray-100 px-1 rounded">country</code> (required, use ISO country
code e.g. US, GB), and optional{" "}
<code className="text-xs bg-gray-100 px-1 rounded">city</code>,{" "}
<code className="text-xs bg-gray-100 px-1 rounded">cohort</code>,{" "}
<code className="text-xs bg-gray-100 px-1 rounded">password</code>. Leave{" "}
<code className="text-xs bg-gray-100 px-1 rounded">password</code> empty to auto-generate a
secure password. Each new user is emailed their sign-in email and password (configure SMTP on
the server). Accounts are created with consent recorded for the program.
</p>
<div className="flex flex-wrap items-center gap-3">
<button
type="button"
onClick={downloadCsvTemplate}
className="px-4 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 text-sm font-medium hover:bg-emerald-100 transition"
>
Download CSV template
</button>
<input
ref={importFileRef}
type="file"
accept=".csv,text/csv"
className="hidden"
onChange={onImportFileChange}
/>
<button
type="button"
disabled={importing}
onClick={()=>importFileRef.current?.click()}
className="px-4 py-2 rounded-xl bg-[#064e3b] text-white text-sm font-medium hover:bg-[#053d2f] transition disabled:opacity-50"
>
{importing ? "Importing…" : "Choose CSV file"}
</button>
</div>
{importError ? (
<p className="mt-3 text-sm text-red-600" role="alert">
{importError}
</p>
) : null}
{importResult ? (
<div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
<p className="font-semibold text-gray-800 mb-2">Import finished</p>
<ul className="list-disc list-inside text-gray-700 space-y-1">
<li>Created: {importResult.summary.created}</li>
<li>Failed: {importResult.summary.failed}</li>
<li>Welcome emails sent: {importResult.summary.emailsSent} / {importResult.summary.emailsAttempted}</li>
</ul>
{importResult.failed.length > 0 ? (
<div className="mt-3 max-h-40 overflow-y-auto">
<p className="font-medium text-red-800 text-xs mb-1">Row issues</p>
<ul className="text-xs text-red-700 space-y-0.5">
{importResult.failed.map((f,i)=>(
<li key={i}>
Line {f.line}: {f.email} — {f.reason}
</li>
))}
</ul>
</div>
) : null}
{importResult.summary.emailsSent < importResult.summary.emailsAttempted ? (
<p className="mt-2 text-xs text-amber-800">
Some accounts were created but welcome email may not have been sent (check server SMTP
settings and logs).
</p>
) : null}
</div>
) : null}
</div>

<div className="bg-white rounded-xl shadow border border-gray-100 p-4 mb-6 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
<input
value={search}
onChange={(e)=>setSearch(e.target.value)}
placeholder="Search by name, email, country, city"
className="input md:max-w-md"
/>
<button
onClick={()=>setShowNotify(true)}
className="bg-[#064e3b] hover:bg-[#053d2f] transition text-white px-4 py-2.5 rounded-xl"
>
Send Update
</button>
</div>

<div className="bg-white rounded-xl shadow border border-gray-100 overflow-x-auto">


{/* HEADER */}

<div className="grid grid-cols-5 p-4 border-b font-semibold text-gray-600">

<div>Name</div>
<div>Email</div>
<div>Location</div>
<div>Status</div>
<div>Actions</div>

</div>


{/* LOADING */}

{loading && (

<p className="p-6 text-gray-500">
Loading participants...
</p>

)}


{/* USERS */}

{!loading && users.length === 0 && (

<p className="p-6 text-gray-500">
No participants found
</p>

)}


{paginatedUsers.map((u:any)=>{

return(

<div
key={u.id}
className="grid grid-cols-5 p-4 border-b items-center"
>

{/* NAME */}

<div>
<div className="font-semibold">{u.name}</div>
</div>


{/* EMAIL */}

<div className="text-sm text-gray-600">
{u.email}
</div>


{/* LOCATION */}

<div className="text-sm text-gray-500">
{u.country} • {u.city}
</div>


{/* STATUS */}

<div>

<span className={
u.status === "active"
? "text-green-600 font-semibold"
: "text-red-500 font-semibold"
}>
{u.status}
</span>

</div>


{/* ACTIONS */}

<div className="flex items-center gap-3">


{/* ROLE DROPDOWN */}

<select
value={editedRoles[u.id] ?? u.role}
onChange={(e)=>onRoleSelect(u.id,e.target.value)}
className="border px-2 py-1 rounded text-sm"
>

<option value="participant">Participant</option>
<option value="admin">Admin</option>
<option value="disabled">Disabled</option>

</select>

<button
onClick={()=>updateRole(u.id,editedRoles[u.id] ?? u.role)}
disabled={(editedRoles[u.id] ?? u.role) === u.role}
className="bg-slate-700 text-white px-3 py-1 rounded text-sm hover:bg-slate-800 disabled:bg-gray-300 disabled:cursor-not-allowed"
>
Save
</button>


{/* DELETE BUTTON */}

<button
onClick={()=>remove(u.id)}
className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
>
Delete
</button>

</div>

</div>

);

})}

</div>

<div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t bg-gray-50/60">
  <p className="text-sm text-gray-600">
    Showing {filteredUsers.length === 0 ? 0 : pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length}
  </p>
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={()=>setPage((p)=>Math.max(1,p-1))}
      disabled={page===1}
      className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Previous
    </button>
    <span className="text-sm text-gray-600">
      Page {page} / {totalPages}
    </span>
    <button
      type="button"
      onClick={()=>setPage((p)=>Math.min(totalPages,p+1))}
      disabled={page===totalPages}
      className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Next
    </button>
  </div>
</div>


{/* BACK BUTTON */}

</div>

{showNotify && (
<div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
<div className="bg-white p-6 md:p-8 rounded-2xl w-full max-w-xl shadow-xl border border-gray-100">
<h2 className="text-xl font-semibold text-emerald-900 mb-1">
Send Participant Update
</h2>
<p className="text-sm text-gray-500 mb-5">
Choose audience, delivery channel, and content.
</p>

<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
<div>
<label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
<select
value={type}
onChange={(e)=>setType(e.target.value)}
className="input"
>
<option value="inactive">Inactive Users</option>
<option value="all">All Participants</option>
</select>
</div>
<div>
<label className="block text-sm font-medium text-gray-700 mb-1">Delivery Channel</label>
<select
value={channel}
onChange={(e)=>setChannel(e.target.value as "in_app" | "email" | "both")}
className="input"
>
<option value="both">In-app + Email</option>
<option value="in_app">In-app only</option>
<option value="email">Email only</option>
</select>
</div>
</div>

<label className="block text-sm font-medium text-gray-700 mb-1">Title / Subject</label>
<input
value={title}
onChange={(e)=>setTitle(e.target.value)}
placeholder="Notification title"
className="input mb-4"
/>

<label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
<textarea
value={message}
onChange={(e)=>setMessage(e.target.value)}
placeholder="Write your message to participants..."
className="input mb-4"
rows={5}
/>

<div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 mb-4">
  <p className="text-xs font-semibold text-emerald-800 mb-1">Delivery Preview</p>
  <p className="text-xs text-emerald-700">
    {channel === "both" && "Participants receive this in their notification bell and by email."}
    {channel === "in_app" && "Participants receive this in their notification bell only."}
    {channel === "email" && "Participants receive this by email only."}
  </p>
</div>

<button
onClick={notifyParticipants}
disabled={sending}
className="bg-[#064e3b] hover:bg-[#053d2f] transition text-white px-4 py-2 rounded-xl disabled:bg-gray-400"
>
{sending ? "Sending..." : "Send Update"}
</button>

<button
onClick={()=>setShowNotify(false)}
className="ml-3 px-4 py-2 rounded-xl hover:bg-gray-100 transition"
>
Cancel
</button>
</div>
</div>
)}

</AdminLayout>

);

}
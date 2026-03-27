/** Public JSON calls (no auth). Returns parsed body and HTTP status. */
export async function publicApi<T = Record<string, unknown>>(
  url: string,
  method: string = "GET",
  body?: object
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  const options: RequestInit = {
    method,
    headers: { "Content-Type": "application/json" }
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`http://localhost:3000${url}`, options);
  let data: T & { error?: string } = {} as T & { error?: string };
  try {
    data = (await res.json()) as T & { error?: string };
  } catch {
    /* empty */
  }
  if (!res.ok) {
    return {
      ok: false,
      error: data?.error || `Request failed (${res.status})`,
      status: res.status
    };
  }
  return { ok: true, data };
}

export async function apiRequest(url: string, method: string = "GET", body?: any) {

  const token = localStorage.getItem("token");

  const options: any = {
    method,
    headers: {
      "Content-Type": "application/json"
    }
  };

  if (token) {
    options.headers["Authorization"] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {

    const res = await fetch(`http://localhost:3000${url}`, options);

    if (!res.ok) {
      console.error("API failed:", url);
      return null;
    }

    return await res.json();

  } catch (err) {

    console.error("Network error:", err);
    return null;

  }

}
export async function exportData(){

const token = localStorage.getItem("token");

const res = await fetch("http://localhost:3000/api/admin/export",{

headers:{
Authorization:`Bearer ${token}`
}

});

const blob = await res.blob();

const url = window.URL.createObjectURL(blob);

const a = document.createElement("a");

a.href = url;

a.download = "detox_data.csv";

a.click();

}

export function getAdminImpact(){
  return apiRequest("/api/admin/impact");
}

//////////////////////////////////
// PARTICIPANT APIs
//////////////////////////////////

export function getParticipantStats(id?: string) {
  const pid = id || localStorage.getItem("participant_id") || "";
  return apiRequest(`/api/impact/${pid}`);
}

export function getProgress(id: string) {
  return apiRequest(`/api/progress/${id}`);
}

export function getLeaderboard() {
  return apiRequest(`/api/leaderboard`);
}


//////////////////////////////////
// ADMIN APIs
//////////////////////////////////

export function getAdminParticipants(){
  return apiRequest("/api/admin/participants");
}

export function getAdminStats() {
  return apiRequest("/api/adminStats");
}

export function sendNotification(
  type:string,
  message:string,
  title?:string,
  channel:"in_app"|"email"|"both" = "both"
){
  return apiRequest("/api/admin/notify","POST",{ type, message, title, channel });
}

export function getInactiveParticipants() {
  return apiRequest("/api/admin/inactive");
}
export function updateUserRole(user_id:string,role:string){
  return apiRequest("/api/admin/role","POST",{ user_id, role });
}

export function resetProgram(resetBaseline:boolean){

return apiRequest("/api/admin/reset","POST",{
resetBaseline
});

}

export function getNotifications() {
  return apiRequest("/api/notifications");
}

export function markNotificationRead(id: number) {
  return apiRequest(`/api/notifications/${id}/read`, "PATCH");
}

export function markAllNotificationsRead() {
  return apiRequest("/api/notifications/read-all", "POST");
}

export function searchChatUsers(query: string) {
  const q = encodeURIComponent(query || "");
  return apiRequest(`/api/chat/users?q=${q}`);
}

export function getDirectMessages(otherId: string) {
  return apiRequest(`/api/chat/direct/${otherId}`);
}
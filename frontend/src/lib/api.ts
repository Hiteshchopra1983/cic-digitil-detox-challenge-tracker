<<<<<<< HEAD
// 🔥 CENTRAL CONFIG (VERY IMPORTANT)
const API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://localhost:3000"
    : "http://35.180.234.146:3000";
=======
function normalizeApiBase(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Production API — Elastic Beanstalk (eu-west-3). Health: …/health */
const ELASTIC_BEANSTALK_API_ORIGIN =
  "http://digital-detox-env.eba-v6uca3gd.eu-west-3.elasticbeanstalk.com";

function resolveApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:3000";
    }
  }
  return normalizeApiBase(ELASTIC_BEANSTALK_API_ORIGIN);
}

const API_BASE_URL = resolveApiBaseUrl();
>>>>>>> 0fc75de (Initial commit: digital detox tracker frontend and backend)

/** Public JSON calls (no auth). */
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

  const res = await fetch(`${API_BASE_URL}${url}`, options);

  let data: T & { error?: string } = {} as T & { error?: string };

  try {
    data = (await res.json()) as T & { error?: string };
  } catch {}

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
    const res = await fetch(`${API_BASE_URL}${url}`, options);

    let data: any = null;
    try {
      data = await res.json();
    } catch {
      data = {};
    }

    if (!res.ok) {
      console.error("API failed:", url, res.status, data?.error || "");
      return {
        error: data?.error || `Request failed (${res.status})`
      };
    }

    return data;
  } catch (err) {
    console.error("Network error:", err);
    return { error: "Network error — check API URL and connectivity" };
  }
}

export async function exportData() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE_URL}/api/admin/export`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const blob = await res.blob();

  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "detox_data.csv";
  a.click();
}

// PARTICIPANT APIs
export function getAdminImpact() {
  return apiRequest("/api/admin/impact");
}

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

// ADMIN APIs
export function getAdminParticipants() {
  return apiRequest("/api/admin/participants");
}

export type BulkImportSummary = {
  ok: boolean;
  summary: {
    totalRows: number;
    created: number;
    failed: number;
    emailsSent: number;
    emailsAttempted: number;
  };
  created: Array<{
    line: number;
    email: string;
    id: string;
    emailDelivered: boolean;
  }>;
  failed: Array<{ line: number; email: string; reason: string }>;
};

export async function adminBulkImportParticipants(
  csv: string
): Promise<BulkImportSummary> {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_BASE_URL}/api/admin/participants/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ csv })
  });

  const data = (await res.json().catch(() => ({}))) as BulkImportSummary & {
    error?: string;
  };

  if (!res.ok) {
    throw new Error(data.error || `Import failed (${res.status})`);
  }

  return data as BulkImportSummary;
}

export function getAdminStats() {
  return apiRequest("/api/adminStats");
}

export function sendNotification(
  type: string,
  message: string,
  title?: string,
  channel: "in_app" | "email" | "both" = "both"
) {
  return apiRequest("/api/admin/notify", "POST", { type, message, title, channel });
}

export function getInactiveParticipants() {
  return apiRequest("/api/admin/inactive");
}

export function updateUserRole(user_id: string, role: string) {
  return apiRequest("/api/admin/role", "POST", { user_id, role });
}

export function resetProgram(resetBaseline: boolean) {
  return apiRequest("/api/admin/reset", "POST", { resetBaseline });
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
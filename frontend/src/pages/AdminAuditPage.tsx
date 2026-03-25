import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import AdminLayout from "../components/AdminLayout";

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const data = await apiRequest("/api/admin/audit");
    const list = Array.isArray(data) ? data : [];
    list.sort(
      (a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setLogs(list);
  }

  function dateLabel(ts: string) {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Audit Logs</h1>

        <div className="bg-white rounded-xl shadow border border-gray-100">
          {logs.length === 0 && (
            <p className="p-6 text-gray-500">No logs found</p>
          )}

          {logs.map((l: any, idx: number) => {
            const showDateHeader =
              idx === 0 || dateLabel(logs[idx - 1].created_at) !== dateLabel(l.created_at);
            return (
              <div key={l.id} className="border-b last:border-b-0">
                {showDateHeader && (
                  <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-600 border-y">
                    {dateLabel(l.created_at)}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex justify-between gap-3">
                    <div className="font-semibold">{l.action}</div>
                    <div className="text-sm text-gray-500 shrink-0">
                      {new Date(l.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 mt-1">
                    Admin: {l.admin_name || "Unknown"}
                  </div>

                  {l.details && (
                    <div className="text-xs text-gray-500 mt-1 break-all">
                      {JSON.stringify(l.details)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
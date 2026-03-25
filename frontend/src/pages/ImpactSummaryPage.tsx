import { useEffect, useState } from "react";
import { apiRequest } from "../lib/api";
import Layout from "../components/Layout";

export default function ImpactSummaryPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    loadSummary();
  }, []);

  async function loadSummary() {
    try {
      const id = localStorage.getItem("participant_id");
      const res = await apiRequest(`/api/impact-summary/${id}`, "GET");
      setData(res);
    } catch (err) {
      console.error(err);
    }
  }

  if (!data) {
    return (
      <Layout>
        <p className="text-sm text-slate-600">Loading summary…</p>
      </Layout>
    );
  }

  const pct =
    data.duration > 0 ? Math.round((data.submitted / data.duration) * 100) : 0;

  return (
    <Layout>
      <div className="mx-auto max-w-6xl">
        <header className="mb-4">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Impact summary
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Challenge outcomes and equivalent real-world impact.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500">Total CO₂ saved</h2>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">
              {Number(data.co2_saved).toFixed(2)} kg
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500">Driving avoided</h2>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{data.impact.car_km} km</p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500">Trees equivalent</h2>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{data.impact.trees}</p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm">
            <h2 className="text-xs font-medium uppercase tracking-wide text-slate-500">Phone charges</h2>
            <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{data.impact.phone_charges}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-sm font-semibold text-emerald-900">Program completion</h2>
          <p className="mt-1 text-sm text-slate-600">
            {data.submitted} / {data.duration} weeks completed
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-emerald-600 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

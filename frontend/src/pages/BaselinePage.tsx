import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../lib/api";
import Layout from "../components/Layout";
import { useParticipantJourney } from "../contexts/ParticipantJourneyContext";

const HELP_DOC_URL =
  (import.meta.env.VITE_HELP_DOC_URL as string | undefined)?.trim() || "";

export default function BaselinePage() {
  const { refresh } = useParticipantJourney();

  const [form, setForm] = useState<Record<string, unknown>>({});
  const [baselineCompleted, setBaselineCompleted] = useState(false);

  const participant_id = localStorage.getItem("participant_id");

  const inputClass = baselineCompleted
    ? "input cursor-not-allowed bg-slate-50 text-slate-800"
    : "input";

  const loadBaseline = useCallback(async () => {
    if (!participant_id) return;
    try {
      const data = await apiRequest(`/api/baseline/${participant_id}`, "GET");
      if (data?.error) {
        console.error("Baseline GET failed", data.error);
        return;
      }
      setBaselineCompleted(!!data?.baseline_completed);
      if (data?.data) {
        const row = data.data as Record<string, unknown>;
        setForm({
          ...row,
          streaming_hours_week:
            row.streaming_hours_week ?? row.streaming_hours ?? ""
        });
      }
    } catch (err) {
      console.error(err);
    }
  }, [participant_id]);

  useEffect(() => {
    loadBaseline();
  }, [loadBaseline]);

  function update(field: string, value: unknown) {
    if (baselineCompleted) return;
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
  }

  async function submit() {
    if (baselineCompleted) {
      alert("Baseline already submitted");
      return;
    }
    if (!participant_id) {
      alert("Not logged in");
      return;
    }

    try {
      const res = await apiRequest("/api/baseline", "POST", {
        participant_id,
        ...form
      });

      if (res?.error) {
        alert(String(res.error));
        return;
      }
      if (!res?.success) {
        const detail =
          res && typeof res === "object" && "error" in res
            ? String((res as { error?: string }).error || "")
            : "";
        alert(detail || "Baseline submission failed — no details from server.");
        return;
      }

      alert("Baseline submitted");
      setBaselineCompleted(true);
      await refresh();
      await loadBaseline();
    } catch (err) {
      console.error(err);
      alert("Submission failed");
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl rounded-2xl border border-slate-200/90 bg-white shadow-sm">
        <div className="p-4 sm:p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Baseline assessment
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Estimate your current digital footprint to personalize impact metrics.
              </p>
            </div>
            {HELP_DOC_URL ? (
              <a
                href={HELP_DOC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-sm font-semibold text-emerald-800 underline decoration-emerald-600/50 underline-offset-2 hover:text-emerald-900"
              >
                Help documentation
              </a>
            ) : null}
          </div>

          {baselineCompleted ? (
            <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-2 text-sm text-emerald-900">
              Your baseline is saved and shown below (read-only). Use the menu for Dashboard, Weekly
              Tracker, and Leaderboard.
            </p>
          ) : null}

          <h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-emerald-900">
            Devices & storage
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-5 md:gap-y-4">
            <div>
              <label
                className="label cursor-help"
                title="Number of smartphones you actively use (exclude old or unused devices)."
              >
                Phones Owned
              </label>
              <input
                className={inputClass}
                readOnly={baselineCompleted}
                title="Number of smartphones you actively use (exclude old or unused devices)."
                value={String(form.phone_devices ?? "")}
                onChange={(e) => update("phone_devices", e.target.value)}
              />
              <p className="help">
                Number of smartphones you actively use (exclude old or unused devices).
              </p>
            </div>

            <div>
              <label
                className="label cursor-help"
                title="Approximate storage currently used on your primary phone (check in device settings)."
              >
                Storage Used on Phone (GB)
              </label>
              <input
                className={inputClass}
                readOnly={baselineCompleted}
                title="Approximate storage currently used on your primary phone (check in device settings)."
                value={String(form.phone_storage_gb ?? "")}
                onChange={(e) => update("phone_storage_gb", e.target.value)}
              />
              <p className="help">
                Approximate storage currently used on your primary phone (check in device settings).
              </p>
            </div>

            <div>
              <label
                className="label cursor-help"
                title="Number of laptops or desktops you regularly use."
              >
                Computers Owned (Laptops/Desktops)
              </label>
              <input
                className={inputClass}
                readOnly={baselineCompleted}
                title="Number of laptops or desktops you regularly use."
                value={String(form.laptop_devices ?? "")}
                onChange={(e) => update("laptop_devices", e.target.value)}
              />
              <p className="help">Number of laptops or desktops you regularly use.</p>
            </div>

            <div>
              <label
                className="label cursor-help"
                title="Approximate storage used on your main computer."
              >
                Storage Used on Computer (GB)
              </label>
              <input
                className={inputClass}
                readOnly={baselineCompleted}
                title="Approximate storage used on your main computer."
                value={String(form.laptop_storage_gb ?? "")}
                onChange={(e) => update("laptop_storage_gb", e.target.value)}
              />
              <p className="help">Approximate storage used on your main computer.</p>
            </div>

            <div>
              <label className="label cursor-help" title="Number of tablets you actively use.">
                Tablets Owned
              </label>
              <input
                className={inputClass}
                readOnly={baselineCompleted}
                title="Number of tablets you actively use."
                value={String(form.tablet_devices ?? "")}
                onChange={(e) => update("tablet_devices", e.target.value)}
              />
              <p className="help">Number of tablets you actively use.</p>
            </div>

            <div>
              <label
                className="label cursor-help"
                title="Approximate storage used on your tablet."
              >
                Storage Used on Tablet (GB)
              </label>
              <input
                className={inputClass}
                readOnly={baselineCompleted}
                title="Approximate storage used on your tablet."
                value={String(form.tablet_storage_gb ?? "")}
                onChange={(e) => update("tablet_storage_gb", e.target.value)}
              />
              <p className="help">Approximate storage used on your tablet.</p>
            </div>

            <div>
              <label
                className="label cursor-help"
                title="Number of cloud services you actively use (e.g. Google Drive, iCloud, Dropbox)."
              >
                Active Cloud Storage Accounts
              </label>
              <input
                className={inputClass}
                readOnly={baselineCompleted}
                title="Number of cloud services you actively use (e.g. Google Drive, iCloud, Dropbox)."
                value={String(form.cloud_accounts ?? "")}
                onChange={(e) => update("cloud_accounts", e.target.value)}
              />
              <p className="help">
                Number of cloud services you actively use (e.g. Google Drive, iCloud, Dropbox).
              </p>
            </div>

            <div>
              <label
                className="label cursor-help"
                title="Total storage used across all your cloud accounts."
              >
                Cloud Storage Used (GB)
              </label>
              <input
                className={inputClass}
                readOnly={baselineCompleted}
                title="Total storage used across all your cloud accounts."
                value={String(form.cloud_storage_gb ?? "")}
                onChange={(e) => update("cloud_storage_gb", e.target.value)}
              />
              <p className="help">Total storage used across all your cloud accounts.</p>
            </div>
          </div>

          <h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-emerald-900">
            Screen time
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                className="label cursor-help"
                title="Total time spent on screens per day (phone, computer, tablet combined)."
              >
                Average Daily Screen Time (hours)
              </label>
              <input
                className={inputClass}
                readOnly={baselineCompleted}
                title="Total time spent on screens per day (phone, computer, tablet combined)."
                value={String(form.screen_time_hours ?? "")}
                onChange={(e) => update("screen_time_hours", e.target.value)}
              />
              <p className="help">
                Total time spent on screens per day (phone, computer, tablet combined).
              </p>
            </div>

            <div>
              <label
                className="label cursor-help"
                title="Hours spent watching streaming content (e.g. Netflix, YouTube) per week."
              >
                Video Streaming (hours/week)
              </label>
              <input
                className={inputClass}
                readOnly={baselineCompleted}
                title="Hours spent watching streaming content (e.g. Netflix, YouTube) per week."
                value={String(form.streaming_hours_week ?? "")}
                onChange={(e) => update("streaming_hours_week", e.target.value)}
              />
              <p className="help">
                Hours spent watching streaming content (e.g. Netflix, YouTube) per week.
              </p>
            </div>
          </div>

          <h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-emerald-900">
            Social media (mins/day)
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                className="label cursor-help"
                title="Average minutes per day actively spent on TikTok."
              >
                TikTok (mins/day)
              </label>
              <input
                className={inputClass}
                readOnly={baselineCompleted}
                title="Average minutes per day actively spent on TikTok."
                value={String(form.tiktok_minutes ?? "")}
                onChange={(e) => update("tiktok_minutes", e.target.value)}
              />
              <p className="help">Average minutes per day actively spent on TikTok.</p>
            </div>
            <div>
              <label
                className="label cursor-help"
                title="Average minutes per day actively spent on Instagram."
              >
                Instagram (mins/day)
              </label>
              <input
                className={inputClass}
                readOnly={baselineCompleted}
                title="Average minutes per day actively spent on Instagram."
                value={String(form.instagram_minutes ?? "")}
                onChange={(e) => update("instagram_minutes", e.target.value)}
              />
              <p className="help">Average minutes per day actively spent on Instagram.</p>
            </div>
            <div>
              <label
                className="label cursor-help"
                title="Average minutes per day actively spent on Facebook."
              >
                Facebook (mins/day)
              </label>
              <input
                className={inputClass}
                readOnly={baselineCompleted}
                title="Average minutes per day actively spent on Facebook."
                value={String(form.facebook_minutes ?? "")}
                onChange={(e) => update("facebook_minutes", e.target.value)}
              />
              <p className="help">Average minutes per day actively spent on Facebook.</p>
            </div>
            <div>
              <label
                className="label cursor-help"
                title="Average minutes per day actively spent on YouTube."
              >
                YouTube (mins/day)
              </label>
              <input
                className={inputClass}
                readOnly={baselineCompleted}
                title="Average minutes per day actively spent on YouTube."
                value={String(form.youtube_minutes ?? "")}
                onChange={(e) => update("youtube_minutes", e.target.value)}
              />
              <p className="help">Average minutes per day actively spent on YouTube.</p>
            </div>
          </div>

          <h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-emerald-900">
            Downloads
          </h2>

          <div>
            <label
              className="label cursor-help"
              title="Estimated data downloaded weekly (apps, files, offline content). Rough estimates are fine."
            >
              Estimated Weekly Downloads (GB)
            </label>
            <input
              className={inputClass}
              readOnly={baselineCompleted}
              title="Estimated data downloaded weekly (apps, files, offline content). Rough estimates are fine."
              value={String(form.downloads_gb_week ?? "")}
              onChange={(e) => update("downloads_gb_week", e.target.value)}
            />
            <p className="help">
              Estimated data downloaded weekly (apps, files, offline content). Rough estimates are fine.
            </p>
          </div>

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

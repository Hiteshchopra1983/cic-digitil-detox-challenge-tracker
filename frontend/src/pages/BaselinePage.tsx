import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../lib/api";
import Layout from "../components/Layout";
import { FieldLabelWithInfo } from "../components/FieldLabelWithInfo";
import { useParticipantJourney } from "../contexts/ParticipantJourneyContext";
import { BASELINE_FAQ_DOC_URL } from "../constants/faqDocUrls";

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
            <a
              href={BASELINE_FAQ_DOC_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-sm font-semibold text-emerald-800 underline decoration-emerald-600/50 underline-offset-2 hover:text-emerald-900"
            >
              How to find these numbers (FAQ)
            </a>
          </div>

          {baselineCompleted ? (
            <div className="mt-3 space-y-2 rounded-xl border border-emerald-200 bg-emerald-50/90 px-3 py-3 text-sm text-emerald-900">
              <p>
                Your baseline is saved and shown below (read-only). Use the menu for Dashboard,
                Weekly Tracker, and Leaderboard.
              </p>
              <p className="text-emerald-950">
                To change your baseline data after it has been submitted, reach out to an
                administrator at{" "}
                <a
                  href="mailto:digital-detox@communityimpactchallenge.org"
                  className="font-semibold underline decoration-emerald-700/60 underline-offset-2 break-all"
                >
                  digital-detox@communityimpactchallenge.org
                </a>
                .
              </p>
            </div>
          ) : null}

          <h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-emerald-900">
            Devices & storage
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-5 md:gap-y-4">
            <div>
              <FieldLabelWithInfo hint="Number of smartphones you actively use (exclude old or unused devices).">
                Phones Owned
              </FieldLabelWithInfo>
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
              <FieldLabelWithInfo hint="For Phone: Approximate storage currently used across your phone(s). Check in device settings.">
                Storage Used on Phone (GB)
              </FieldLabelWithInfo>
              <input
                className={inputClass}
                readOnly={baselineCompleted}
                title="For Phone: Approximate storage currently used across your phone(s). Check in device settings."
                value={String(form.phone_storage_gb ?? "")}
                onChange={(e) => update("phone_storage_gb", e.target.value)}
              />
              <p className="help">
                For Phone: Approximate storage currently used across your phone(s). Check in device settings.
              </p>
            </div>

            <div>
              <FieldLabelWithInfo hint="Number of tablets you actively use.">Tablets Owned</FieldLabelWithInfo>
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
              <FieldLabelWithInfo hint="For Tablets: Approximate storage currently used across your tablet(s)">
                Storage Used on Tablet (GB)
              </FieldLabelWithInfo>
              <input
                className={inputClass}
                readOnly={baselineCompleted}
                title="For Tablets: Approximate storage currently used across your tablet(s)"
                value={String(form.tablet_storage_gb ?? "")}
                onChange={(e) => update("tablet_storage_gb", e.target.value)}
              />
              <p className="help">For Tablets: Approximate storage currently used across your tablet(s)</p>
            </div>

            <div>
              <FieldLabelWithInfo hint="Number of laptops or desktops you regularly use.">
                Computers Owned (Laptops/Desktops)
              </FieldLabelWithInfo>
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
              <FieldLabelWithInfo hint="For computer: Approximate storage currently used across your computer(s)">
                Storage Used on Computer (GB)
              </FieldLabelWithInfo>
              <input
                className={inputClass}
                readOnly={baselineCompleted}
                title="For computer: Approximate storage currently used across your computer(s)"
                value={String(form.laptop_storage_gb ?? "")}
                onChange={(e) => update("laptop_storage_gb", e.target.value)}
              />
              <p className="help">For computer: Approximate storage currently used across your computer(s)</p>
            </div>

            <div>
              <FieldLabelWithInfo hint="Number of cloud services you actively use (e.g. Google Drive, iCloud, Dropbox).">
                Active Cloud Storage Accounts
              </FieldLabelWithInfo>
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
              <FieldLabelWithInfo hint="For Cloud: Approximate storage currently used across your account(s)">
                Cloud Storage Used (GB)
              </FieldLabelWithInfo>
              <input
                className={inputClass}
                readOnly={baselineCompleted}
                title="For Cloud: Approximate storage currently used across your account(s)"
                value={String(form.cloud_storage_gb ?? "")}
                onChange={(e) => update("cloud_storage_gb", e.target.value)}
              />
              <p className="help">For Cloud: Approximate storage currently used across your account(s)</p>
            </div>
          </div>

          <h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-emerald-900">
            Screen time
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <FieldLabelWithInfo hint="Total time spent on screens per DAY (phone, computer, tablet combined). NOTE: this is DAILY screen time.">
                Total time spent on screens per DAY (phone, computer, tablet combined)
              </FieldLabelWithInfo>
              <input
                className={inputClass}
                readOnly={baselineCompleted}
                title="Total time spent on screens per DAY (phone, computer, tablet combined). NOTE: this is DAILY screen time."
                value={String(form.screen_time_hours ?? "")}
                onChange={(e) => update("screen_time_hours", e.target.value)}
              />
              <p className="help">
                Total time spent on screens per DAY (phone, computer, tablet combined). NOTE: this is DAILY screen time.
              </p>
            </div>

            <div>
              <FieldLabelWithInfo hint="Hours spent watching streaming content (e.g. Netflix, YouTube) per week.">
                Video Streaming (hours/week)
              </FieldLabelWithInfo>
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
            AI assistants
          </h2>

          <div className="mb-2 max-w-xl">
            <FieldLabelWithInfo hint="Estimated weekly total across ChatGPT, Copilot, Gemini, Claude, and similar chat-based AI tools. Estimates are fine.">
              Number of prompts / questions asked per week to ChatGPT (and other similar AI tools)
            </FieldLabelWithInfo>
            <input
              className={inputClass}
              readOnly={baselineCompleted}
              title="Estimated weekly total of prompts or questions to ChatGPT and similar AI tools."
              inputMode="numeric"
              value={String(form.llm_queries_per_week ?? "")}
              onChange={(e) => update("llm_queries_per_week", e.target.value)}
            />
            <p className="help">
              Typical week: count each message or follow-up you send as one prompt or question, across all
              such tools combined.
            </p>
          </div>

          <h2 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-emerald-900">
            Downloads
          </h2>

          <div>
            <FieldLabelWithInfo hint="Estimated data downloaded weekly (apps, files, offline content). Estimated values are fine.">
              Estimated Weekly Downloads (GB)
            </FieldLabelWithInfo>
            <input
              className={inputClass}
              readOnly={baselineCompleted}
              title="Estimated data downloaded weekly (apps, files, offline content). Estimated values are fine."
              value={String(form.downloads_gb_week ?? "")}
              onChange={(e) => update("downloads_gb_week", e.target.value)}
            />
            <p className="help">
              Estimated data downloaded weekly (apps, files, offline content). Estimated values are fine.
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

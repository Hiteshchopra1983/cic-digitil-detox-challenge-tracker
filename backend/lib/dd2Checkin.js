/**
 * Digital Detox 2.0 — four-action chip check-in helpers.
 * Guiding principle: one challenge, four actions, ~1 min weekly, four months, own pace.
 */

const DD2_DURATION_WEEKS = 16; // ~4 months
const DD2_MONTH_LENGTH = 4;

const ACTIONS = [
  {
    key: "cleanup",
    title: "Digital cleanup",
    question: "How much digital clutter did you delete?",
    choices: ["< 10 MB", "10–100 MB", "> 100 MB", "Not this week"]
  },
  {
    key: "inbox",
    title: "Calmer inbox",
    question: "How did you tidy your mailbox?",
    choices: ["Light tidy", "Solid tidy", "Deep tidy", "Not this week"]
  },
  {
    key: "notif",
    title: "Fewer notifications",
    question: "Did you reduce notifications?",
    choices: ["Muted a few", "Cut many", "Major quiet", "Not this week"]
  },
  {
    key: "streaming",
    title: "Limited streaming",
    question: "How much did you cut streaming?",
    choices: ["A little", "A good cut", "Major cut", "Not this week"]
  }
];

const SKIP = "Not this week";

/** Map chips → existing weekly_progress numeric fields (admin / CO₂ continuity). */
function metricsFromActions(actions = {}) {
  const cleanup = actions.cleanup;
  const inbox = actions.inbox;
  const notif = actions.notif;
  const streaming = actions.streaming;

  let storage_deleted_gb = 0;
  if (cleanup === "< 10 MB") storage_deleted_gb = 0.005;
  else if (cleanup === "10–100 MB") storage_deleted_gb = 0.05;
  else if (cleanup === "> 100 MB") storage_deleted_gb = 0.2;

  let emails_reduced = 0;
  if (inbox === "Light tidy") emails_reduced = 10;
  else if (inbox === "Solid tidy") emails_reduced = 40;
  else if (inbox === "Deep tidy") emails_reduced = 100;

  let messages_reduced = 0;
  if (notif === "Muted a few") messages_reduced = 5;
  else if (notif === "Cut many") messages_reduced = 20;
  else if (notif === "Major quiet") messages_reduced = 50;

  let streaming_reduction_minutes = 0;
  if (streaming === "A little") streaming_reduction_minutes = 30;
  else if (streaming === "A good cut") streaming_reduction_minutes = 90;
  else if (streaming === "Major cut") streaming_reduction_minutes = 180;

  return {
    storage_deleted_gb,
    downloads_avoided_gb: 0,
    emails_reduced,
    messages_reduced,
    streaming_reduction_minutes,
    screen_time_change_minutes: 0,
    alumni_touchpoints: 0,
    ritual_completed: false,
    llm_queries_reduced: 0
  };
}

function validateActions(actions) {
  if (!actions || typeof actions !== "object") {
    return { ok: false, error: "actions object is required" };
  }
  for (const def of ACTIONS) {
    const val = actions[def.key];
    if (val == null || val === "") {
      return { ok: false, error: `Missing choice for ${def.title}` };
    }
    if (!def.choices.includes(val)) {
      return { ok: false, error: `Invalid choice for ${def.title}` };
    }
  }
  return { ok: true };
}

function countActionsDone(actions) {
  if (!actions) return 0;
  return ACTIONS.filter((a) => {
    const v = actions[a.key];
    return v && v !== SKIP;
  }).length;
}

function monthForWeek(weekNumber) {
  const w = Math.max(1, Number(weekNumber) || 1);
  const monthIndex = Math.min(
    4,
    Math.ceil(w / DD2_MONTH_LENGTH)
  );
  const start = (monthIndex - 1) * DD2_MONTH_LENGTH + 1;
  const weeks = [];
  for (let i = 0; i < DD2_MONTH_LENGTH; i++) {
    weeks.push(start + i);
  }
  return {
    index: monthIndex,
    label: `Month ${monthIndex} of 4`,
    weeks
  };
}

/**
 * Suggest next week to check in (own pace).
 * Prefer calendar open week when program start is set; else first gap or next after last.
 */
function suggestWeek({
  programWeek1Start,
  submittedWeeks,
  skippedWeeks,
  now = new Date(),
  duration = DD2_DURATION_WEEKS
}) {
  const done = new Set(
    [...(submittedWeeks || []), ...(skippedWeeks || [])].map(Number)
  );

  if (programWeek1Start) {
    const start = new Date(programWeek1Start);
    if (!Number.isNaN(start.getTime())) {
      const ms = now.getTime() - start.getTime();
      const week = Math.floor(ms / (7 * 24 * 60 * 60 * 1000)) + 1;
      const current = Math.min(duration, Math.max(1, week));
      if (!done.has(current)) return current;
      for (let i = 1; i <= duration; i++) {
        if (!done.has(i)) return i;
      }
      return current;
    }
  }

  for (let i = 1; i <= duration; i++) {
    if (!done.has(i)) return i;
  }
  return duration;
}

function parseDd2Json(raw) {
  if (!raw) return null;
  if (typeof raw === "object") return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

module.exports = {
  DD2_DURATION_WEEKS,
  DD2_MONTH_LENGTH,
  ACTIONS,
  SKIP,
  metricsFromActions,
  validateActions,
  countActionsDone,
  monthForWeek,
  suggestWeek,
  parseDd2Json
};

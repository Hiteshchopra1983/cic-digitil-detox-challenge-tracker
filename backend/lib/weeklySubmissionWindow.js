/**
 * Weekly submission windows: program week N is Monday 00:00 UTC through Sunday end-of-day UTC,
 * anchored at program_week_1_start_date (must be a Monday, UTC).
 */

function parseProgramWeek1StartDate(ymd) {
  if (ymd == null) return { ok: true, date: null };
  let s;
  if (ymd instanceof Date) {
    if (Number.isNaN(ymd.getTime())) {
      return { ok: false, error: "Invalid program_week_1_start_date." };
    }
    s = ymd.toISOString().slice(0, 10);
  } else {
    s = String(ymd).trim();
  }
  if (s === "") return { ok: true, date: null };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return {
      ok: false,
      error:
        "program_week_1_start_date must be YYYY-MM-DD (the Monday when week 1 opens, UTC calendar)."
    };
  }
  const d = new Date(`${s}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) {
    return { ok: false, error: "Invalid program_week_1_start_date." };
  }
  if (d.getUTCDay() !== 1) {
    return {
      ok: false,
      error: "program_week_1_start_date must be a Monday in the UTC calendar."
    };
  }
  return { ok: true, date: d };
}

/** @returns {{ start: Date, end: Date } | null} */
function utcWeekWindow(anchorMondayUtc, weekNumber) {
  const idx = weekNumber - 1;
  if (!Number.isFinite(weekNumber) || weekNumber < 1 || idx < 0) return null;
  const start = new Date(anchorMondayUtc.getTime() + idx * 7 * 24 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  return { start, end };
}

/**
 * @param {number} weekNumber
 * @param {string|Date|null|undefined} programWeek1StartYmd - YYYY-MM-DD or null to skip enforcement
 * @param {Date} [now]
 * @returns {string|null} error message or null if allowed / enforcement off
 */
function validateWeeklySubmissionWindow(weekNumber, programWeek1StartYmd, now = new Date()) {
  const parsed = parseProgramWeek1StartDate(programWeek1StartYmd);
  if (!parsed.ok) return parsed.error;
  if (parsed.date == null) return null;

  const win = utcWeekWindow(parsed.date, weekNumber);
  if (!win) return "Invalid week number.";

  if (now < win.start) {
    const open = win.start.toISOString().slice(0, 10);
    return `Submissions for week ${weekNumber} open on ${open} (Monday 00:00 UTC).`;
  }
  if (now > win.end) {
    const closed = win.end.toISOString().slice(0, 10);
    return `The submission window for week ${weekNumber} has closed (ended Sunday ${closed} UTC).`;
  }
  return null;
}

/**
 * Program week whose Mon–Sun UTC window contains `now`, or null if before week 1 / after last week.
 */
function getCurrentOpenWeekNumber(programWeek1StartYmd, now = new Date(), maxWeek = 6) {
  const parsed = parseProgramWeek1StartDate(programWeek1StartYmd);
  if (!parsed.ok || parsed.date == null) return null;

  const cap = Number(maxWeek);
  const limit = Number.isFinite(cap) && cap >= 1 ? Math.floor(cap) : 6;

  for (let w = 1; w <= limit; w++) {
    if (validateWeeklySubmissionWindow(w, programWeek1StartYmd, now) === null) {
      return w;
    }
  }
  return null;
}

/**
 * Default week for the weekly tracker UI.
 * When calendar windows are enforced, prefer the current open week even if earlier weeks
 * were missed (participants are not blocked on a closed week).
 */
function getSuggestedSubmissionWeek(
  programWeek1StartYmd,
  submittedWeeks,
  now = new Date(),
  maxWeek = 6
) {
  const submitted = new Set(
    (submittedWeeks || []).map(Number).filter((n) => Number.isFinite(n) && n >= 1)
  );

  const cap = Number(maxWeek);
  const limit = Number.isFinite(cap) && cap >= 1 ? Math.floor(cap) : 6;

  const parsed = parseProgramWeek1StartDate(programWeek1StartYmd);
  if (!parsed.ok || parsed.date == null) {
    for (let w = 1; w <= limit; w++) {
      if (!submitted.has(w)) return w;
    }
    return null;
  }

  const currentOpen = getCurrentOpenWeekNumber(programWeek1StartYmd, now, limit);

  if (currentOpen != null && !submitted.has(currentOpen)) {
    return currentOpen;
  }

  for (let w = 1; w <= limit; w++) {
    if (submitted.has(w)) continue;
    const win = utcWeekWindow(parsed.date, w);
    if (win && now <= win.end) return w;
  }

  if (currentOpen != null) return currentOpen;

  const w1 = utcWeekWindow(parsed.date, 1);
  if (w1 && now < w1.start) return 1;

  for (let w = 1; w <= limit; w++) {
    if (!submitted.has(w)) return w;
  }
  return null;
}

module.exports = {
  parseProgramWeek1StartDate,
  utcWeekWindow,
  validateWeeklySubmissionWindow,
  getCurrentOpenWeekNumber,
  getSuggestedSubmissionWeek
};

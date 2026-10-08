/** YYYY-MM-DD in UTC for a Date at UTC midnight. */
export function utcCalendarYmd(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Monday 00:00 UTC of the ISO-style week that contains today's UTC calendar date
 * (week starts Monday; Sunday belongs to the week that began the prior Monday).
 */
export function utcMondayContainingToday(): Date {
  const now = new Date();
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0)
  );
  const day = d.getUTCDay();
  const delta = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + delta);
  return d;
}

/** The Monday exactly one week after `utcMondayContainingToday`. */
export function utcMondayNextWeek(): Date {
  const d = utcMondayContainingToday();
  d.setUTCDate(d.getUTCDate() + 7);
  return d;
}

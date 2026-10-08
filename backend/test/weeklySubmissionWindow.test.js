const test = require("node:test");
const assert = require("node:assert/strict");
const {
  validateWeeklySubmissionWindow,
  parseProgramWeek1StartDate,
  utcWeekWindow,
  getCurrentOpenWeekNumber,
  getSuggestedSubmissionWeek
} = require("../lib/weeklySubmissionWindow");

test("no anchor → no enforcement", () => {
  assert.equal(validateWeeklySubmissionWindow(1, null, new Date()), null);
  assert.equal(validateWeeklySubmissionWindow(1, "", new Date()), null);
});

test("invalid anchor shape", () => {
  assert.match(String(validateWeeklySubmissionWindow(1, "nope", new Date())), /YYYY-MM-DD/);
});

test("anchor must be Monday UTC", () => {
  const r = parseProgramWeek1StartDate("2025-01-07");
  assert.equal(r.ok, false);
});

test("week 1 window: Sunday end OK, next Monday is too late for week 1", () => {
  const anchor = "2025-01-06";
  const sundayEnd = new Date("2025-01-12T23:59:59.999Z");
  assert.equal(validateWeeklySubmissionWindow(1, anchor, sundayEnd), null);

  const mondayNext = new Date("2025-01-13T00:00:00.000Z");
  assert.ok(validateWeeklySubmissionWindow(1, anchor, mondayNext));
});

test("week 2 opens Monday after week 1 Sunday", () => {
  const anchor = "2025-01-06";
  const sundayW1 = new Date("2025-01-12T23:59:59.999Z");
  assert.ok(validateWeeklySubmissionWindow(2, anchor, sundayW1));

  const mondayW2 = new Date("2025-01-13T00:00:00.000Z");
  assert.equal(validateWeeklySubmissionWindow(2, anchor, mondayW2), null);

  const sundayW2End = new Date("2025-01-19T23:59:59.999Z");
  assert.equal(validateWeeklySubmissionWindow(2, anchor, sundayW2End), null);
});

test("utcWeekWindow span is 7 days minus 1 ms", () => {
  const { date } = parseProgramWeek1StartDate("2025-01-06");
  assert.equal(date != null && date instanceof Date, true);
  const w = utcWeekWindow(date, 1);
  assert.equal(w.start.toISOString(), "2025-01-06T00:00:00.000Z");
  assert.equal(w.end.toISOString(), "2025-01-12T23:59:59.999Z");
});

test("getCurrentOpenWeekNumber during week 3", () => {
  const anchor = "2025-01-06";
  const duringW3 = new Date("2025-01-20T12:00:00.000Z");
  assert.equal(getCurrentOpenWeekNumber(anchor, duringW3, 6), 3);
});

test("getSuggestedSubmissionWeek skips closed missed week for current week", () => {
  const anchor = "2025-01-06";
  const duringW3 = new Date("2025-01-20T12:00:00.000Z");
  assert.equal(getSuggestedSubmissionWeek(anchor, [1], duringW3, 6), 3);
});

test("getSuggestedSubmissionWeek uses first pending when no anchor", () => {
  assert.equal(getSuggestedSubmissionWeek(null, [1], new Date(), 6), 2);
});

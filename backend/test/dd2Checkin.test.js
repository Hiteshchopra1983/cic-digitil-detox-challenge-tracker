const {
  metricsFromActions,
  validateActions,
  countActionsDone,
  monthForWeek,
  suggestWeek,
  DD2_DURATION_WEEKS
} = require("../lib/dd2Checkin");

function assert(cond, msg) {
  if (!cond) throw new Error(msg || "Assertion failed");
}

assert(DD2_DURATION_WEEKS === 16, "duration 16");

const m = metricsFromActions({
  cleanup: "10–100 MB",
  inbox: "Solid tidy",
  notif: "Not this week",
  streaming: "A good cut"
});
assert(m.storage_deleted_gb === 0.05, "cleanup map");
assert(m.emails_reduced === 40, "inbox map");
assert(m.messages_reduced === 0, "notif skip");
assert(m.streaming_reduction_minutes === 90, "streaming map");

assert(
  countActionsDone({
    cleanup: "10–100 MB",
    inbox: "Solid tidy",
    notif: "Not this week",
    streaming: "A good cut"
  }) === 3,
  "3 done"
);

const bad = validateActions({ cleanup: "x" });
assert(!bad.ok, "invalid actions");

const ok = validateActions({
  cleanup: "< 10 MB",
  inbox: "Light tidy",
  notif: "Muted a few",
  streaming: "A little"
});
assert(ok.ok, "valid actions");

const month = monthForWeek(8);
assert(month.index === 2, "month 2");
assert(month.weeks.join(",") === "5,6,7,8", "month weeks");

const suggested = suggestWeek({
  programWeek1Start: null,
  submittedWeeks: [1, 2],
  skippedWeeks: [3],
  duration: 16
});
assert(suggested === 4, "next open week");

console.log("dd2Checkin.test.js OK");

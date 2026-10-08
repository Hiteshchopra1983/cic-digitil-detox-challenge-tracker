/**
 * Compare JWT participant id to a route/body id (case-insensitive UUIDs).
 */
function sameParticipantId(a, b) {
  const x = String(a || "").trim();
  const y = String(b || "").trim();
  if (!x || !y) return false;
  if (/^[0-9a-f-]{36}$/i.test(x) && /^[0-9a-f-]{36}$/i.test(y)) {
    return x.toLowerCase() === y.toLowerCase();
  }
  return x === y;
}

module.exports = { sameParticipantId };

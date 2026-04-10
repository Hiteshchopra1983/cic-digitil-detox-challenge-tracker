const { pool } = require("../lib/db");

/**
 * Parse comma-separated emails; normalize to trimmed lowercase unique list with basic validation.
 * @param {string} raw
 * @returns {string[]}
 */
function parseReachOutEmailList(raw) {
  if (raw == null || String(raw).trim() === "") return [];
  const parts = String(raw)
    .split(/[,;\n]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  const seen = new Set();
  const out = [];
  for (const e of parts) {
    if (seen.has(e)) continue;
    seen.add(e);
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) out.push(e);
  }
  return out;
}

/**
 * Count how many reach-out emails correspond to an existing participant account (not the submitter).
 * Only counts role = participant (excludes admin / disabled).
 * @param {string} submitterParticipantId - uuid
 * @param {string} rawReachOut - comma-separated input
 * @returns {Promise<{ storedText: string, count: number }>}
 */
async function computeReachOutRegisteredCount(submitterParticipantId, rawReachOut) {
  const storedText =
    rawReachOut == null ? "" : String(rawReachOut).trim().slice(0, 8000);
  const uniqueEmails = parseReachOutEmailList(storedText);
  if (uniqueEmails.length === 0) {
    return { storedText, count: 0 };
  }

  const submitterKey = String(submitterParticipantId || "").trim().toLowerCase();
  if (!submitterKey) {
    return { storedText, count: 0 };
  }

  const r = await pool.query(
    `SELECT lower(trim(email)) AS e
     FROM participants
     WHERE role = 'participant'
       AND lower(id::text) <> $2
       AND lower(trim(email)) = ANY($1::text[])`,
    [uniqueEmails, submitterKey]
  );

  const matched = new Set(r.rows.map((row) => row.e));
  let count = 0;
  for (const e of uniqueEmails) {
    if (matched.has(e)) count += 1;
  }

  return { storedText, count };
}

module.exports = {
  parseReachOutEmailList,
  computeReachOutRegisteredCount
};

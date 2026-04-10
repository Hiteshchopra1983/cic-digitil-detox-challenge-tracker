const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { pool } = require("../lib/db");
const { logAction } = require("../services/auditLogger");
const { resolvePublicAppBaseUrl } = require("../lib/publicAppUrl");
const { sendWelcomeCredentialsEmail } = require("../services/emailService");

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

function parseCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else if (c !== "\r") {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

function parseParticipantsCsv(text) {
  const raw = String(text || "").replace(/^\uFEFF/, "");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    throw new Error("CSV must include a header row and at least one data row.");
  }
  const header = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const required = ["name", "email", "country"];
  for (const col of required) {
    if (!header.includes(col)) {
      throw new Error(`Missing required column: ${col}`);
    }
  }
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    const row = {};
    header.forEach((h, idx) => {
      row[h] = (cells[idx] ?? "").trim();
    });
    rows.push({ ...row, _line: i + 1 });
  }
  return rows;
}

function generateSecurePassword() {
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const digits = "0123456789";
  const special = "!@#$%&*";
  const pick = (s) => s[crypto.randomInt(s.length)];
  const all = lower + upper + digits + special;
  let chars = [pick(lower), pick(upper), pick(digits), pick(special)];
  for (let i = 0; i < 10; i++) {
    chars.push(pick(all));
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

function isValidEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
}

module.exports = async function adminBulkImport(req, res) {
  const csv = req.body?.csv;
  if (csv == null || String(csv).trim() === "") {
    return res.status(400).json({ error: "CSV content is required." });
  }

  let rows;
  try {
    rows = parseParticipantsCsv(csv);
  } catch (e) {
    return res.status(400).json({ error: e.message || "Invalid CSV." });
  }

  const loginBase = String(
    resolvePublicAppBaseUrl(req) ||
      process.env.FRONTEND_URL ||
      "http://localhost:8080"
  ).replace(/\/$/, "");

  const created = [];
  const failed = [];
  let emailsAttempted = 0;
  let emailsSent = 0;

  for (const row of rows) {
    const line = row._line;
    const name = row.name || "";
    const email = (row.email || "").trim().toLowerCase();
    const country = (row.country || "").trim();
    const city = (row.city || "").trim() || null;
    const cohort = (row.cohort || "").trim() || null;
    let password = (row.password || "").trim();

    if (!name || !email || !country) {
      failed.push({
        line,
        email: email || "(missing)",
        reason: "name, email, and country are required"
      });
      continue;
    }
    if (!isValidEmail(email)) {
      failed.push({ line, email, reason: "invalid email" });
      continue;
    }
    if (password && !PASSWORD_REGEX.test(password)) {
      failed.push({
        line,
        email,
        reason:
          "password must have 8+ chars with upper, lower, number, and special character"
      });
      continue;
    }
    if (!password) {
      password = generateSecurePassword();
    }

    const hash = await bcrypt.hash(password, 10);

    try {
      const ins = await pool.query(
        `INSERT INTO participants (
          name, email, password_hash, country, city, cohort,
          role, consent, consent_given, consent_timestamp
        ) VALUES ($1, $2, $3, $4, $5, $6, 'participant', true, true, NOW())
        RETURNING id`,
        [name, email, hash, country, city, cohort]
      );
      const id = ins.rows[0].id;
      const rowResult = { line, email, id, emailDelivered: false };
      created.push(rowResult);

      emailsAttempted += 1;
      try {
        const sent = await sendWelcomeCredentialsEmail({
          to: email,
          name,
          email,
          password,
          loginUrl: `${loginBase}/`
        });
        if (sent) {
          emailsSent += 1;
          rowResult.emailDelivered = true;
        }
      } catch (mailErr) {
        console.error("Welcome email failed for", email, mailErr);
      }
    } catch (err) {
      if (err.code === "23505") {
        failed.push({ line, email, reason: "email already registered" });
      } else {
        console.error("Bulk import row error:", err);
        failed.push({
          line,
          email,
          reason: err.message || "database error"
        });
      }
    }
  }

  await logAction({
    admin_id: req.user.id,
    action: "BULK_PARTICIPANT_IMPORT",
    details: {
      created: created.length,
      failed: failed.length,
      emailsSent,
      emailsAttempted
    }
  });

  return res.json({
    ok: true,
    summary: {
      totalRows: rows.length,
      created: created.length,
      failed: failed.length,
      emailsSent,
      emailsAttempted
    },
    created: created.map(({ line, email, id, emailDelivered }) => ({
      line,
      email,
      id,
      emailDelivered
    })),
    failed
  });
};

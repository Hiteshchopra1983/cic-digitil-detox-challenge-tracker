const crypto = require("crypto");
const { pool } = require("../lib/db");
const { resolvePublicAppBaseUrl } = require("../lib/publicAppUrl");
const { sendPasswordResetEmail } = require("../services/emailService");

const PUBLIC_OK = {
  ok: true,
  message:
    "If that email is registered, you will receive password reset instructions shortly."
};

module.exports = async function forgotPassword(req, res) {
  const email = String(req.body?.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    await pool.query(
      `ALTER TABLE participants ADD COLUMN IF NOT EXISTS reset_token text`
    );
    await pool.query(
      `ALTER TABLE participants ADD COLUMN IF NOT EXISTS reset_token_expiry timestamptz`
    );

    const result = await pool.query(
      `SELECT id FROM participants WHERE lower(trim(email)) = $1 LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.json(PUBLIC_OK);
    }

    const token = crypto.randomBytes(32).toString("hex");
    await pool.query(
      `UPDATE participants
       SET reset_token = $1,
           reset_token_expiry = NOW() + interval '1 hour'
       WHERE id = $2`,
      [token, result.rows[0].id]
    );

    const baseUrl = String(
      resolvePublicAppBaseUrl(req) ||
        process.env.FRONTEND_URL ||
        "http://localhost:8080"
    ).replace(/\/$/, "");
    const resetLink = `${baseUrl}/reset-password?token=${encodeURIComponent(
      token
    )}`;

    try {
      await sendPasswordResetEmail(email, resetLink);
    } catch (sendErr) {
      console.error("forgot-password email:", sendErr);
      return res.status(500).json({
        error: "Could not send reset email. Try again later or contact support."
      });
    }

    return res.json(PUBLIC_OK);
  } catch (err) {
    console.error("forgot-password:", err);
    return res.status(500).json({ error: "Could not process request" });
  }
};

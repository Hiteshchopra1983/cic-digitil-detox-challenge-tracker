const { pool } = require("../lib/db");

/** GET ?token= — used by the SPA to show or hide the reset form */
module.exports = async function verifyResetToken(req, res) {
  const token = String(req.query.token || "").trim();

  if (!token) {
    return res.status(400).json({ valid: false, error: "Token is required" });
  }

  try {
    await pool.query(
      `ALTER TABLE participants ADD COLUMN IF NOT EXISTS reset_token text`
    );
    await pool.query(
      `ALTER TABLE participants ADD COLUMN IF NOT EXISTS reset_token_expiry timestamptz`
    );

    const r = await pool.query(
      `SELECT 1 FROM participants
       WHERE reset_token = $1
         AND reset_token_expiry IS NOT NULL
         AND reset_token_expiry > NOW()
       LIMIT 1`,
      [token]
    );
    return res.json({ valid: r.rows.length > 0 });
  } catch (err) {
    console.error("verify-reset-token:", err);
    return res.status(500).json({ valid: false, error: "Could not verify token" });
  }
};

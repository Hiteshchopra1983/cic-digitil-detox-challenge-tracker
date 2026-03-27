const bcrypt = require("bcrypt");
const { pool } = require("../lib/db");

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

module.exports = async function resetPassword(req, res) {
  const token = String(req.body?.token || "").trim();
  const password = String(req.body?.password || "");
  const confirm = String(
    req.body?.confirmPassword ?? req.body?.confirm_password ?? ""
  );

  if (!token) {
    return res.status(400).json({ error: "Reset token is required" });
  }
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }
  if (password !== confirm) {
    return res.status(400).json({ error: "Passwords do not match" });
  }
  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      error:
        "Password must contain uppercase, lowercase, number, special character and minimum 8 characters."
    });
  }

  try {
    const sel = await pool.query(
      `SELECT id FROM participants
       WHERE reset_token = $1
         AND reset_token_expiry IS NOT NULL
         AND reset_token_expiry > NOW()`,
      [token]
    );

    if (sel.rows.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    const hash = await bcrypt.hash(password, 10);
    const upd = await pool.query(
      `UPDATE participants
       SET password_hash = $1,
           reset_token = NULL,
           reset_token_expiry = NULL
       WHERE reset_token = $2`,
      [hash, token]
    );

    if (upd.rowCount === 0) {
      return res.status(400).json({ error: "Invalid or expired reset link" });
    }

    return res.json({
      ok: true,
      message: "Your password has been updated. You can sign in."
    });
  } catch (err) {
    console.error("reset-password:", err);
    return res.status(500).json({ error: "Could not reset password" });
  }
};

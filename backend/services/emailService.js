const nodemailer = require("nodemailer");

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(s) {
  return String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

function smtpConfig() {
  return {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 587)
  };
}

function createTransporter() {
  const { user, pass, host, port } = smtpConfig();
  const auth =
    user && pass
      ? { user, pass }
      : { user: "your_email@gmail.com", pass: "your_app_password" };

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth
  });
}

function mailFrom() {
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  const { user } = smtpConfig();
  if (user) return `"Digital Detox" <${user}>`;
  return '"Digital Detox" <your_email@gmail.com>';
}

async function sendEmail(to, subject, message) {
  try {
    await createTransporter().sendMail({
      from: mailFrom(),
      to,
      subject,
      html: `<p>${message}</p>`
    });
  } catch (err) {
    console.error("Email failed:", err);
  }
}

/**
 * Password reset mail. If SMTP_USER/SMTP_PASS are unset, logs the link (dev).
 * @returns {Promise<boolean>} true if an email was sent
 */
async function sendPasswordResetEmail(to, resetLink) {
  const { user, pass } = smtpConfig();
  const subject = "Reset your Digital Detox password";
  const html = `
    <p>You requested a password reset for your <strong>Digital Detox Challenge Tracker</strong> account.</p>
    <p>
      <a href="${resetLink}" style="display:inline-block;margin:12px 0;padding:10px 18px;background:#047857;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Set a new password</a>
    </p>
    <p style="color:#64748b;font-size:13px;">Or open this link in your browser:</p>
    <p style="word-break:break-all;font-size:13px;">${resetLink}</p>
    <p style="color:#64748b;font-size:13px;">This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>
  `;

  if (!user || !pass) {
    console.warn(
      "[password-reset] SMTP_USER/SMTP_PASS not set; email not sent. Reset link:",
      resetLink
    );
    return false;
  }

  try {
    await createTransporter().sendMail({
      from: mailFrom(),
      to,
      subject,
      html
    });
    return true;
  } catch (err) {
    console.error("Password reset email failed:", err);
    throw err;
  }
}

/**
 * @param {{ to: string, name: string, email: string, password: string, loginUrl: string }} opts
 * @returns {Promise<boolean>} true if mail was sent, false if SMTP not configured (dev)
 */
async function sendWelcomeCredentialsEmail(opts) {
  const { to, name, email, password, loginUrl } = opts;
  const { user, pass } = smtpConfig();
  const subject = "Your Digital Detox Challenge Tracker login";
  const safeName = escapeHtml(name || "Participant");
  const safeEmail = escapeHtml(email);
  const safeLogin = escapeHtml(loginUrl);
  const safePwd = escapeHtml(password);
  const html = `
    <p>Hi ${safeName},</p>
    <p>An administrator created your account for the <strong>Digital Detox Challenge Tracker</strong>.</p>
    <p><strong>Sign-in page:</strong> <a href="${escapeAttr(loginUrl)}">${safeLogin}</a></p>
    <p><strong>Username (email):</strong> ${safeEmail}</p>
    <p><strong>Temporary password:</strong> <code style="font-size:15px;background:#f1f5f9;padding:4px 8px;border-radius:4px;">${safePwd}</code></p>
    <p style="color:#64748b;font-size:13px;">Please sign in and change your password from your profile if available, or use &quot;Forgot password&quot; after first login if you prefer.</p>
    <p style="color:#64748b;font-size:13px;">For security, do not share this email.</p>
  `;

  if (!user || !pass) {
    console.warn(
      "[welcome-credentials] SMTP_USER/SMTP_PASS not set; credentials not emailed. User:",
      email
    );
    return false;
  }

  try {
    await createTransporter().sendMail({
      from: mailFrom(),
      to,
      subject,
      html
    });
    return true;
  } catch (err) {
    console.error("Welcome credentials email failed:", err);
    throw err;
  }
}

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeCredentialsEmail
};

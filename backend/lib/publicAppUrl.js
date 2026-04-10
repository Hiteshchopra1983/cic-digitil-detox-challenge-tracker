/**
 * Base URL of the public SPA (password reset links, welcome mail login URL).
 * 1) FRONTEND_URL on the server (set on Elastic Beanstalk) - preferred in production
 * 2) Origin / Referer from the browser request - works when EB env was not set yet
 * 3) localhost fallback - local dev only
 */
function resolvePublicAppBaseUrl(req) {
  const fromEnv = String(process.env.FRONTEND_URL || "")
    .trim()
    .replace(/\/$/, "");
  if (fromEnv) return fromEnv;

  const origin = String(req.get("Origin") || "")
    .trim()
    .replace(/\/$/, "");
  if (/^https?:\/\//i.test(origin)) return origin;

  const referer = req.get("Referer");
  if (referer) {
    try {
      const u = new URL(referer);
      if (u.host) return `${u.protocol}//${u.host}`.replace(/\/$/, "");
    } catch (_) {
      /* ignore */
    }
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:8080";
  }

  return null;
}

module.exports = { resolvePublicAppBaseUrl };

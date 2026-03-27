import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { publicApi } from "../lib/api";

function validatePassword(password: string) {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return regex.test(password);
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = (searchParams.get("token") || "").trim();

  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!token) {
        setTokenValid(false);
        setChecking(false);
        return;
      }
      const res = await publicApi<{ valid?: boolean }>(
        `/api/auth/reset-token?token=${encodeURIComponent(token)}`,
        "GET"
      );
      if (cancelled) return;
      if (!res.ok) {
        setTokenValid(false);
        setChecking(false);
        return;
      }
      setTokenValid(!!res.data.valid);
      setChecking(false);
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validatePassword(password)) {
      setError(
        "Password must contain uppercase, lowercase, number, special character and minimum 8 characters."
      );
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    const res = await publicApi<{ message?: string }>(
      "/api/auth/reset-password",
      "POST",
      { token, password, confirmPassword: confirm }
    );
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setDoneMessage(res.data.message || "Password updated.");
    setTimeout(() => navigate("/"), 2500);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-700 p-4">
      <div className="bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-8 md:p-10 w-full max-w-md border border-white/70">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-2 text-emerald-900">
          Set new password
        </h1>

        {checking ? (
          <p className="text-center text-gray-600 text-sm py-8">Checking your link…</p>
        ) : !token ? (
          <p className="text-center text-red-600 text-sm py-4" role="alert">
            Missing reset token. Open the link from your email or request a new reset from
            the sign-in page.
          </p>
        ) : !tokenValid ? (
          <p className="text-center text-red-600 text-sm py-4" role="alert">
            This reset link is invalid or has expired. Request a new one from the sign-in
            page.
          </p>
        ) : doneMessage ? (
          <p className="text-center text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-3 text-sm">
            {doneMessage} Redirecting to sign in…
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <input
              type="password"
              autoComplete="new-password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            />
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Confirm new password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full border rounded-lg px-4 py-2"
            />

            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-800 text-white py-2.5 rounded-lg hover:bg-emerald-900 transition disabled:opacity-60"
            >
              {submitting ? "Updating…" : "Update password"}
            </button>
          </form>
        )}

        <p className="text-center mt-6 text-sm text-gray-600">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="text-emerald-700 font-medium"
          >
            Back to sign in
          </button>
        </p>
      </div>
    </div>
  );
}

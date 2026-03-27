import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { publicApi } from "../lib/api";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);

    const res = await publicApi<{ message?: string }>(
      "/api/auth/forgot-password",
      "POST",
      { email: email.trim() }
    );

    setSubmitting(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    setMessage(res.data.message || "Check your inbox for reset instructions.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-700 p-4">
      <div className="bg-white/95 backdrop-blur shadow-2xl rounded-2xl p-8 md:p-10 w-full max-w-md border border-white/70">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-2 text-emerald-900">
          Forgot password
        </h1>
        <p className="text-gray-600 text-center mb-6 text-sm">
          Enter the email you registered with. We will send you a link to choose a new
          password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg px-4 py-2"
          />

          {error ? (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-emerald-800 text-white py-2.5 rounded-lg hover:bg-emerald-900 transition disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Send reset link"}
          </button>
        </form>

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

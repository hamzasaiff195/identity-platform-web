"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { forgotPassword } from "@/lib/auth-api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");

      return;
    }

    try {
      setLoading(true);

      await forgotPassword(email.trim().toLowerCase());

      setSuccess(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="identity-page flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="identity-surface rounded-2xl p-8">
          <p className="identity-eyebrow">Account recovery</p>

          <h1 className="mt-2 text-2xl font-semibold">Forgot your password?</h1>

          <p className="identity-muted mt-2 text-sm">
            Enter your email address and we'll send you a password reset link.
          </p>

          {success ? (
            <div className="mt-6 space-y-5">
              <div className="rounded-xl border border-[var(--success)]/20 bg-[var(--success-soft)] p-4 text-sm">
                If an account exists for this email, a password reset link has
                been sent.
              </div>

              <Link
                href="/login"
                className="identity-button-primary block w-full rounded-xl px-4 py-3 text-center text-sm font-medium"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="identity-input"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {error && (
                <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-3 text-sm text-[var(--danger)]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="identity-button-primary w-full rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>

              <Link
                href="/login"
                className="block text-center text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
              >
                Back to login
              </Link>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

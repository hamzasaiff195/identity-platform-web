"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import { resetPassword } from "@/lib/auth-api";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");

  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    if (!token) {
      setError("Invalid or missing reset token.");

      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");

      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");

      return;
    }

    try {
      setLoading(true);

      await resetPassword(token, password);

      setSuccess(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to reset password."
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="identity-page flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="identity-surface rounded-2xl p-8 text-center">
            <p className="identity-eyebrow">Password updated</p>

            <h1 className="mt-2 text-2xl font-semibold">
              Password reset successful
            </h1>

            <p className="identity-muted mt-3 text-sm">
              Your password has been changed. All existing sessions have also
              been signed out.
            </p>

            <Link
              href="/login"
              className="identity-button-primary mt-6 block rounded-xl px-4 py-3 text-sm font-medium"
            >
              Sign in
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="identity-page flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="identity-surface rounded-2xl p-8">
          <p className="identity-eyebrow">Account recovery</p>

          <h1 className="mt-2 text-2xl font-semibold">Reset your password</h1>

          <p className="identity-muted mt-2 text-sm">
            Choose a new password for your account.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium"
              >
                New password
              </label>

              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="identity-input"
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium"
              >
                Confirm password
              </label>

              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="identity-input"
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
              disabled={loading || !token}
              className="identity-button-primary w-full rounded-xl px-4 py-3 text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset password"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

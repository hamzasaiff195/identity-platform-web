"use client";

import { FormEvent, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";

export default function LoginPage() {
  const router = useRouter();

  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await login(email.trim(), password);

      router.replace("/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="
        flex
        min-h-screen
        items-center
        justify-center
        bg-[var(--background)]
        px-4
        text-[var(--foreground)]
      "
    >
      <div
        className="
          w-full
          max-w-md
          rounded-2xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          p-8
          shadow-[var(--shadow-lg)]
        "
      >
        <div className="mb-8">
          <h1 className="text-2xl font-semibold">Sign in</h1>

          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            Sign in to your account.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            aria-live="polite"
            className="
              mb-5
              rounded-lg
              border
              border-[var(--danger)]
              bg-[var(--danger-soft)]
              px-4
              py-3
              text-sm
              text-[var(--danger)]
            "
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);

                if (error) {
                  setError("");
                }
              }}
              required
              autoComplete="email"
              disabled={loading}
              className="identity-input"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>

              <Link
                href="/forgot-password"
                className="
                  text-sm
                  text-[var(--primary)]
                  hover:underline
                "
              >
                Forgot password?
              </Link>
            </div>

            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);

                if (error) {
                  setError("");
                }
              }}
              required
              autoComplete="current-password"
              disabled={loading}
              className="identity-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="
              identity-button-primary
              w-full
              rounded-xl
              px-4
              py-3
              text-sm
              font-medium
              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--foreground-muted)]">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="
              text-[var(--primary)]
              hover:underline
            "
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}

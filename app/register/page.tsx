"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Logo } from "@/components/branding/logo";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Unable to create account.");
      }

      setSuccess(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to create account."
      );
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="identity-grid flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="identity-glass rounded-3xl p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-2xl text-emerald-400">
              ✓
            </div>

            <h1 className="mt-6 text-3xl font-semibold">Check your inbox</h1>

            <p className="mt-3 leading-7 text-slate-500">
              We've sent a verification link to:
            </p>

            <p className="mt-2 font-medium text-white">{email}</p>

            <p className="mt-6 text-sm text-slate-600">
              Verify your email to activate your account.
            </p>

            <Link
              href="/login"
              className="mt-8 inline-block text-sm font-medium text-violet-400 hover:text-violet-300"
            >
              Back to sign in →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="identity-grid flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="mb-10 flex justify-center">
          <Logo />
        </div>

        <div className="identity-glass rounded-3xl p-8 shadow-2xl shadow-black/30 sm:p-10">
          <div className="mb-8">
            <p className="font-mono text-xs uppercase tracking-widest text-cyan-400">
              Get started
            </p>

            <h1 className="mt-3 text-3xl font-semibold">
              Create your identity
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Create a secure Identity Platform account.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm text-slate-400">Email</label>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none transition placeholder:text-slate-700 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-400">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                minLength={8}
                required
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none transition placeholder:text-slate-700 focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-linear-to-r from-violet-500 to-cyan-500 py-3.5 text-sm font-semibold shadow-lg shadow-violet-500/20 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-violet-400 hover:text-violet-300"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useAuth } from "@/providers/auth-provider";

export default function DashboardPage() {
  const { user } = useAuth();

  const firstName = user?.email?.split("@")[0]?.split(/[._-]/)[0] ?? "there";

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-500/10 via-indigo-500/[0.04] to-transparent p-8 lg:p-10">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

        <div className="relative">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />

            <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-300">
              System operational
            </span>
          </div>

          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-violet-300 to-indigo-300 bg-clip-text text-transparent">
              {firstName}
            </span>
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
            Manage identities, authentication sessions, security policies and
            access across your platform.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Account status"
          value={user?.status ?? "Unknown"}
          description="Current account state"
          icon="●"
          positive
        />

        <StatCard
          label="Email"
          value={user?.isEmailVerified ? "Verified" : "Unverified"}
          description={user?.email ?? "No email"}
          icon="@"
          positive={user?.isEmailVerified}
        />

        <StatCard
          label="Identity"
          value={user?.isVerified ? "Verified" : "Pending"}
          description="Identity verification"
          icon="◇"
          positive={user?.isVerified}
        />

        <StatCard
          label="Authentication"
          value="Active"
          description="Current session"
          icon="↗"
          positive
        />
      </section>

      {/* Main grid */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Account */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400">
                Account
              </p>

              <h2 className="mt-2 text-lg font-semibold">Identity profile</h2>

              <p className="mt-1 text-sm text-slate-500">
                Your current authenticated identity.
              </p>
            </div>

            <div className="rounded-xl bg-violet-500/10 px-3 py-2 text-xs text-violet-300">
              Active
            </div>
          </div>

          <div className="mt-8 divide-y divide-white/5">
            <InfoRow label="Email" value={user?.email} />

            <InfoRow label="Account status" value={user?.status} />

            <InfoRow
              label="Email verification"
              value={user?.isEmailVerified ? "Verified" : "Not verified"}
            />

            <InfoRow
              label="Identity verification"
              value={user?.isVerified ? "Verified" : "Not verified"}
            />
          </div>
        </div>

        {/* Security */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400">
            Security
          </p>

          <h2 className="mt-2 text-lg font-semibold">Account security</h2>

          <p className="mt-1 text-sm text-slate-500">
            Keep your identity protected.
          </p>

          <div className="mt-8 space-y-3">
            <SecurityItem
              label="Email verified"
              enabled={user?.isEmailVerified ?? false}
            />

            <SecurityItem
              label="Account active"
              enabled={user?.status === "ACTIVE"}
            />

            <SecurityItem label="Authenticated session" enabled />
          </div>

          <button
            type="button"
            className="mt-6 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
          >
            Security settings
          </button>
        </div>
      </section>

      {/* Architecture */}
      <section className="rounded-3xl border border-white/10 bg-white/[0.025] p-6 lg:p-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400">
              Identity infrastructure
            </p>

            <h2 className="mt-2 text-lg font-semibold">
              Authentication architecture
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Your account is protected by JWT-based authentication with
              server-side session validation.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/10 bg-emerald-400/5 px-4 py-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <span className="text-xs text-emerald-300">Authenticated</span>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  icon,
  positive,
}: {
  label: string;
  value: string;
  description: string;
  icon: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-violet-500/20 hover:bg-white/[0.04]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">
          {label}
        </span>

        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs ${
            positive
              ? "bg-emerald-400/10 text-emerald-300"
              : "bg-amber-400/10 text-amber-300"
          }`}
        >
          {icon}
        </span>
      </div>

      <p className="mt-5 text-2xl font-semibold">{value}</p>

      <p className="mt-1 truncate text-xs text-slate-600">{description}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <span className="text-sm text-slate-500">{label}</span>

      <span className="truncate text-right text-sm text-slate-200">
        {value ?? "—"}
      </span>
    </div>
  );
}

function SecurityItem({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>

      <span
        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
          enabled
            ? "bg-emerald-400/10 text-emerald-300"
            : "bg-amber-400/10 text-amber-300"
        }`}
      >
        {enabled ? "✓" : "!"}
      </span>
    </div>
  );
}

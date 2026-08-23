"use client";

import type { User } from "@/lib/users-api";

type UserDetailsProps = {
  user: User | null;
  loading: boolean;
  onClose: () => void;
};

export function UserDetails({ user, loading, onClose }: UserDetailsProps) {
  if (!user && !loading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100000]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close user details"
        onClick={onClose}
        className="
          absolute
          inset-0
          cursor-default
          bg-black/30
          backdrop-blur-[2px]
        "
      />

      {/* Drawer */}
      <aside
        className="
          absolute
          right-0
          top-0
          flex
          h-full
          w-full
          max-w-lg
          flex-col
          border-l
          border-[var(--border)]
          bg-[var(--surface)]
          shadow-2xl
        "
      >
        {/* Header */}
        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-[var(--border)]
            px-6
            py-5
          "
        >
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              User Details
            </h2>

            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Account information and activity.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              text-lg
              text-[var(--foreground-muted)]
              transition
              hover:bg-[var(--background)]
              hover:text-[var(--foreground)]
            "
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex min-h-[300px] items-center justify-center">
              <div className="text-center">
                <div
                  className="
                    mx-auto
                    h-8
                    w-8
                    animate-spin
                    rounded-full
                    border-2
                    border-[var(--border)]
                    border-t-[var(--primary)]
                  "
                />

                <p className="mt-4 text-sm text-[var(--foreground-muted)]">
                  Loading user...
                </p>
              </div>
            </div>
          ) : user ? (
            <div className="space-y-6">
              {/* Profile */}
              <div
                className="
                  flex
                  items-center
                  gap-4
                  rounded-xl
                  border
                  border-[var(--border)]
                  bg-[var(--background)]
                  p-4
                "
              >
                <div
                  className="
                    flex
                    h-12
                    w-12
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-[var(--surface)]
                    text-base
                    font-semibold
                    text-[var(--foreground-muted)]
                  "
                >
                  {user.email.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                    {user.email}
                  </p>

                  <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                    User account
                  </p>
                </div>

                <div className="ml-auto">
                  <StatusBadge status={user.status} />
                </div>
              </div>

              {/* Account */}
              <section>
                <SectionTitle title="Account" />

                <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)]">
                  <InfoRow label="User ID" value={user.id} mono />

                  <InfoRow label="Email" value={user.email} />

                  <InfoRow label="Status" value={user.status} />

                  <InfoRow
                    label="Created"
                    value={formatDateTime(user.createdAt)}
                  />

                  <InfoRow
                    label="Updated"
                    value={formatDateTime(user.updatedAt)}
                  />
                </div>
              </section>

              {/* Verification */}
              <section>
                <SectionTitle title="Verification" />

                <div className="mt-3 overflow-hidden rounded-xl border border-[var(--border)]">
                  <InfoRow
                    label="Account verified"
                    value={user.isVerified ? "Yes" : "No"}
                    valueClassName={
                      user.isVerified
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-amber-600 dark:text-amber-400"
                    }
                  />

                  <InfoRow
                    label="Email verified"
                    value={user.isEmailVerified ? "Yes" : "No"}
                    valueClassName={
                      user.isEmailVerified
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "amber-600"
                    }
                  />
                </div>
              </section>

              {/* Additional information */}
              <section>
                <SectionTitle title="Additional Information" />

                <div className="mt-3 rounded-xl border border-[var(--border)] p-4">
                  <p className="text-sm text-[var(--foreground-muted)]">
                    More account information can be added here as the identity
                    platform grows.
                  </p>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <h3 className="text-sm font-semibold text-[var(--foreground)]">{title}</h3>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
  valueClassName = "",
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueClassName?: string;
}) {
  return (
    <div
      className="
        flex
        items-start
        justify-between
        gap-6
        border-b
        border-[var(--border)]
        px-4
        py-3.5
        last:border-0
      "
    >
      <span className="text-sm text-[var(--foreground-muted)]">{label}</span>

      <span
        className={`
          max-w-[65%]
          break-all
          text-right
          text-sm
          font-medium
          text-[var(--foreground)]
          ${mono ? "font-mono text-xs" : ""}
          ${valueClassName}
        `}
      >
        {value}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: User["status"] }) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        ACTIVE
      </span>
    );
  }

  if (status === "INACTIVE") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        <span className="h-1.5 w-1.5 rounded-full border border-slate-500" />
        INACTIVE
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      SUSPENDED
    </span>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

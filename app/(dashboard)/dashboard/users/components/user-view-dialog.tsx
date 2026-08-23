"use client";

import type { User } from "@/lib/users-api";

type UserViewDialogProps = {
  user: User | null;
  onClose: () => void;
};

export function UserViewDialog({ user, onClose }: UserViewDialogProps) {
  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 px-4">
      <div
        className="
          w-full
          max-w-lg
          rounded-2xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          p-6
          shadow-2xl
        "
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">User details</h2>

            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Account information
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-lg
              px-2
              py-1
              text-lg
              text-[var(--foreground-muted)]
              hover:bg-[var(--background)]
            "
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <p className="text-xs text-[var(--foreground-muted)]">Email</p>

            <p className="mt-1 text-sm font-medium">{user.email}</p>
          </div>

          <div>
            <p className="text-xs text-[var(--foreground-muted)]">Status</p>

            <p className="mt-1 text-sm font-medium">{user.status}</p>
          </div>

          <div>
            <p className="text-xs text-[var(--foreground-muted)]">
              Email verified
            </p>

            <p className="mt-1 text-sm font-medium">
              {user.isEmailVerified ? "Yes" : "No"}
            </p>
          </div>

          <div>
            <p className="text-xs text-[var(--foreground-muted)]">Created</p>

            <p className="mt-1 text-sm font-medium">
              {new Date(user.createdAt).toLocaleString()}
            </p>
          </div>

          <div>
            <p className="text-xs text-[var(--foreground-muted)]">
              Last updated
            </p>

            <p className="mt-1 text-sm font-medium">
              {new Date(user.updatedAt).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="
              rounded-lg
              border
              border-[var(--border)]
              px-4
              py-2
              text-sm
              font-medium
              hover:bg-[var(--background)]
            "
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

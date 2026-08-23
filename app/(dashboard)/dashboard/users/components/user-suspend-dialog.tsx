"use client";

import type { User } from "@/lib/users-api";

type UserSuspendDialogProps = {
  user: User | null;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function UserSuspendDialog({
  user,
  loading = false,
  onConfirm,
  onCancel,
}: UserSuspendDialogProps) {
  if (!user) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 px-4">
      <div
        className="
          w-full
          max-w-md
          rounded-2xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          p-6
          shadow-2xl
        "
      >
        <h2 className="text-lg font-semibold">Suspend user</h2>

        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          Are you sure you want to suspend{" "}
          <span className="font-medium text-[var(--foreground)]">
            {user.email}
          </span>
          ?
        </p>

        <p className="mt-3 text-sm text-[var(--foreground-muted)]">
          The user will no longer be able to use their account until an
          administrator changes their status.
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="
              rounded-lg
              border
              border-[var(--border)]
              px-4
              py-2
              text-sm
              font-medium
              hover:bg-[var(--background)]
              disabled:opacity-50
            "
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="
              rounded-lg
              bg-[var(--danger)]
              px-4
              py-2
              text-sm
              font-medium
              text-white
              hover:opacity-90
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {loading ? "Suspending..." : "Suspend user"}
          </button>
        </div>
      </div>
    </div>
  );
}

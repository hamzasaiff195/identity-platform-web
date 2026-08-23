"use client";

import { useEffect, useState } from "react";

import type { User } from "@/lib/users-api";

type UserEditProps = {
  user: User | null;
  onClose: () => void;
  onSave: (
    userId: string,
    data: {
      email?: string;
    }
  ) => Promise<void>;
};

export function UserEdit({ user, onClose, onSave }: UserEditProps) {
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email);
    }
  }, [user]);

  if (!user) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!user) {
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      return;
    }

    try {
      setSaving(true);

      await onSave(user.id, {
        email: trimmedEmail,
      });
    } catch (error) {
      console.error("[USERS] Edit user failed:", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100000]">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close edit user"
        onClick={onClose}
        disabled={saving}
        className="
          absolute
          inset-0
          cursor-default
          bg-black/30
          backdrop-blur-[2px]
          disabled:cursor-not-allowed
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
              Edit User
            </h2>

            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Update user account information.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
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
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Email */}
              <div>
                <label
                  htmlFor="user-email"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-[var(--foreground)]
                  "
                >
                  Email
                </label>

                <input
                  id="user-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={saving}
                  required
                  className="
                    h-11
                    w-full
                    rounded-lg
                    border
                    border-[var(--border)]
                    bg-[var(--surface)]
                    px-3
                    text-sm
                    text-[var(--foreground)]
                    outline-none
                    placeholder:text-[var(--foreground-muted)]
                    focus:border-[var(--primary)]
                    focus:ring-2
                    focus:ring-[var(--primary)]/10
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                />
              </div>

              {/* Status */}
              <div>
                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-[var(--foreground)]
                  "
                >
                  Current Status
                </label>

                <div
                  className="
                    rounded-lg
                    border
                    border-[var(--border)]
                    bg-[var(--background)]
                    px-3
                    py-3
                    text-sm
                    text-[var(--foreground-muted)]
                  "
                >
                  {user.status}
                </div>

                <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                  Use the Actions menu to activate, deactivate, or suspend the
                  user.
                </p>
              </div>

              {/* ID */}
              <div>
                <label
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                    text-[var(--foreground)]
                  "
                >
                  User ID
                </label>

                <div
                  className="
                    break-all
                    rounded-lg
                    border
                    border-[var(--border)]
                    bg-[var(--background)]
                    px-3
                    py-3
                    font-mono
                    text-xs
                    text-[var(--foreground-muted)]
                  "
                >
                  {user.id}
                </div>
              </div>

              {/* Information */}
              <div
                className="
                  rounded-lg
                  border
                  border-[var(--border)]
                  bg-[var(--background)]
                  px-4
                  py-3
                  text-sm
                  text-[var(--foreground-muted)]
                "
              >
                Changing the email will update the user account immediately.
                Status management is handled separately from the Actions menu.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            className="
              flex
              items-center
              justify-end
              gap-3
              border-t
              border-[var(--border)]
              px-6
              py-4
            "
          >
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="
                rounded-lg
                border
                border-[var(--border)]
                px-4
                py-2.5
                text-sm
                font-medium
                text-[var(--foreground)]
                transition
                hover:bg-[var(--background)]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="
                inline-flex
                min-w-[120px]
                items-center
                justify-center
                rounded-lg
                bg-[var(--primary)]
                px-4
                py-2.5
                text-sm
                font-medium
                text-white
                transition
                hover:opacity-90
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </aside>
    </div>
  );
}

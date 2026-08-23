"use client";

import { Eye, MoreVertical, Pencil, Trash2 } from "lucide-react";

import type { User, UserStatus } from "@/lib/users-api";

import { UserStatusToggle } from "./user-status-toggle";

type UserRowActionsProps = {
  user: User;

  onView: (user: User) => void;

  onEdit: (user: User) => void;

  onStatusChange: (user: User, status: UserStatus) => void;

  onSuspend: (user: User) => void;

  onDelete: (user: User) => void;
};

export function UserRowActions({
  user,
  onView,
  onEdit,
  onStatusChange,
  onSuspend,
  onDelete,
}: UserRowActionsProps) {
  return (
    <div className="flex items-center justify-end gap-1">
      {/* View */}

      <button
        type="button"
        title="View user"
        aria-label="View user"
        onClick={() => onView(user)}
        className="
          inline-flex
          h-8
          w-8
          items-center
          justify-center
          rounded-lg
          text-[var(--foreground-muted)]
          transition
          hover:bg-[var(--background)]
          hover:text-[var(--foreground)]
        "
      >
        <Eye className="h-4 w-4" />
      </button>

      {/* Edit */}

      <button
        type="button"
        title="Edit user"
        aria-label="Edit user"
        onClick={() => onEdit(user)}
        className="
          inline-flex
          h-8
          w-8
          items-center
          justify-center
          rounded-lg
          text-[var(--foreground-muted)]
          transition
          hover:bg-[var(--background)]
          hover:text-[var(--foreground)]
        "
      >
        <Pencil className="h-4 w-4" />
      </button>

      {/* Active / Inactive */}

      <div className="mx-1">
        <UserStatusToggle
          status={user.status}
          onChange={(status) => onStatusChange(user, status)}
        />
      </div>

      {/* More / Suspend */}

      <button
        type="button"
        title="More actions"
        aria-label="More actions"
        onClick={() => onSuspend(user)}
        className="
          inline-flex
          h-8
          w-8
          items-center
          justify-center
          rounded-lg
          text-[var(--foreground-muted)]
          transition
          hover:bg-[var(--background)]
          hover:text-[var(--foreground)]
        "
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {/* Delete */}

      <button
        type="button"
        title="Delete user"
        aria-label="Delete user"
        onClick={() => onDelete(user)}
        className="
          inline-flex
          h-8
          w-8
          items-center
          justify-center
          rounded-lg
          text-[var(--danger)]
          transition
          hover:bg-[var(--danger-soft)]
        "
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

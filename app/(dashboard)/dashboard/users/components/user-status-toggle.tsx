"use client";

import type { UserStatus } from "@/lib/users-api";

type UserStatusToggleProps = {
  status: UserStatus;
  disabled?: boolean;
  onChange: (status: UserStatus) => void;
};

export function UserStatusToggle({
  status,
  disabled = false,
  onChange,
}: UserStatusToggleProps) {
  const isActive = status === "ACTIVE";

  const isSuspended = status === "SUSPENDED";

  function handleClick() {
    if (disabled || isSuspended) {
      return;
    }

    onChange(isActive ? "INACTIVE" : "ACTIVE");
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      aria-label={isActive ? "Deactivate user" : "Activate user"}
      disabled={disabled || isSuspended}
      onClick={handleClick}
      className={`
        relative
        inline-flex
        h-6
        w-11
        shrink-0
        items-center
        rounded-full
        transition
        focus:outline-none
        focus:ring-2
        focus:ring-[var(--primary)]
        focus:ring-offset-2
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${isActive ? "bg-[var(--primary)]" : "bg-[var(--border)]"}
      `}
    >
      <span
        className={`
          inline-block
          h-4
          w-4
          rounded-full
          bg-white
          shadow-sm
          transition
          ${isActive ? "translate-x-6" : "translate-x-1"}
        `}
      />
    </button>
  );
}

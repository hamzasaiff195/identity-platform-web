import type { UserStatus } from "@/lib/users-api";

type UserStatusBadgeProps = {
  status: UserStatus;
};

const statusConfig: Record<
  UserStatus,
  {
    label: string;
    className: string;
  }
> = {
  ACTIVE: {
    label: "Active",
    className: "border-green-500/20 bg-green-500/10 text-green-600",
  },

  INACTIVE: {
    label: "Inactive",
    className: "border-gray-500/20 bg-gray-500/10 text-gray-600",
  },

  SUSPENDED: {
    label: "Suspended",
    className: "border-red-500/20 bg-red-500/10 text-red-600",
  },
};

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`
        inline-flex
        items-center
        rounded-full
        border
        px-2.5
        py-1
        text-xs
        font-medium
        ${config.className}
      `}
    >
      <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />

      {config.label}
    </span>
  );
}

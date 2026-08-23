"use client";

import type { User, UserStatus } from "@/lib/users-api";

import { UserActions } from "./user-action";

type UsersTableProps = {
  users: User[];

  onView: (user: User) => void;

  onEdit: (user: User) => void;

  onStatusChange: (user: User, status: UserStatus) => void;

  onDelete: (user: User) => void;

  onRevokeSessions: (user: User) => void;

  onRestore: (user: User) => void;
};

export function UsersTable({
  users,
  onView,
  onEdit,
  onStatusChange,
  onDelete,
  onRevokeSessions,
  onRestore,
}: UsersTableProps) {
  return (
    <div className="overflow-visible">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Email
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Role
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Status
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              Created Date
            </th>

            <th className="w-20 px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
              Actions
            </th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => {
            const inactive = user.status === "INACTIVE";

            return (
              <tr
                key={user.id}
                className={`
                  border-b
                  border-slate-100
                  transition
                  last:border-0
                  hover:bg-slate-50/70
                  ${inactive ? "text-slate-400" : "text-slate-700"}
                `}
              >
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div
                      className={`
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        text-sm
                        font-semibold
                        ${
                          inactive
                            ? "bg-slate-100 text-slate-400"
                            : "bg-slate-100 text-slate-600"
                        }
                      `}
                    >
                      {user.email.charAt(0).toUpperCase()}
                    </div>

                    <span
                      className={`
                        text-sm
                        font-medium
                        ${inactive ? "text-slate-400" : "text-slate-800"}
                      `}
                    >
                      {user.email}
                    </span>
                  </div>
                </td>

                <td className="px-6 py-5">
                  <span className="text-sm">—</span>
                </td>

                <td className="px-6 py-5">
                  <StatusBadge status={user.status} />
                </td>

                <td className="px-6 py-5">
                  <span className="text-sm">{formatDate(user.createdAt)}</span>
                </td>

                <td className="relative px-6 py-5">
                  <UserActions
                    user={user}
                    onView={onView}
                    onEdit={onEdit}
                    onStatusChange={onStatusChange}
                    onDelete={onDelete}
                    onRevokeSessions={onRevokeSessions}
                    onRestore={onRestore}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {users.length === 0 && (
        <div className="border-t border-slate-100 px-6 py-16 text-center">
          <p className="text-sm font-medium text-slate-900">No users found</p>

          <p className="mt-1 text-sm text-slate-500">
            Try adjusting your search or filters.
          </p>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  if (status === "ACTIVE") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        ACTIVE
      </span>
    );
  }

  if (status === "INACTIVE") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
        <span className="h-1.5 w-1.5 rounded-full border border-slate-400 bg-transparent" />
        INACTIVE
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      SUSPENDED
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

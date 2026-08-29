"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import {
  addTenantMember,
  getTenantMembers,
  removeTenantMember,
  type TenantMember,
} from "@/lib/tenants-api";

import { getUsers, type User } from "@/lib/users-api";

import { useAuth } from "@/providers/auth-provider";

/* ========================================================================== */
/* STATUS CONFIG                                                              */
/* ========================================================================== */

const STATUS_CONFIG: Record<
  TenantMember["user"]["status"],
  {
    label: string;
    className: string;
  }
> = {
  ACTIVE: {
    label: "Active",
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  },

  INACTIVE: {
    label: "Inactive",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },

  SUSPENDED: {
    label: "Suspended",
    className:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  },
};

/* ========================================================================== */
/* PAGE                                                                       */
/* ========================================================================== */

export default function TenantMembersPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const {
    accessToken,
    isSuperAdmin,
    isAdmin,
    loading: authLoading,
  } = useAuth();

  /* ------------------------------------------------------------------------ */
  /* MEMBERS                                                                  */
  /* ------------------------------------------------------------------------ */

  const [members, setMembers] = useState<TenantMember[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [removingUserId, setRemovingUserId] = useState<string | null>(null);

  /* ------------------------------------------------------------------------ */
  /* ADD MEMBER                                                               */
  /* ------------------------------------------------------------------------ */

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [availableUsersLoading, setAvailableUsersLoading] = useState(false);
  const [availableUsersError, setAvailableUsersError] = useState("");

  const [memberSearch, setMemberSearch] = useState("");

  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  /* ------------------------------------------------------------------------ */
  /* LOAD MEMBERS                                                             */
  /* ------------------------------------------------------------------------ */

  const loadMembers = useCallback(async () => {
    if (!accessToken || !tenantId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await getTenantMembers(
        accessToken,
        tenantId,
        page,
        10,
        search
      );

      setMembers(result.members);
      setTotal(result.pagination.total);
      setTotalPages(result.pagination.totalPages);
    } catch (error) {
      console.error("[TENANT MEMBERS] Failed to load members:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load tenant members."
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, tenantId, page, search]);

  /* ------------------------------------------------------------------------ */
  /* INITIAL / PAGINATION / SEARCH LOAD                                      */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void loadMembers();
  }, [authLoading, loadMembers]);

  /* ------------------------------------------------------------------------ */
  /* SEARCH                                                                   */
  /* ------------------------------------------------------------------------ */

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPage(1);
    setSearch(searchInput.trim());
  }

  /* ------------------------------------------------------------------------ */
  /* CLEAR SEARCH                                                             */
  /* ------------------------------------------------------------------------ */

  function handleClearSearch() {
    setSearchInput("");
    setSearch("");
    setPage(1);
  }

  /* ======================================================================== */
  /* ADD MEMBER                                                               */
  /* ======================================================================== */

  async function openAddMemberModal() {
    if (!accessToken || !tenantId) {
      return;
    }

    try {
      setShowAddMemberModal(true);
      setAvailableUsersLoading(true);
      setAvailableUsersError("");
      setMemberSearch("");

      /*
       * Get all global users.
       *
       * This is intentionally NOT getTenantMembers().
       *
       * We need the global User table because the purpose of this
       * modal is to find users who can be added to this tenant.
       */
      const result = await getUsers(accessToken, 1, 100);

      /*
       * Build a Set of users already belonging to this tenant.
       */
      const memberUserIds = new Set(members.map((member) => member.userId));

      /*
       * Only show users who are not already tenant members.
       *
       * Deleted users are also excluded.
       */
      const available = result.users.filter(
        (user) => !user.isDeleted && !memberUserIds.has(user.id)
      );

      setAvailableUsers(available);
    } catch (error) {
      console.error("[TENANT MEMBERS] Failed to load available users:", error);

      setAvailableUsersError(
        error instanceof Error
          ? error.message
          : "Unable to load available users."
      );
    } finally {
      setAvailableUsersLoading(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* ADD MEMBER                                                               */
  /* ------------------------------------------------------------------------ */

  async function handleAddMember(user: User) {
    if (!accessToken || !tenantId) {
      return;
    }

    try {
      setAddingUserId(user.id);
      setAvailableUsersError("");

      await addTenantMember(accessToken, tenantId, user.id);

      /*
       * Remove the user immediately from the available-user list.
       */
      setAvailableUsers((currentUsers) =>
        currentUsers.filter((currentUser) => currentUser.id !== user.id)
      );

      /*
       * Close modal after successful addition.
       */
      setShowAddMemberModal(false);

      /*
       * Reload tenant members so the new membership appears
       * and pagination/count remain authoritative.
       */
      await loadMembers();
    } catch (error) {
      console.error("[TENANT MEMBERS] Failed to add member:", error);

      setAvailableUsersError(
        error instanceof Error ? error.message : "Unable to add user to tenant."
      );
    } finally {
      setAddingUserId(null);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* REMOVE MEMBER                                                            */
  /* ------------------------------------------------------------------------ */

  async function handleRemoveMember(member: TenantMember) {
    if (!accessToken || !tenantId) {
      return;
    }

    const confirmed = window.confirm(
      `Remove ${member.user.email} from this tenant?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setRemovingUserId(member.userId);
      setError("");

      await removeTenantMember(accessToken, tenantId, member.userId);

      /*
       * Optimistically remove the member from the UI.
       */
      setMembers((current) =>
        current.filter((item) => item.userId !== member.userId)
      );

      /*
       * Reload authoritative data.
       */
      await loadMembers();
    } catch (error) {
      console.error("[TENANT MEMBERS] Failed to remove member:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to remove tenant member."
      );
    } finally {
      setRemovingUserId(null);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* FILTER AVAILABLE USERS                                                   */
  /* ------------------------------------------------------------------------ */

  const filteredAvailableUsers = useMemo(() => {
    const normalizedSearch = memberSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return availableUsers;
    }

    return availableUsers.filter((user) =>
      user.email.toLowerCase().includes(normalizedSearch)
    );
  }, [availableUsers, memberSearch]);

  /* ------------------------------------------------------------------------ */
  /* AUTH LOADING                                                             */
  /* ------------------------------------------------------------------------ */

  if (authLoading) {
    return (
      <main className="identity-page min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <div className="identity-surface rounded-2xl p-8">
            <p className="identity-muted text-sm">Loading...</p>
          </div>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* FRONTEND ACCESS CHECK                                                    */
  /* ------------------------------------------------------------------------ */

  if (!isSuperAdmin && !isAdmin) {
    return (
      <main className="identity-page flex min-h-screen items-center justify-center p-6">
        <div className="identity-surface w-full max-w-md rounded-2xl p-8 text-center">
          <h1 className="text-xl font-semibold">Access denied</h1>

          <p className="identity-muted mt-2 text-sm">
            You do not have permission to manage tenant members.
          </p>

          <Link
            href="/dashboard"
            className="identity-button-primary mt-6 inline-block rounded-xl px-4 py-3 text-sm font-medium"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* PAGE                                                                     */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="identity-page min-h-screen p-6">
      <div className="mx-auto max-w-7xl">
        {/* ---------------------------------------------------------------- */}
        {/* HEADER                                                           */}
        {/* ---------------------------------------------------------------- */}

        <div className="mb-8">
          <Link
            href={`/dashboard/tenants/${tenantId}`}
            className="identity-muted text-sm hover:text-[var(--foreground)]"
          >
            ← Tenant administration
          </Link>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="identity-eyebrow">Tenant administration</p>

              <h1 className="mt-2 text-2xl font-semibold">Members</h1>

              <p className="identity-muted mt-1 text-sm">
                Manage users who belong to this tenant.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-sm text-[var(--foreground-muted)]">
                {total} {total === 1 ? "member" : "members"}
              </div>

              {/* ADD MEMBER BUTTON */}
              <button
                type="button"
                onClick={openAddMemberModal}
                className="identity-button-primary rounded-xl px-4 py-2.5 text-sm font-medium"
              >
                + Add Member
              </button>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* ERROR                                                            */}
        {/* ---------------------------------------------------------------- */}

        {error && (
          <div className="mb-6 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* SEARCH                                                           */}
        {/* ---------------------------------------------------------------- */}

        <div className="identity-surface mb-6 rounded-2xl p-4">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search members by email..."
              className="identity-input flex-1"
            />

            <button
              type="submit"
              className="identity-button-primary rounded-xl px-5 py-2.5 text-sm font-medium"
            >
              Search
            </button>

            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* MEMBERS TABLE                                                    */}
        {/* ---------------------------------------------------------------- */}

        <div className="identity-surface overflow-hidden rounded-2xl">
          {loading ? (
            <div className="p-8 text-center">
              <p className="identity-muted text-sm">
                Loading tenant members...
              </p>
            </div>
          ) : members.length === 0 ? (
            <div className="p-10 text-center">
              <h2 className="text-base font-semibold">No members found</h2>

              <p className="identity-muted mt-2 text-sm">
                {search
                  ? "No members match your search."
                  : "This tenant currently has no members."}
              </p>

              <button
                type="button"
                onClick={openAddMemberModal}
                className="identity-button-primary mt-5 rounded-xl px-4 py-2.5 text-sm font-medium"
              >
                + Add Member
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-left">
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
                        Member
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
                        Status
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
                        Email verification
                      </th>

                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
                        Joined
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[var(--foreground-subtle)]">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {members.map((member) => (
                      <TenantMemberRow
                        key={member.id}
                        member={member}
                        removing={removingUserId === member.userId}
                        onRemove={() => handleRemoveMember(member)}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ---------------------------------------------------------- */}
              {/* PAGINATION                                                  */}
              {/* ---------------------------------------------------------- */}

              <div className="flex flex-col gap-3 border-t border-[var(--border)] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-[var(--foreground-muted)]">
                  Page {page} of {totalPages}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1 || loading}
                    onClick={() => setPage((current) => current - 1)}
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[var(--surface-hover)]"
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    disabled={page >= totalPages || loading}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[var(--surface-hover)]"
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* ADD MEMBER MODAL                                                   */}
      {/* ================================================================== */}

      {showAddMemberModal && (
        <AddMemberModal
          users={filteredAvailableUsers}
          search={memberSearch}
          loading={availableUsersLoading}
          error={availableUsersError}
          addingUserId={addingUserId}
          onSearchChange={setMemberSearch}
          onAdd={handleAddMember}
          onClose={() => {
            if (!addingUserId) {
              setShowAddMemberModal(false);
            }
          }}
        />
      )}
    </main>
  );
}

/* ========================================================================== */
/* ADD MEMBER MODAL                                                           */
/* ========================================================================== */

function AddMemberModal({
  users,
  search,
  loading,
  error,
  addingUserId,
  onSearchChange,
  onAdd,
  onClose,
}: {
  users: User[];
  search: string;
  loading: boolean;
  error: string;
  addingUserId: string | null;
  onSearchChange: (value: string) => void;
  onAdd: (user: User) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !addingUserId) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        {/* Header */}

        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Add Member
            </h2>

            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Select an existing user to add to this tenant.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(addingUserId)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-[var(--foreground-muted)] hover:bg-[var(--background)] hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Search */}

        <div className="border-b border-[var(--border)] px-6 py-4">
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search users by email..."
            autoFocus
            className="identity-input w-full"
          />
        </div>

        {/* Error */}

        {error && (
          <div className="mx-6 mt-4 rounded-lg border border-[var(--danger)]/20 bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        {/* Users */}

        <div className="max-h-[420px] overflow-y-auto p-3">
          {loading ? (
            <div className="p-8 text-center">
              <p className="identity-muted text-sm">
                Loading available users...
              </p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium text-[var(--foreground)]">
                No available users
              </p>

              <p className="identity-muted mt-1 text-xs">
                {search
                  ? "No users match your search."
                  : "All existing users are already members of this tenant."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => {
                const adding = addingUserId === user.id;

                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] p-3 transition hover:bg-[var(--background)]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary-soft)] text-xs font-semibold text-[var(--primary)]">
                        {user.email.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--foreground)]">
                          {user.email}
                        </p>

                        <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                          {user.status}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onAdd(user)}
                      disabled={Boolean(addingUserId)}
                      className="shrink-0 rounded-lg bg-[var(--primary)] px-3 py-2 text-xs font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {adding ? "Adding..." : "Add"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}

        <div className="flex justify-end border-t border-[var(--border)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(addingUserId)}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* MEMBER ROW                                                                 */
/* ========================================================================== */

function TenantMemberRow({
  member,
  removing,
  onRemove,
}: {
  member: TenantMember;
  removing: boolean;
  onRemove: () => void;
}) {
  return (
    <tr className="border-b border-[var(--border)] last:border-b-0">
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary-soft)] text-sm font-semibold text-[var(--primary)]">
            {member.user.email.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--foreground)]">
              {member.user.email}
            </p>

            <p className="mt-0.5 font-mono text-[10px] text-[var(--foreground-subtle)]">
              {member.userId}
            </p>
          </div>
        </div>
      </td>

      <td className="px-6 py-5">
        <AccountStatusBadge status={member.user.status} />
      </td>

      <td className="px-6 py-5">
        <VerificationBadge verified={member.user.isEmailVerified} />
      </td>

      <td className="px-6 py-5">
        <span className="text-sm text-[var(--foreground-muted)]">
          {formatDate(member.joinedAt)}
        </span>
      </td>

      <td className="px-6 py-5 text-right">
        <button
          type="button"
          onClick={onRemove}
          disabled={removing}
          className="rounded-lg border border-[var(--danger)]/20 px-3 py-2 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {removing ? "Removing..." : "Remove"}
        </button>
      </td>
    </tr>
  );
}

/* ========================================================================== */
/* STATUS BADGE                                                               */
/* ========================================================================== */

function AccountStatusBadge({
  status,
}: {
  status: TenantMember["user"]["status"];
}) {
  const current = STATUS_CONFIG[status];

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-2
        rounded-full
        px-3
        py-1.5
        text-xs
        font-medium
        ${current.className}
      `}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {current.label}
    </span>
  );
}

/* ========================================================================== */
/* VERIFICATION BADGE                                                         */
/* ========================================================================== */

function VerificationBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`
        inline-flex
        items-center
        gap-2
        rounded-full
        px-3
        py-1.5
        text-xs
        font-medium
        ${
          verified
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
        }
      `}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {verified ? "Verified" : "Unverified"}
    </span>
  );
}

/* ========================================================================== */
/* DATE                                                                       */
/* ========================================================================== */

function formatDate(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

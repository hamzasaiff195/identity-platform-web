"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/providers/auth-provider";

import {
  createUser,
  deleteUser,
  getUser,
  getUsers,
  restoreUser,
  updateUser,
  revokeUserSessions,
  updateUserStatus,
  type User,
  type UserStatus,
  type UsersPagination,
} from "@/lib/users-api";

import { UserActions } from "./components/user-action";

export default function UsersPage() {
  const { accessToken } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Pagination.
   */
  const [pagination, setPagination] = useState<UsersPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  /*
   * User modal state.
   */
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userModal, setUserModal] = useState<"view" | "edit" | null>(null);

  /*
   * Add user modal.
   */
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  /*
   * Load users.
   */
  async function loadUsers(pageValue = pagination.page, searchValue = search) {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await getUsers(
        accessToken,
        pageValue,
        pagination.limit,
        searchValue
      );

      setUsers(result.users);
      setPagination(result.pagination);
    } catch (error) {
      console.error("[USERS] Failed to load users:", error);

      setError(error instanceof Error ? error.message : "Unable to load users");
    } finally {
      setLoading(false);
    }
  }

  /*
   * Initial load.
   */
  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    loadUsers(1, "");
  }, [accessToken]);

  /*
   * Search.
   *
   * Every new search starts from page 1.
   */
  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();

    loadUsers(1, search);
  }

  /*
   * Previous page.
   */
  function handlePreviousPage() {
    if (!pagination.hasPreviousPage || loading) {
      return;
    }

    loadUsers(pagination.page - 1, search);
  }

  /*
   * Next page.
   */
  function handleNextPage() {
    if (!pagination.hasNextPage || loading) {
      return;
    }

    loadUsers(pagination.page + 1, search);
  }

  /*
   * Create user.
   */
  async function handleCreateUser(data: { email: string; password: string }) {
    if (!accessToken) {
      return;
    }

    try {
      setError("");

      await createUser(accessToken, data);

      setShowAddUserModal(false);

      /*
       * Reload first page so the newly-created user
       * appears according to backend ordering.
       */
      await loadUsers(1, search);

      console.log("[USERS] User created");
    } catch (error) {
      console.error("[USERS] Failed to create user:", error);

      throw error;
    }
  }

  /*
   * View user.
   *
   * Fetch latest data from API before opening modal.
   */
  async function handleView(user: User) {
    if (!accessToken) {
      return;
    }

    try {
      setError("");

      const result = await getUser(accessToken, user.id);

      setSelectedUser(result);
      setUserModal("view");
    } catch (error) {
      console.error("[USERS] Failed to load user:", error);

      setError(
        error instanceof Error ? error.message : "Unable to load user details"
      );
    }
  }

  /*
   * Edit user.
   */
  function handleEdit(user: User) {
    setSelectedUser(user);
    setUserModal("edit");
  }

  /*
   * Update user.
   */
  async function handleUpdateUser(
    userId: string,
    data: {
      email?: string;
      password?: string;
    }
  ) {
    if (!accessToken) {
      return;
    }

    try {
      setError("");

      const result = await updateUser(accessToken, userId, data);

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === userId
            ? {
                ...currentUser,
                ...result.user,
              }
            : currentUser
        )
      );

      setSelectedUser((currentUser) =>
        currentUser?.id === userId
          ? {
              ...currentUser,
              ...result.user,
            }
          : currentUser
      );

      console.log("[USERS] User updated:", result.user);
    } catch (error) {
      console.error("[USERS] Failed to update user:", error);

      setError(
        error instanceof Error ? error.message : "Unable to update user"
      );

      throw error;
    }
  }

  /*
   * Update user status.
   */
  async function handleStatusChange(user: User, status: UserStatus) {
    if (!accessToken) {
      return;
    }

    if (user.status === status) {
      return;
    }

    try {
      setError("");

      const result = await updateUserStatus(accessToken, user.id, status);

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                ...result.user,
              }
            : currentUser
        )
      );

      setSelectedUser((currentUser) =>
        currentUser?.id === user.id
          ? {
              ...currentUser,
              ...result.user,
            }
          : currentUser
      );

      console.log("[USERS] Status updated:", result.user);
    } catch (error) {
      console.error("[USERS] Failed to update status:", error);

      setError(
        error instanceof Error ? error.message : "Unable to update user status"
      );
    }
  }

  /*
   * Revoke all sessions.
   */
  async function handleRevokeSessions(user: User) {
    if (!accessToken) {
      return;
    }

    try {
      setError("");

      const result = await revokeUserSessions(accessToken, user.id);

      console.log("[USERS] Sessions revoked:", result);
    } catch (error) {
      console.error("[USERS] Failed to revoke sessions:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to revoke user sessions"
      );
    }
  }

  /*
   * Delete user.
   */
  async function handleDelete(user: User) {
    if (!accessToken) {
      return;
    }

    try {
      setError("");

      await deleteUser(accessToken, user.id);

      /*
       * Close modal if this user is currently open.
       */
      if (selectedUser?.id === user.id) {
        closeUserModal();
      }

      /*
       * Reload current page.
       *
       * If this was the last user on the page,
       * move back one page when possible.
       */
      if (users.length === 1 && pagination.hasPreviousPage) {
        await loadUsers(pagination.page - 1, search);
      } else {
        await loadUsers(pagination.page, search);
      }

      console.log("[USERS] User deleted:", user.id);
    } catch (error) {
      console.error("[USERS] Failed to delete user:", error);

      setError(
        error instanceof Error ? error.message : "Unable to delete user"
      );
    }
  }

  /*
   * Restore user.
   */
  async function handleRestore(user: User) {
    if (!accessToken) {
      return;
    }

    try {
      setError("");

      const restoredUser = await restoreUser(accessToken, user.id);

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                ...restoredUser,
              }
            : currentUser
        )
      );

      setSelectedUser((currentUser) =>
        currentUser?.id === user.id
          ? {
              ...currentUser,
              ...restoredUser,
            }
          : currentUser
      );

      console.log("[USERS] User restored:", restoredUser);
    } catch (error) {
      console.error("[USERS] Failed to restore user:", error);

      setError(
        error instanceof Error ? error.message : "Unable to restore user"
      );
    }
  }

  /*
   * Close user modal.
   */
  function closeUserModal() {
    setSelectedUser(null);
    setUserModal(null);
  }

  /*
   * Initial loading state.
   */
  if (loading && users.length === 0) {
    return (
      <main className="min-h-full bg-[var(--background)] p-6 lg:p-8">
        <div className="flex min-h-[400px] items-center justify-center">
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
              Loading users...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-[var(--background)] p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Users
          </h1>

          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Manage users in your identity platform.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddUserModal(true)}
          className="
            inline-flex
            items-center
            gap-2
            rounded-lg
            bg-[var(--primary)]
            px-4
            py-2.5
            text-sm
            font-medium
            text-white
            transition
            hover:opacity-90
          "
        >
          <span className="text-base">+</span>
          Add User
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-4 flex items-center justify-between gap-4">
        <form
          onSubmit={handleSearchSubmit}
          className="flex w-full max-w-md gap-2"
        >
          <div className="relative flex-1">
            <span
              className="
                pointer-events-none
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-[var(--foreground-muted)]
              "
            >
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search users by email..."
              className="
                h-10
                w-full
                rounded-lg
                border
                border-[var(--border)]
                bg-[var(--surface)]
                pl-9
                pr-3
                text-sm
                text-[var(--foreground)]
                outline-none
                placeholder:text-[var(--foreground-muted)]
                focus:border-[var(--primary)]
                focus:ring-2
                focus:ring-[var(--primary)]/10
              "
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="
              h-10
              rounded-lg
              border
              border-[var(--border)]
              bg-[var(--surface)]
              px-4
              text-sm
              font-medium
              text-[var(--foreground)]
              hover:bg-[var(--background)]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Search
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div
          className="
            mb-4
            rounded-lg
            border
            border-[var(--danger)]
            bg-[var(--danger-soft)]
            px-4
            py-3
            text-sm
            text-[var(--danger)]
          "
        >
          {error}
        </div>
      )}

      {/* Users table */}
      <section
        className="
          flex
          h-[calc(100vh-260px)]
          min-h-[400px]
          flex-col
          overflow-hidden
          rounded-xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          shadow-[var(--shadow-sm)]
        "
      >
        {/* Scrollable table area */}
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="sticky top-0 z-10 bg-[var(--surface)]">
              <tr className="border-b border-[var(--border)]">
                <TableHeader>Email</TableHeader>
                <TableHeader>Role</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Email Verified</TableHeader>
                <TableHeader>User Verified</TableHeader>
                <TableHeader>Created Date</TableHeader>

                <th
                  className="
                    px-6
                    py-4
                    text-right
                    text-xs
                    font-semibold
                    uppercase
                    tracking-wide
                    text-[var(--foreground-muted)]
                  "
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onView={handleView}
                  onEdit={handleEdit}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  onRestore={handleRestore}
                  onRevokeSessions={handleRevokeSessions}
                />
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="px-6 py-16 text-center">
              <p className="text-sm text-[var(--foreground-muted)]">
                No users found.
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.total > 0 && (
          <div
            className="
              shrink-0
              border-t
              border-[var(--border)]
              bg-[var(--surface)]
              px-6
              py-4
            "
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-[var(--foreground-muted)]">
                Showing{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {pagination.total}
                </span>{" "}
                users
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={!pagination.hasPreviousPage || loading}
                  className="
                    rounded-lg
                    border
                    border-[var(--border)]
                    bg-[var(--surface)]
                    px-3
                    py-2
                    text-sm
                    font-medium
                    text-[var(--foreground)]
                    transition
                    hover:bg-[var(--background)]
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  Previous
                </button>

                <span className="min-w-[100px] text-center text-sm text-[var(--foreground-muted)]">
                  Page{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {pagination.page}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {pagination.totalPages}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={!pagination.hasNextPage || loading}
                  className="
                    rounded-lg
                    border
                    border-[var(--border)]
                    bg-[var(--surface)]
                    px-3
                    py-2
                    text-sm
                    font-medium
                    text-[var(--foreground)]
                    transition
                    hover:bg-[var(--background)]
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page loading indicator */}
        {loading && users.length > 0 && (
          <div
            className="
              shrink-0
              border-t
              border-[var(--border)]
              bg-[var(--surface)]
              px-6
              py-2
              text-center
              text-xs
              text-[var(--foreground-muted)]
            "
          >
            Loading...
          </div>
        )}
      </section>

      {/* View / Edit user modal */}
      {selectedUser && userModal && (
        <UserModal
          user={selectedUser}
          mode={userModal}
          onClose={closeUserModal}
          onUpdate={handleUpdateUser}
        />
      )}

      {/* Add user modal */}
      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onCreate={handleCreateUser}
        />
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Table Header                                                               */
/* -------------------------------------------------------------------------- */

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="
        px-6
        py-4
        text-left
        text-xs
        font-semibold
        uppercase
        tracking-wide
        text-[var(--foreground-muted)]
      "
    >
      {children}
    </th>
  );
}

/* -------------------------------------------------------------------------- */
/* User Row                                                                   */
/* -------------------------------------------------------------------------- */

type UserRowProps = {
  user: User;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onStatusChange: (user: User, status: UserStatus) => void;
  onDelete: (user: User) => void;
  onRestore: (user: User) => void;
  onRevokeSessions: (user: User) => void;
};

function UserRow({
  user,
  onView,
  onEdit,
  onStatusChange,
  onDelete,
  onRestore,
  onRevokeSessions,
}: UserRowProps) {
  const isInactive = user.status === "INACTIVE";

  return (
    <tr
      className={`
        border-b
        border-[var(--border)]
        last:border-0
        transition-colors
        hover:bg-[var(--background)]
        ${isInactive ? "opacity-60" : ""}
      `}
    >
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[var(--background)]
              text-xs
              font-semibold
              text-[var(--foreground-muted)]
            "
          >
            {user.email.charAt(0).toUpperCase()}
          </div>

          <span className="text-sm font-medium text-[var(--foreground)]">
            {user.email}
          </span>
        </div>
      </td>

      <td className="px-6 py-5">
        <span className="text-sm text-[var(--foreground-muted)]">User</span>
      </td>

      <td className="px-6 py-5">
        <StatusBadge status={user.status} />
      </td>

      <td className="px-6 py-5">
        <VerificationBadge verified={user.isEmailVerified} />
      </td>

      <td className="px-6 py-5">
        <VerificationBadge verified={user.isVerified} />
      </td>

      <td className="px-6 py-5">
        <span className="text-sm text-[var(--foreground-muted)]">
          {new Date(user.createdAt).toLocaleDateString()}
        </span>
      </td>

      <td className="px-6 py-5">
        <UserActions
          user={user}
          onView={onView}
          onEdit={onEdit}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
          onRestore={onRestore}
          onRevokeSessions={onRevokeSessions}
        />
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Status Badge                                                               */
/* -------------------------------------------------------------------------- */

function StatusBadge({ status }: { status: UserStatus }) {
  if (status === "ACTIVE") {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-2
          rounded-full
          bg-emerald-50
          px-3
          py-1.5
          text-xs
          font-medium
          text-emerald-700
          dark:bg-emerald-950/40
          dark:text-emerald-400
        "
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        ACTIVE
      </span>
    );
  }

  if (status === "INACTIVE") {
    return (
      <span
        className="
          inline-flex
          items-center
          gap-2
          rounded-full
          bg-slate-100
          px-3
          py-1.5
          text-xs
          font-medium
          text-slate-600
          dark:bg-slate-800
          dark:text-slate-400
        "
      >
        <span className="h-1.5 w-1.5 rounded-full border border-slate-500" />
        INACTIVE
      </span>
    );
  }

  return (
    <span
      className="
        inline-flex
        items-center
        gap-2
        rounded-full
        bg-amber-50
        px-3
        py-1.5
        text-xs
        font-medium
        text-amber-700
        dark:bg-amber-950/40
        dark:text-amber-400
      "
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      SUSPENDED
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Verification Badge                                                         */
/* -------------------------------------------------------------------------- */

function VerificationBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`
        inline-flex
        items-center
        gap-2
        text-sm
        font-medium
        ${
          verified
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-amber-600 dark:text-amber-400"
        }
      `}
      title={verified ? "Verified" : "Verification pending"}
    >
      <span
        className={`
          flex
          h-5
          w-5
          items-center
          justify-center
          rounded-full
          text-xs
          font-bold
          ${
            verified
              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
              : "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
          }
        `}
      >
        {verified ? "✓" : "!"}
      </span>

      <span>{verified ? "Verified" : "Pending"}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* User Modal                                                                 */
/* -------------------------------------------------------------------------- */

type UserModalProps = {
  user: User;
  mode: "view" | "edit";
  onClose: () => void;
  onUpdate: (
    userId: string,
    data: {
      email?: string;
      password?: string;
    }
  ) => Promise<void>;
};

function UserModal({ user, mode, onClose, onUpdate }: UserModalProps) {
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  useEffect(() => {
    setEmail(user.email);
    setPassword("");
    setModalError("");
  }, [user]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (mode !== "edit") {
      return;
    }

    if (!email.trim()) {
      setModalError("Email is required");
      return;
    }

    try {
      setSaving(true);
      setModalError("");

      const data: {
        email?: string;
        password?: string;
      } = {
        email: email.trim(),
      };

      if (password.trim()) {
        data.password = password;
      }

      await onUpdate(user.id, data);

      onClose();
    } catch (error) {
      setModalError(
        error instanceof Error ? error.message : "Unable to update user"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[100000]
        flex
        items-center
        justify-center
        bg-black/40
        p-4
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div
        className="
          w-full
          max-w-lg
          rounded-xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          shadow-2xl
        "
      >
        {/* Modal header */}
        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-[var(--border)]
            px-6
            py-4
          "
        >
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              {mode === "view" ? "User Details" : "Edit User"}
            </h2>

            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              {user.email}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              text-lg
              text-[var(--foreground-muted)]
              hover:bg-[var(--background)]
              hover:text-[var(--foreground)]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            ×
          </button>
        </div>

        {/* View */}
        {mode === "view" ? (
          <>
            <div className="space-y-4 px-6 py-6">
              <UserDetail label="User ID" value={user.id} />

              <UserDetail label="Email" value={user.email} />

              <UserDetail label="Status" value={user.status} />

              <UserDetail
                label="Email Verified"
                value={user.isEmailVerified ? "Yes" : "No"}
              />

              <UserDetail
                label="User Verified"
                value={user.isVerified ? "Yes" : "No"}
              />

              <UserDetail
                label="Created"
                value={new Date(user.createdAt).toLocaleString()}
              />

              <UserDetail
                label="Updated"
                value={new Date(user.updatedAt).toLocaleString()}
              />
            </div>

            <div
              className="
                flex
                justify-end
                border-t
                border-[var(--border)]
                px-6
                py-4
              "
            >
              <button
                type="button"
                onClick={onClose}
                className="
                  rounded-lg
                  border
                  border-[var(--border)]
                  bg-[var(--surface)]
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-[var(--foreground)]
                  hover:bg-[var(--background)]
                "
              >
                Close
              </button>
            </div>
          </>
        ) : (
          /* Edit */
          <form onSubmit={handleSubmit}>
            <div className="space-y-5 px-6 py-6">
              {modalError && (
                <div
                  className="
                    rounded-lg
                    border
                    border-[var(--danger)]
                    bg-[var(--danger-soft)]
                    px-4
                    py-3
                    text-sm
                    text-[var(--danger)]
                  "
                >
                  {modalError}
                </div>
              )}

              <div>
                <label
                  htmlFor="edit-user-email"
                  className="mb-2 block text-sm font-medium text-[var(--foreground)]"
                >
                  Email
                </label>

                <input
                  id="edit-user-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={saving}
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
                    focus:border-[var(--primary)]
                    focus:ring-2
                    focus:ring-[var(--primary)]/10
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                />
              </div>

              <div>
                <label
                  htmlFor="edit-user-password"
                  className="mb-2 block text-sm font-medium text-[var(--foreground)]"
                >
                  New Password
                </label>

                <input
                  id="edit-user-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={saving}
                  placeholder="Leave empty to keep current password"
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

              <UserDetail label="Status" value={user.status} />

              <UserDetail
                label="Email Verified"
                value={user.isEmailVerified ? "Yes" : "No"}
              />

              <UserDetail
                label="User Verified"
                value={user.isVerified ? "Yes" : "No"}
              />
            </div>

            <div
              className="
                flex
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
                  bg-[var(--surface)]
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-[var(--foreground)]
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
                  rounded-lg
                  bg-[var(--primary)]
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-white
                  transition
                  hover:opacity-90
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Add User Modal                                                             */
/* -------------------------------------------------------------------------- */

type AddUserModalProps = {
  onClose: () => void;
  onCreate: (data: { email: string; password: string }) => Promise<void>;
};

function AddUserModal({ onClose, onCreate }: AddUserModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setModalError("Email is required");
      return;
    }

    if (!password) {
      setModalError("Password is required");
      return;
    }

    if (password.length < 8) {
      setModalError("Password must be at least 8 characters");
      return;
    }

    try {
      setSaving(true);
      setModalError("");

      await onCreate({
        email: normalizedEmail,
        password,
      });

      setEmail("");
      setPassword("");
    } catch (error) {
      setModalError(
        error instanceof Error ? error.message : "Unable to create user"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-[100000]
        flex
        items-center
        justify-center
        bg-black/40
        p-4
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) {
          onClose();
        }
      }}
    >
      <div
        className="
          w-full
          max-w-lg
          rounded-xl
          border
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
            py-4
          "
        >
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Add User
            </h2>

            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Create a new user account.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              text-lg
              text-[var(--foreground-muted)]
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
        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            {modalError && (
              <div
                className="
                  rounded-lg
                  border
                  border-[var(--danger)]
                  bg-[var(--danger-soft)]
                  px-4
                  py-3
                  text-sm
                  text-[var(--danger)]
                "
              >
                {modalError}
              </div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="add-user-email"
                className="mb-2 block text-sm font-medium text-[var(--foreground)]"
              >
                Email
              </label>

              <input
                id="add-user-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={saving}
                autoComplete="email"
                placeholder="user@example.com"
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

            {/* Password */}
            <div>
              <label
                htmlFor="add-user-password"
                className="mb-2 block text-sm font-medium text-[var(--foreground)]"
              >
                Password
              </label>

              <input
                id="add-user-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={saving}
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
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

              <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                The user will receive an email verification message after
                creation.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            className="
              flex
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
                bg-[var(--surface)]
                px-4
                py-2
                text-sm
                font-medium
                text-[var(--foreground)]
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
                rounded-lg
                bg-[var(--primary)]
                px-4
                py-2
                text-sm
                font-medium
                text-white
                transition
                hover:opacity-90
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {saving ? "Creating..." : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* User Detail                                                                */
/* -------------------------------------------------------------------------- */

function UserDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-6">
      <span className="text-sm font-medium text-[var(--foreground-muted)]">
        {label}
      </span>

      <span className="max-w-[65%] break-all text-right text-sm text-[var(--foreground)]">
        {value}
      </span>
    </div>
  );
}

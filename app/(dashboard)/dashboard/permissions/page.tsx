"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/providers/auth-provider";
import {
  deletePermission,
  getPermission,
  getPermissions,
  type Permission,
} from "@/lib/permissions-api";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 10;

export default function PermissionsPage() {
  const { accessToken } = useAuth();

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");

  const [page, setPage] = useState(1);

  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);

  const [viewLoading, setViewLoading] = useState(false);

  // ---------------------------------------------------------------------------
  // Load permissions
  // ---------------------------------------------------------------------------

  const loadPermissions = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await getPermissions(accessToken);

      setPermissions(result);
    } catch (error) {
      console.error("[PERMISSIONS] Failed to load permissions:", error);

      setError(
        error instanceof Error ? error.message : "Unable to load permissions"
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  // ---------------------------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // ---------------------------------------------------------------------------
  // Search + pagination
  // ---------------------------------------------------------------------------

  const filteredPermissions = useMemo(() => {
    const value = searchValue.trim().toLowerCase();

    if (!value) {
      return permissions;
    }

    return permissions.filter((permission) => {
      return (
        permission.name.toLowerCase().includes(value) ||
        permission.slug.toLowerCase().includes(value) ||
        permission.resource.toLowerCase().includes(value) ||
        permission.action.toLowerCase().includes(value) ||
        (permission.description ?? "").toLowerCase().includes(value)
      );
    });
  }, [permissions, searchValue]);

  const total = filteredPermissions.length;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const currentPage = Math.min(page, totalPages);

  const paginatedPermissions = filteredPermissions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();

    setPage(1);
    setSearchValue(search.trim());
  }

  // ---------------------------------------------------------------------------
  // Refresh
  // ---------------------------------------------------------------------------

  function handleRefresh() {
    loadPermissions();
  }

  // ---------------------------------------------------------------------------
  // View permission
  // ---------------------------------------------------------------------------

  async function handleViewPermission(permissionId: string) {
    if (!accessToken) {
      return;
    }

    try {
      setViewLoading(true);
      setError("");

      const permission = await getPermission(accessToken, permissionId);

      setSelectedPermission(permission);
    } catch (error) {
      console.error("[PERMISSIONS] Failed to load permission:", error);

      setError(
        error instanceof Error ? error.message : "Unable to load permission"
      );
    } finally {
      setViewLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  async function handleDeletePermission(permission: Permission) {
    if (!accessToken) {
      return;
    }

    const confirmed = window.confirm(`Delete permission "${permission.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deletePermission(accessToken, permission.id);

      setSelectedPermission(null);

      await loadPermissions();

      setPage(1);
    } catch (error) {
      console.error("[PERMISSIONS] Failed to delete permission:", error);

      setError(
        error instanceof Error ? error.message : "Unable to delete permission"
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (loading && permissions.length === 0) {
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
              Loading permissions...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-full bg-[var(--background)] p-6 lg:p-8">
      {/* ------------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------------ */}

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--primary)]">
            Authorization
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
            Permissions
          </h1>

          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Manage system permissions and resource actions.
          </p>
        </div>

        <Link href="/dashboard/permissions/new">
          <Button>Create permission</Button>
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Toolbar */}
      {/* ------------------------------------------------------------------ */}

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
              placeholder="Search permissions by name, slug, resource..."
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
              transition
              hover:bg-[var(--background)]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Search
          </button>
        </form>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="
            hidden
            h-10
            rounded-lg
            border
            border-[var(--border)]
            bg-[var(--surface)]
            px-4
            text-sm
            font-medium
            text-[var(--foreground)]
            transition
            hover:bg-[var(--background)]
            disabled:cursor-not-allowed
            disabled:opacity-50
            sm:block
          "
        >
          Refresh
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Error */}
      {/* ------------------------------------------------------------------ */}

      {error && (
        <div
          className="
            mb-4
            flex
            items-center
            justify-between
            gap-4
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
          <span>{error}</span>

          <button
            type="button"
            onClick={handleRefresh}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Table */}
      {/* ------------------------------------------------------------------ */}

      <section
        className="
          flex
          h-[calc(100vh-300px)]
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
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="sticky top-0 z-10 bg-[var(--surface)]">
              <tr className="border-b border-[var(--border)]">
                <TableHeader>Permission</TableHeader>
                <TableHeader>Resource</TableHeader>
                <TableHeader>Action</TableHeader>
                <TableHeader>Status</TableHeader>
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
              {paginatedPermissions.map((permission) => (
                <PermissionRow
                  key={permission.id}
                  permission={permission}
                  onView={handleViewPermission}
                />
              ))}
            </tbody>
          </table>

          {/* Empty state */}

          {paginatedPermissions.length === 0 && (
            <div className="px-6 py-16 text-center">
              <div
                className="
                  mx-auto
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-full
                  bg-[var(--background)]
                  text-xl
                  text-[var(--foreground-muted)]
                "
              >
                ◇
              </div>

              <p className="mt-4 text-sm font-medium text-[var(--foreground)]">
                No permissions found
              </p>

              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                {searchValue
                  ? "Try adjusting your search."
                  : "Create your first permission to get started."}
              </p>

              {!searchValue && (
                <Link
                  href="/dashboard/permissions/new"
                  className="
                    mt-4
                    inline-flex
                    text-sm
                    font-medium
                    text-[var(--primary)]
                    hover:underline
                  "
                >
                  Create permission
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Pagination */}
        {/* ---------------------------------------------------------------- */}

        {total > 0 && (
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
                  {(currentPage - 1) * PAGE_SIZE + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {Math.min(currentPage * PAGE_SIZE, total)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {total}
                </span>{" "}
                permissions
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((value) => value - 1)}
                  disabled={currentPage <= 1}
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
                    {currentPage}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {totalPages}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() => setPage((value) => value + 1)}
                  disabled={currentPage >= totalPages}
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

        {loading && permissions.length > 0 && (
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

      {/* ------------------------------------------------------------------ */}
      {/* Permission details modal */}
      {/* ------------------------------------------------------------------ */}

      {selectedPermission && (
        <PermissionDetailsModal
          permission={selectedPermission}
          loading={viewLoading}
          onClose={() => setSelectedPermission(null)}
          onDelete={handleDeletePermission}
        />
      )}
    </main>
  );
}

// =============================================================================
// Table Header
// =============================================================================

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

// =============================================================================
// Permission Row
// =============================================================================

function PermissionRow({
  permission,
  onView,
}: {
  permission: Permission;
  onView: (permissionId: string) => void;
}) {
  return (
    <tr
      className="
        border-b
        border-[var(--border)]
        last:border-0
        transition-colors
        hover:bg-[var(--background)]
      "
    >
      {/* Permission */}

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
            {permission.name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--foreground)]">
              {permission.name}
            </p>

            <p className="mt-0.5 truncate font-mono text-xs text-[var(--foreground-muted)]">
              {permission.slug}
            </p>
          </div>
        </div>
      </td>

      {/* Resource */}

      <td className="px-6 py-5">
        <span
          className="
            inline-flex
            rounded-md
            bg-[var(--background)]
            px-2.5
            py-1
            font-mono
            text-xs
            text-[var(--foreground)]
          "
        >
          {permission.resource}
        </span>
      </td>

      {/* Action */}

      <td className="px-6 py-5">
        <span
          className="
            inline-flex
            rounded-md
            border
            border-[var(--border)]
            px-2.5
            py-1
            font-mono
            text-xs
            text-[var(--foreground-muted)]
          "
        >
          {permission.action}
        </span>
      </td>

      {/* Status */}

      <td className="px-6 py-5">
        <PermissionStatusBadge isActive={permission.isActive} />
      </td>

      {/* Created */}

      <td className="px-6 py-5">
        <span className="text-sm text-[var(--foreground-muted)]">
          {new Date(permission.createdAt).toLocaleDateString()}
        </span>
      </td>

      {/* Actions */}

      <td className="px-6 py-5">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => onView(permission.id)}
            className="
              text-sm
              font-medium
              text-[var(--primary)]
              hover:underline
            "
          >
            View
          </button>
        </div>
      </td>
    </tr>
  );
}

// =============================================================================
// Status Badge
// =============================================================================

function PermissionStatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
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
      INACTIVE
    </span>
  );
}

// =============================================================================
// Permission Details Modal
// =============================================================================

function PermissionDetailsModal({
  permission,
  loading,
  onClose,
  onDelete,
}: {
  permission: Permission;
  loading: boolean;
  onClose: () => void;
  onDelete: (permission: Permission) => void;
}) {
  return (
    <div
      className="
        fixed
        inset-0
        z-[100000]
        flex
        items-center
        justify-center
        bg-black/50
        p-4
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="
          w-full
          max-w-2xl
          overflow-hidden
          rounded-2xl
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
            py-5
          "
        >
          <div className="flex items-center gap-4">
            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-xl
                bg-[var(--primary)]
                text-lg
                font-bold
                text-white
              "
            >
              {permission.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  {permission.name}
                </h2>

                <PermissionStatusBadge isActive={permission.isActive} />
              </div>

              <p className="mt-1 font-mono text-xs text-[var(--foreground-muted)]">
                {permission.slug}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
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
            "
          >
            ×
          </button>
        </div>

        {/* Content */}

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="py-10 text-center text-sm text-[var(--foreground-muted)]">
              Loading permission details...
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <InfoItem label="Permission ID" value={permission.id} />

              <InfoItem label="Name" value={permission.name} />

              <InfoItem label="Slug" value={permission.slug} />

              <InfoItem label="Resource" value={permission.resource} />

              <InfoItem label="Action" value={permission.action} />

              <InfoItem
                label="Status"
                value={permission.isActive ? "ACTIVE" : "INACTIVE"}
              />

              <InfoItem
                label="Created"
                value={formatDateTime(permission.createdAt)}
              />

              <InfoItem
                label="Updated"
                value={formatDateTime(permission.updatedAt)}
              />

              <div className="sm:col-span-2">
                <InfoItem
                  label="Description"
                  value={permission.description || "—"}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}

        <div
          className="
            flex
            items-center
            justify-between
            border-t
            border-[var(--border)]
            px-6
            py-4
          "
        >
          <button
            type="button"
            onClick={() => onDelete(permission)}
            className="
              rounded-lg
              bg-[var(--danger)]
              px-4
              py-2
              text-sm
              font-medium
              text-white
              hover:opacity-90
            "
          >
            Delete
          </button>

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
      </div>
    </div>
  );
}

// =============================================================================
// Info Item
// =============================================================================

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--foreground-muted)]">
        {label}
      </p>

      <p className="mt-1 break-all text-sm text-[var(--foreground)]">
        {value || "—"}
      </p>
    </div>
  );
}

// =============================================================================
// Date
// =============================================================================

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

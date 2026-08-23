"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/providers/auth-provider";

import {
  assignPermissionToRole,
  getRolePermissions,
  removePermissionFromRole,
  type Permission,
  type RolePermission,
} from "@/lib/roles-api";

import { getPermissions } from "@/lib/permissions-api";

export default function RolePermissions({ roleId }: { roleId: string }) {
  const { accessToken } = useAuth();

  const [assignedPermissions, setAssignedPermissions] = useState<
    RolePermission[]
  >([]);

  const [availablePermissions, setAvailablePermissions] = useState<
    Permission[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  // ---------------------------------------------------------------------------
  // Load permissions
  // ---------------------------------------------------------------------------

  const loadPermissions = useCallback(async () => {
    if (!accessToken || !roleId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [assigned, available] = await Promise.all([
        getRolePermissions(accessToken, roleId),
        getPermissions(accessToken),
      ]);

      setAssignedPermissions(assigned);
      setAvailablePermissions(available);
    } catch (error) {
      console.error("[ROLE PERMISSIONS] Failed to load:", error);

      setError(
        error instanceof Error ? error.message : "Unable to load permissions"
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, roleId]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // ---------------------------------------------------------------------------
  // Assigned permission IDs
  // ---------------------------------------------------------------------------

  const assignedIds = useMemo(() => {
    return new Set(
      assignedPermissions.map((permission) => permission.permissionId)
    );
  }, [assignedPermissions]);

  // ---------------------------------------------------------------------------
  // Filter available permissions
  // ---------------------------------------------------------------------------

  const filteredPermissions = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return availablePermissions;
    }

    return availablePermissions.filter((permission) => {
      return (
        permission.name.toLowerCase().includes(value) ||
        permission.slug.toLowerCase().includes(value) ||
        permission.resource.toLowerCase().includes(value) ||
        permission.action.toLowerCase().includes(value)
      );
    });
  }, [availablePermissions, search]);

  // ---------------------------------------------------------------------------
  // Assign
  // ---------------------------------------------------------------------------

  async function handleAssign(permissionId: string) {
    if (!accessToken || !roleId) {
      return;
    }

    try {
      setSavingId(permissionId);
      setError("");

      await assignPermissionToRole(accessToken, roleId, permissionId);

      await loadPermissions();
    } catch (error) {
      console.error("[ROLE PERMISSIONS] Failed to assign:", error);

      setError(
        error instanceof Error ? error.message : "Unable to assign permission"
      );
    } finally {
      setSavingId(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Remove
  // ---------------------------------------------------------------------------

  async function handleRemove(permission: RolePermission) {
    if (!accessToken || !roleId) {
      return;
    }

    const confirmed = window.confirm(
      `Remove "${permission.permission.name}" from this role?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSavingId(permission.permissionId);
      setError("");

      await removePermissionFromRole(
        accessToken,
        roleId,
        permission.permissionId
      );

      await loadPermissions();
    } catch (error) {
      console.error("[ROLE PERMISSIONS] Failed to remove:", error);

      setError(
        error instanceof Error ? error.message : "Unable to remove permission"
      );
    } finally {
      setSavingId(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <section
        className="
          overflow-hidden
          rounded-xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          shadow-[var(--shadow-sm)]
        "
      >
        <div className="flex min-h-[350px] items-center justify-center">
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
      </section>
    );
  }

  return (
    <section
      className="
        overflow-hidden
        rounded-xl
        border
        border-[var(--border)]
        bg-[var(--surface)]
        shadow-[var(--shadow-sm)]
      "
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header */}
      {/* ------------------------------------------------------------------ */}

      <div
        className="
          flex
          items-center
          justify-between
          gap-4
          border-b
          border-[var(--border)]
          px-6
          py-5
        "
      >
        <div>
          <p
            className="
              font-mono
              text-[10px]
              uppercase
              tracking-[0.2em]
              text-[var(--primary)]
            "
          >
            Authorization
          </p>

          <h2 className="mt-1 font-semibold text-[var(--foreground)]">
            Permissions
          </h2>

          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Assign and manage permissions for this role.
          </p>
        </div>

        <div
          className="
            rounded-full
            border
            border-[var(--border)]
            bg-[var(--background)]
            px-3
            py-1.5
            text-xs
            font-medium
            text-[var(--foreground-muted)]
          "
        >
          {assignedPermissions.length} assigned
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Error */}
      {/* ------------------------------------------------------------------ */}

      {error && (
        <div
          className="
            mx-6
            mt-5
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
            onClick={loadPermissions}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Search */}
      {/* ------------------------------------------------------------------ */}

      <div className="border-b border-[var(--border)] px-6 py-5">
        <div className="relative max-w-md">
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
            placeholder="Search permissions..."
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
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Permissions table */}
      {/* ------------------------------------------------------------------ */}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[950px]">
          <thead>
            <tr className="border-b border-[var(--border)]">
              <TableHeader>Permission</TableHeader>
              <TableHeader>Slug</TableHeader>
              <TableHeader>Resource</TableHeader>
              <TableHeader>Action</TableHeader>
              <TableHeader>Status</TableHeader>

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
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {filteredPermissions.map((permission) => {
              const assigned = assignedIds.has(permission.id);
              const saving = savingId === permission.id;

              return (
                <PermissionRow
                  key={permission.id}
                  permission={permission}
                  assigned={assigned}
                  saving={saving}
                  onAssign={handleAssign}
                  onRemove={handleRemove}
                  assignedPermission={
                    assignedPermissions.find(
                      (item) => item.permissionId === permission.id
                    ) ?? null
                  }
                />
              );
            })}
          </tbody>
        </table>

        {/* ---------------------------------------------------------------- */}
        {/* Empty */}
        {/* ---------------------------------------------------------------- */}

        {filteredPermissions.length === 0 && (
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
              {search
                ? "Try adjusting your search."
                : "There are no permissions available."}
            </p>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Footer */}
      {/* ------------------------------------------------------------------ */}

      {availablePermissions.length > 0 && (
        <div
          className="
            border-t
            border-[var(--border)]
            bg-[var(--surface)]
            px-6
            py-4
          "
        >
          <p className="text-sm text-[var(--foreground-muted)]">
            Showing{" "}
            <span className="font-medium text-[var(--foreground)]">
              {filteredPermissions.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-[var(--foreground)]">
              {availablePermissions.length}
            </span>{" "}
            permissions
          </p>
        </div>
      )}
    </section>
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
  assigned,
  saving,
  assignedPermission,
  onAssign,
  onRemove,
}: {
  permission: Permission;
  assigned: boolean;
  saving: boolean;
  assignedPermission: RolePermission | null;
  onAssign: (permissionId: string) => void;
  onRemove: (permission: RolePermission) => void;
}) {
  return (
    <tr
      className={`
        border-b
        border-[var(--border)]
        last:border-0
        transition-colors
        hover:bg-[var(--background)]
        ${!permission.isActive ? "opacity-60" : ""}
      `}
    >
      {/* Permission */}

      <td className="px-6 py-5">
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">
            {permission.name}
          </p>

          {permission.description && (
            <p className="mt-1 max-w-sm truncate text-xs text-[var(--foreground-muted)]">
              {permission.description}
            </p>
          )}
        </div>
      </td>

      {/* Slug */}

      <td className="px-6 py-5">
        <span className="font-mono text-xs text-[var(--foreground-muted)]">
          {permission.slug}
        </span>
      </td>

      {/* Resource */}

      <td className="px-6 py-5">
        <span
          className="
            inline-flex
            rounded-full
            border
            border-[var(--border)]
            bg-[var(--background)]
            px-2.5
            py-1
            text-xs
            font-medium
            text-[var(--foreground)]
          "
        >
          {permission.resource}
        </span>
      </td>

      {/* Action */}

      <td className="px-6 py-5">
        <span className="text-sm text-[var(--foreground-muted)]">
          {permission.action}
        </span>
      </td>

      {/* Status */}

      <td className="px-6 py-5">
        <PermissionStatusBadge isActive={permission.isActive} />
      </td>

      {/* Action */}

      <td className="px-6 py-5 text-right">
        {assigned ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              if (assignedPermission) {
                onRemove(assignedPermission);
              }
            }}
            className="
              rounded-lg
              border
              border-[var(--danger)]
              px-3
              py-1.5
              text-sm
              font-medium
              text-[var(--danger)]
              transition
              hover:bg-[var(--danger-soft)]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {saving ? "Removing..." : "Remove"}
          </button>
        ) : (
          <button
            type="button"
            disabled={saving || !permission.isActive}
            onClick={() => onAssign(permission.id)}
            className="
              rounded-lg
              bg-[var(--primary)]
              px-3
              py-1.5
              text-sm
              font-medium
              text-white
              transition
              hover:opacity-90
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {saving ? "Assigning..." : "Assign"}
          </button>
        )}
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

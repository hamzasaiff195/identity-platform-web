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

type Props = {
  roleId: string;
};

export default function RolePermissions({ roleId }: Props) {
  const { accessToken } = useAuth();

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [assignedPermissions, setAssignedPermissions] = useState<
    RolePermission[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // ---------------------------------------------------------------------------
  // Load permissions
  // ---------------------------------------------------------------------------

  const loadPermissions = useCallback(async () => {
    if (!accessToken || !roleId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const [allPermissions, rolePermissions] = await Promise.all([
        getPermissions(accessToken),
        getRolePermissions(accessToken, roleId),
      ]);

      setPermissions(allPermissions);
      setAssignedPermissions(rolePermissions);
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
  // Assigned IDs
  // ---------------------------------------------------------------------------

  const assignedIds = useMemo(() => {
    return new Set(
      assignedPermissions
        .filter((item) => item.isActive)
        .map((item) => item.permissionId)
    );
  }, [assignedPermissions]);

  // ---------------------------------------------------------------------------
  // Assign / remove
  // ---------------------------------------------------------------------------

  async function handleToggle(permission: Permission) {
    if (!accessToken) {
      return;
    }

    const isAssigned = assignedIds.has(permission.id);

    try {
      setSavingId(permission.id);
      setError("");

      if (isAssigned) {
        await removePermissionFromRole(accessToken, roleId, permission.id);
      } else {
        await assignPermissionToRole(accessToken, roleId, permission.id);
      }

      // Reload from backend so UI always reflects actual DB state.
      const updated = await getRolePermissions(accessToken, roleId);

      setAssignedPermissions(updated);
    } catch (error) {
      console.error("[ROLE PERMISSIONS] Failed to update:", error);

      setError(
        error instanceof Error ? error.message : "Unable to update permission"
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
        <div className="border-b border-[var(--border)] px-6 py-5">
          <h2 className="font-semibold text-[var(--foreground)]">
            Permissions
          </h2>

          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Loading permissions...
          </p>
        </div>

        <div className="flex min-h-[250px] items-center justify-center">
          <div className="text-center">
            <div
              className="
                mx-auto
                h-7
                w-7
                animate-spin
                rounded-full
                border-2
                border-[var(--border)]
                border-t-[var(--primary)]
              "
            />

            <p className="mt-3 text-sm text-[var(--foreground-muted)]">
              Loading permissions...
            </p>
          </div>
        </div>
      </section>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

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
          <h2 className="font-semibold text-[var(--foreground)]">
            Permissions
          </h2>

          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Assign permissions to this role.
          </p>
        </div>

        <div
          className="
            rounded-full
            border
            border-[var(--border)]
            px-3
            py-1
            text-xs
            font-medium
            text-[var(--foreground-muted)]
          "
        >
          {assignedIds.size} assigned
        </div>
      </div>

      {/* Error */}

      {error && (
        <div
          className="
            border-b
            border-[var(--danger)]
            bg-[var(--danger-soft)]
            px-6
            py-3
            text-sm
            text-[var(--danger)]
          "
        >
          {error}
        </div>
      )}

      {/* Empty */}

      {permissions.length === 0 ? (
        <div className="px-6 py-16 text-center">
          <p className="text-sm font-medium text-[var(--foreground)]">
            No permissions found
          </p>

          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Create permissions first before assigning them to roles.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <TableHeader>Permission</TableHeader>
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
                  Assigned
                </th>
              </tr>
            </thead>

            <tbody>
              {permissions.map((permission) => {
                const assigned = assignedIds.has(permission.id);
                const saving = savingId === permission.id;

                return (
                  <tr
                    key={permission.id}
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
                      <div>
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          {permission.name}
                        </p>

                        <p className="mt-0.5 font-mono text-xs text-[var(--foreground-muted)]">
                          {permission.slug}
                        </p>

                        {permission.description && (
                          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Resource */}

                    <td className="px-6 py-5">
                      <span
                        className="
                          inline-flex
                          rounded-md
                          border
                          border-[var(--border)]
                          bg-[var(--background)]
                          px-2.5
                          py-1
                          font-mono
                          text-xs
                          text-[var(--foreground-muted)]
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

                    {/* Permission status */}

                    <td className="px-6 py-5">
                      {permission.isActive ? (
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
                      ) : (
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
                          INACTIVE
                        </span>
                      )}
                    </td>

                    {/* Assignment */}

                    <td className="px-6 py-5 text-right">
                      <button
                        type="button"
                        disabled={saving || !permission.isActive}
                        onClick={() => handleToggle(permission)}
                        className={
                          assigned
                            ? `
                              rounded-lg
                              border
                              border-[var(--border)]
                              bg-[var(--surface)]
                              px-4
                              py-2
                              text-sm
                              font-medium
                              text-[var(--foreground)]
                              transition
                              hover:bg-[var(--background)]
                              disabled:cursor-not-allowed
                              disabled:opacity-50
                            `
                            : `
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
                            `
                        }
                      >
                        {saving ? "Saving..." : assigned ? "Remove" : "Assign"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// -----------------------------------------------------------------------------
// Table Header
// -----------------------------------------------------------------------------

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

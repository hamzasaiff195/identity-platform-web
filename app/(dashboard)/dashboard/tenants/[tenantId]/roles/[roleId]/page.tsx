"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  assignPermissionToRole,
  assignTenantRole,
  deleteRole,
  getRolePermissions,
  getTenantMemberRoles,
  getTenantRoles,
  removePermissionFromRole,
  type Role,
  type RolePermission,
} from "@/lib/roles-api";

import {
  getPermissions,
  type Permission as PermissionApi,
} from "@/lib/permissions-api";

import { getTenantMembers, type TenantMember } from "@/lib/tenants-api";

import { useAuth } from "@/providers/auth-provider";

/* ========================================================================== */
/* HELPERS                                                                    */
/* ========================================================================== */

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    if (Array.isArray(message)) {
      return message.join(", ");
    }
  }

  return fallback;
}

/* ========================================================================== */
/* PAGE                                                                       */
/* ========================================================================== */

export default function TenantRolePage() {
  const params = useParams<{
    tenantId: string;
    roleId: string;
  }>();

  const router = useRouter();

  const tenantId = params.tenantId;
  const roleId = params.roleId;

  const {
    accessToken,
    isSuperAdmin,
    isAdmin,
    loading: authLoading,
  } = useAuth();

  /* ------------------------------------------------------------------------ */
  /* STATE                                                                    */
  /* ------------------------------------------------------------------------ */

  const [role, setRole] = useState<Role | null>(null);

  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);

  const [allPermissions, setAllPermissions] = useState<PermissionApi[]>([]);

  const [members, setMembers] = useState<TenantMember[]>([]);

  const [memberRoles, setMemberRoles] = useState<Record<string, Role[]>>({});

  const [loading, setLoading] = useState(true);

  const [permissionsLoading, setPermissionsLoading] = useState(false);

  const [membersLoading, setMembersLoading] = useState(false);

  const [permissionActionLoading, setPermissionActionLoading] = useState<
    string | null
  >(null);

  const [memberActionLoading, setMemberActionLoading] = useState<string | null>(
    null
  );

  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showPermissionManager, setShowPermissionManager] = useState(false);

  const [showMemberManager, setShowMemberManager] = useState(false);

  const [permissionSearch, setPermissionSearch] = useState("");

  const [memberSearch, setMemberSearch] = useState("");

  /*
   * Page-level messages.
   */
  const [error, setError] = useState("");

  /*
   * Permission manager messages.
   */
  const [permissionError, setPermissionError] = useState("");

  const [permissionMessage, setPermissionMessage] = useState("");

  /*
   * Member manager messages.
   */
  const [memberError, setMemberError] = useState("");

  const [memberMessage, setMemberMessage] = useState("");

  /*
   * Delete messages.
   */
  const [deleteError, setDeleteError] = useState("");

  const [deleteSuccess, setDeleteSuccess] = useState("");

  /* ------------------------------------------------------------------------ */
  /* ACCESS                                                                   */
  /* ------------------------------------------------------------------------ */

  const canManageTenant = !authLoading && (isSuperAdmin || isAdmin);

  /* ------------------------------------------------------------------------ */
  /* LOAD ROLE                                                                */
  /* ------------------------------------------------------------------------ */

  useEffect(() => {
    if (authLoading || !canManageTenant) {
      return;
    }

    if (!accessToken || !tenantId || !roleId) {
      setLoading(false);
      return;
    }

    async function loadRole() {
      try {
        setLoading(true);
        setError("");

        const result = await getTenantRoles(accessToken!, tenantId);

        const foundRole = result.find(
          (item) =>
            item.id === roleId &&
            item.scope === "TENANT" &&
            item.tenantId === tenantId &&
            item.isActive &&
            !item.isDeleted
        );

        if (!foundRole) {
          setRole(null);
          setError("Role not found.");
          return;
        }

        setRole(foundRole);
      } catch (err) {
        console.error("[TENANT ROLE] Failed to load role:", err);

        setRole(null);

        setError(getErrorMessage(err, "Unable to load tenant role."));
      } finally {
        setLoading(false);
      }
    }

    void loadRole();
  }, [accessToken, authLoading, canManageTenant, roleId, tenantId]);

  /* ------------------------------------------------------------------------ */
  /* LOAD ROLE PERMISSIONS                                                    */
  /* ------------------------------------------------------------------------ */

  async function loadRolePermissions() {
    if (!accessToken || !role) {
      return;
    }

    try {
      setPermissionsLoading(true);

      const result = await getRolePermissions(accessToken, role.id);

      setRolePermissions(result);
    } catch (err) {
      console.error("[TENANT ROLE] Failed to load role permissions:", err);

      setRolePermissions([]);

      setPermissionError(
        getErrorMessage(err, "Unable to load role permissions.")
      );
    } finally {
      setPermissionsLoading(false);
    }
  }

  useEffect(() => {
    if (authLoading || !canManageTenant || !accessToken || !role) {
      return;
    }

    void loadRolePermissions();
  }, [accessToken, authLoading, canManageTenant, role]);

  /* ------------------------------------------------------------------------ */
  /* LOAD ALL PERMISSIONS                                                      */
  /* ------------------------------------------------------------------------ */

  async function loadAllPermissions() {
    if (!accessToken) {
      return;
    }

    try {
      setPermissionError("");

      const result = await getPermissions(accessToken);

      setAllPermissions(result);
    } catch (err) {
      console.error("[TENANT ROLE] Failed to load permissions:", err);

      setAllPermissions([]);

      setPermissionError(
        getErrorMessage(err, "Unable to load available permissions.")
      );
    }
  }

  /* ------------------------------------------------------------------------ */
  /* LOAD TENANT MEMBERS                                                       */
  /* ------------------------------------------------------------------------ */

  async function loadMembers() {
    if (!accessToken || !tenantId) {
      return;
    }

    try {
      setMembersLoading(true);
      setMemberError("");

      const result = await getTenantMembers(accessToken, tenantId, 1, 100);

      setMembers(result.members);

      const roleEntries = await Promise.all(
        result.members.map(async (member) => {
          try {
            const roles = await getTenantMemberRoles(
              accessToken,
              tenantId,
              member.userId
            );

            return [member.userId, roles] as const;
          } catch (err) {
            console.error(
              `[TENANT ROLE] Failed to load roles for ${member.userId}:`,
              err
            );

            return [member.userId, []] as const;
          }
        })
      );

      setMemberRoles(Object.fromEntries(roleEntries));
    } catch (err) {
      console.error("[TENANT ROLE] Failed to load members:", err);

      setMembers([]);

      setMemberError(getErrorMessage(err, "Unable to load tenant members."));
    } finally {
      setMembersLoading(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* OPEN PERMISSION MANAGER                                                  */
  /* ------------------------------------------------------------------------ */

  async function handleOpenPermissionManager() {
    setPermissionError("");
    setPermissionMessage("");

    setMemberError("");
    setMemberMessage("");

    if (showPermissionManager) {
      setShowPermissionManager(false);
      return;
    }

    setShowPermissionManager(true);
    setShowMemberManager(false);

    await loadAllPermissions();
  }

  /* ------------------------------------------------------------------------ */
  /* OPEN MEMBER MANAGER                                                       */
  /* ------------------------------------------------------------------------ */

  async function handleOpenMemberManager() {
    setMemberError("");
    setMemberMessage("");

    setPermissionError("");
    setPermissionMessage("");

    if (showMemberManager) {
      setShowMemberManager(false);
      return;
    }

    setShowMemberManager(true);
    setShowPermissionManager(false);

    await loadMembers();
  }

  /* ------------------------------------------------------------------------ */
  /* ASSIGN PERMISSION                                                         */
  /* ------------------------------------------------------------------------ */

  async function handleAssignPermission(permissionId: string) {
    if (!accessToken || !role) {
      return;
    }

    setPermissionActionLoading(permissionId);

    setPermissionError("");
    setPermissionMessage("");

    try {
      await assignPermissionToRole(accessToken, role.id, permissionId);

      await loadRolePermissions();

      setPermissionMessage("Permission assigned successfully.");
    } catch (err) {
      console.error("[TENANT ROLE] Failed to assign permission:", err);

      setPermissionError(getErrorMessage(err, "Unable to assign permission."));
    } finally {
      setPermissionActionLoading(null);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* REMOVE PERMISSION                                                         */
  /* ------------------------------------------------------------------------ */

  async function handleRemovePermission(permissionId: string) {
    if (!accessToken || !role) {
      return;
    }

    setPermissionActionLoading(permissionId);

    setPermissionError("");
    setPermissionMessage("");

    try {
      await removePermissionFromRole(accessToken, role.id, permissionId);

      setRolePermissions((current) =>
        current.filter((item) => item.permissionId !== permissionId)
      );

      setPermissionMessage("Permission removed successfully.");
    } catch (err) {
      console.error("[TENANT ROLE] Failed to remove permission:", err);

      setPermissionError(getErrorMessage(err, "Unable to remove permission."));
    } finally {
      setPermissionActionLoading(null);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* ASSIGN ROLE TO MEMBER                                                     */
  /* ------------------------------------------------------------------------ */

  async function handleAssignMember(userId: string) {
    if (!accessToken || !role || !tenantId) {
      return;
    }

    setMemberActionLoading(userId);

    setMemberError("");
    setMemberMessage("");

    try {
      await assignTenantRole(accessToken, tenantId, userId, role.id);

      const updatedRoles = await getTenantMemberRoles(
        accessToken,
        tenantId,
        userId
      );

      setMemberRoles((current) => ({
        ...current,
        [userId]: updatedRoles,
      }));

      setMemberMessage("Role assigned to member successfully.");
    } catch (err) {
      console.error("[TENANT ROLE] Failed to assign member:", err);

      setMemberError(getErrorMessage(err, "Unable to assign role to member."));
    } finally {
      setMemberActionLoading(null);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* DELETE ROLE                                                              */
  /* ------------------------------------------------------------------------ */

  async function handleDeleteRole() {
    if (!accessToken || !role) {
      return;
    }

    setDeleteError("");
    setDeleteSuccess("");

    if (role.slug === "tenant-admin") {
      setDeleteError("The built-in tenant-admin role cannot be deleted.");
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete the "${role.name}" role?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeleteLoading(true);

    try {
      await deleteRole(accessToken, role.id);

      setDeleteSuccess("Role deleted successfully.");

      window.setTimeout(() => {
        router.push(`/dashboard/tenants/${tenantId}/roles`);
      }, 700);
    } catch (err) {
      console.error("[TENANT ROLE] Failed to delete role:", err);

      setDeleteError(getErrorMessage(err, "Unable to delete role."));
    } finally {
      setDeleteLoading(false);
    }
  }

  /* ------------------------------------------------------------------------ */
  /* DERIVED DATA                                                             */
  /* ------------------------------------------------------------------------ */

  const assignedPermissionIds = useMemo(
    () => new Set(rolePermissions.map((item) => item.permissionId)),
    [rolePermissions]
  );

  const filteredPermissions = useMemo(() => {
    const search = permissionSearch.trim().toLowerCase();

    if (!search) {
      return allPermissions;
    }

    return allPermissions.filter(
      (permission) =>
        permission.name.toLowerCase().includes(search) ||
        permission.slug.toLowerCase().includes(search) ||
        permission.resource.toLowerCase().includes(search) ||
        permission.action.toLowerCase().includes(search)
    );
  }, [allPermissions, permissionSearch]);

  const filteredMembers = useMemo(() => {
    const search = memberSearch.trim().toLowerCase();

    if (!search) {
      return members;
    }

    return members.filter(
      (member) =>
        member.user.email.toLowerCase().includes(search) ||
        member.userId.toLowerCase().includes(search)
    );
  }, [members, memberSearch]);

  function memberHasRole(userId: string) {
    return (memberRoles[userId] ?? []).some(
      (memberRole) => memberRole.id === role?.id
    );
  }

  const assignedMembers = useMemo(
    () => members.filter((member) => memberHasRole(member.userId)),
    [members, memberRoles, role]
  );

  /* ------------------------------------------------------------------------ */
  /* LOADING                                                                  */
  /* ------------------------------------------------------------------------ */

  if (authLoading || loading) {
    return (
      <main className="identity-page min-h-screen p-6">
        <div className="mx-auto max-w-5xl">
          <div className="identity-surface rounded-2xl p-8">
            <p className="identity-muted text-sm">Loading role...</p>
          </div>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* ACCESS DENIED                                                            */
  /* ------------------------------------------------------------------------ */

  if (!canManageTenant) {
    return (
      <main className="identity-page flex min-h-screen items-center justify-center p-6">
        <div className="identity-surface w-full max-w-md rounded-2xl p-8 text-center">
          <p className="identity-eyebrow">Tenant role</p>

          <h1 className="mt-2 text-xl font-semibold">Access denied</h1>

          <p className="identity-muted mt-2 text-sm">
            You do not have permission to manage tenant roles.
          </p>

          <Link
            href={`/dashboard/tenants/${tenantId}/roles`}
            className="identity-button-primary mt-6 inline-block rounded-xl px-4 py-3 text-sm font-medium"
          >
            Back to roles
          </Link>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------------ */
  /* ROLE NOT FOUND                                                           */
  /* ------------------------------------------------------------------------ */

  if (!role) {
    return (
      <main className="identity-page min-h-screen p-6">
        <div className="mx-auto max-w-5xl">
          <Link
            href={`/dashboard/tenants/${tenantId}/roles`}
            className="identity-muted text-sm hover:text-[var(--foreground)]"
          >
            ← Tenant roles
          </Link>

          <div className="identity-surface mt-6 rounded-2xl p-8">
            <p className="identity-eyebrow">Tenant role</p>

            <h1 className="mt-2 text-xl font-semibold">Role not found</h1>

            <p className="identity-muted mt-2 text-sm">
              {error || "The requested role does not exist."}
            </p>

            <button
              type="button"
              onClick={() =>
                router.push(`/dashboard/tenants/${tenantId}/roles`)
              }
              className="identity-button-primary mt-6 rounded-xl px-4 py-2.5 text-sm font-medium"
            >
              Back to roles
            </button>
          </div>
        </div>
      </main>
    );
  }

  const isBuiltIn = role.slug === "tenant-admin";

  /* ------------------------------------------------------------------------ */
  /* RENDER                                                                   */
  /* ------------------------------------------------------------------------ */

  return (
    <main className="identity-page min-h-screen p-6">
      <div className="mx-auto max-w-5xl">
        {/* ------------------------------------------------------------------ */}
        {/* BREADCRUMB                                                         */}
        {/* ------------------------------------------------------------------ */}

        <Link
          href={`/dashboard/tenants/${tenantId}/roles`}
          className="identity-muted text-sm hover:text-[var(--foreground)]"
        >
          ← Tenant roles
        </Link>

        {/* ------------------------------------------------------------------ */}
        {/* HEADER                                                             */}
        {/* ------------------------------------------------------------------ */}

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="identity-eyebrow">Tenant administration</p>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold">{role.name}</h1>

              {isBuiltIn && (
                <span className="inline-flex rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                  Built-in
                </span>
              )}
            </div>

            <p className="identity-muted mt-1 text-sm">
              Manage this tenant role, permissions, and members.
            </p>
          </div>

          <Link
            href={`/dashboard/tenants/${tenantId}/roles`}
            className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)]"
          >
            Back to roles
          </Link>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* PAGE ERROR                                                          */}
        {/* ------------------------------------------------------------------ */}

        {error && (
          <div className="mt-6 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* ROLE DETAILS                                                        */}
        {/* ------------------------------------------------------------------ */}

        <section className="identity-surface mt-8 rounded-2xl p-6">
          <div className="mb-6">
            <p className="identity-eyebrow">Role details</p>

            <h2 className="mt-1 text-lg font-semibold">Role information</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <Detail label="Name" value={role.name} />

            <Detail label="Slug" value={role.slug} mono />

            <Detail label="Scope" value={role.scope} />

            <Detail
              label="Status"
              value={role.isActive ? "ACTIVE" : "INACTIVE"}
            />

            <Detail label="Role ID" value={role.id} mono />

            <Detail label="Tenant ID" value={role.tenantId} mono />
          </div>

          <div className="mt-6 border-t border-[var(--border)] pt-6">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-subtle)]">
              Description
            </p>

            <p className="identity-muted mt-2 text-sm">
              {role.description || "No description provided."}
            </p>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* PERMISSIONS                                                         */}
        {/* ------------------------------------------------------------------ */}

        <section className="identity-surface mt-6 rounded-2xl p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="identity-eyebrow">Authorization</p>

              <h2 className="mt-1 text-lg font-semibold">Permissions</h2>

              <p className="identity-muted mt-1 text-sm">
                Permissions currently assigned to this role.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenPermissionManager}
              className="identity-button-primary rounded-xl px-4 py-2.5 text-sm font-medium"
            >
              {showPermissionManager ? "Close manager" : "Manage permissions"}
            </button>
          </div>

          {/* Permission manager */}

          {showPermissionManager && (
            <div className="mt-6 rounded-2xl border border-[var(--border)] p-5">
              {permissionError && (
                <div className="mb-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
                  {permissionError}
                </div>
              )}

              {permissionMessage && (
                <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-600">
                  {permissionMessage}
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm font-semibold">Available permissions</p>

                <p className="identity-muted mt-1 text-xs">
                  Assign or remove permissions from this role.
                </p>
              </div>

              <input
                type="text"
                value={permissionSearch}
                onChange={(event) => setPermissionSearch(event.target.value)}
                placeholder="Search permissions..."
                className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
              />

              <div className="mt-4 max-h-96 overflow-y-auto rounded-xl border border-[var(--border)]">
                {filteredPermissions.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm font-medium">No permissions found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {filteredPermissions.map((permission) => {
                      const assigned = assignedPermissionIds.has(permission.id);

                      const actionLoading =
                        permissionActionLoading === permission.id;

                      return (
                        <div
                          key={permission.id}
                          className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {permission.name}
                            </p>

                            <p className="identity-muted mt-1 break-all font-mono text-xs">
                              {permission.slug}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="rounded-md bg-[var(--surface-hover)] px-2 py-1 text-xs">
                                {permission.resource}
                              </span>

                              <span className="rounded-md bg-[var(--surface-hover)] px-2 py-1 text-xs">
                                {permission.action}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() =>
                              assigned
                                ? handleRemovePermission(permission.id)
                                : handleAssignPermission(permission.id)
                            }
                            className={
                              assigned
                                ? "shrink-0 rounded-xl border border-[var(--danger)]/30 px-3 py-2 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:opacity-50"
                                : "identity-button-primary shrink-0 rounded-xl px-3 py-2 text-xs font-medium disabled:opacity-50"
                            }
                          >
                            {actionLoading
                              ? "Saving..."
                              : assigned
                              ? "Remove"
                              : "Assign"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assigned permissions */}

          <div className="mt-6">
            {permissionsLoading ? (
              <div className="rounded-xl border border-[var(--border)] p-6 text-center">
                <p className="identity-muted text-sm">Loading permissions...</p>
              </div>
            ) : rolePermissions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--border)] p-6 text-center">
                <p className="text-sm font-medium">No permissions assigned</p>

                <p className="identity-muted mt-1 text-xs">
                  Use Manage permissions to assign permissions.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                <div className="divide-y divide-[var(--border)]">
                  {rolePermissions.map((rolePermission) => {
                    const permission = rolePermission.permission;

                    const removing =
                      permissionActionLoading === rolePermission.permissionId;

                    return (
                      <div
                        key={rolePermission.id}
                        className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium">
                            {permission.name}
                          </p>

                          <p className="identity-muted mt-1 break-all font-mono text-xs">
                            {permission.slug}
                          </p>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-md bg-[var(--surface-hover)] px-2 py-1 text-xs">
                              {permission.resource}
                            </span>

                            <span className="rounded-md bg-[var(--surface-hover)] px-2 py-1 text-xs">
                              {permission.action}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={removing}
                          onClick={() =>
                            handleRemovePermission(rolePermission.permissionId)
                          }
                          className="shrink-0 rounded-xl border border-[var(--danger)]/30 px-3 py-2 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:opacity-50"
                        >
                          {removing ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* MEMBERS                                                            */}
        {/* ------------------------------------------------------------------ */}

        <section className="identity-surface mt-6 rounded-2xl p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="identity-eyebrow">Membership</p>

              <h2 className="mt-1 text-lg font-semibold">Assigned members</h2>

              <p className="identity-muted mt-1 text-sm">
                Members currently assigned to this role.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenMemberManager}
              className="identity-button-primary rounded-xl px-4 py-2.5 text-sm font-medium"
            >
              {showMemberManager ? "Close manager" : "Assign member"}
            </button>
          </div>

          {/* Member manager */}

          {showMemberManager && (
            <div className="mt-6 rounded-2xl border border-[var(--border)] p-5">
              {memberError && (
                <div className="mb-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
                  {memberError}
                </div>
              )}

              {memberMessage && (
                <div className="mb-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-600">
                  {memberMessage}
                </div>
              )}

              <div className="mb-4">
                <p className="text-sm font-semibold">Tenant members</p>

                <p className="identity-muted mt-1 text-xs">
                  Assign this role to a tenant member.
                </p>
              </div>

              <input
                type="text"
                value={memberSearch}
                onChange={(event) => setMemberSearch(event.target.value)}
                placeholder="Search members..."
                className="w-full rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 text-sm outline-none focus:border-[var(--primary)]"
              />

              <div className="mt-4 max-h-96 overflow-y-auto rounded-xl border border-[var(--border)]">
                {membersLoading ? (
                  <div className="p-6 text-center">
                    <p className="identity-muted text-sm">Loading members...</p>
                  </div>
                ) : filteredMembers.length === 0 ? (
                  <div className="p-6 text-center">
                    <p className="text-sm font-medium">No members found</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border)]">
                    {filteredMembers.map((member) => {
                      const assigned = memberHasRole(member.userId);

                      const actionLoading =
                        memberActionLoading === member.userId;

                      return (
                        <div
                          key={member.id}
                          className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">
                              {member.user.email}
                            </p>

                            <p className="identity-muted mt-1 break-all font-mono text-xs">
                              {member.userId}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="rounded-md bg-[var(--surface-hover)] px-2 py-1 text-xs">
                                {member.user.status}
                              </span>

                              {assigned && (
                                <span className="rounded-md bg-[var(--primary-soft)] px-2 py-1 text-xs text-[var(--primary)]">
                                  Assigned
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={assigned || actionLoading}
                            onClick={() => handleAssignMember(member.userId)}
                            className="identity-button-primary shrink-0 rounded-xl px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {actionLoading
                              ? "Assigning..."
                              : assigned
                              ? "Assigned"
                              : "Assign"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assigned member summary */}

          <div className="mt-6 rounded-xl border border-[var(--border)] p-5">
            {membersLoading ? (
              <p className="identity-muted text-sm">
                Loading member assignments...
              </p>
            ) : members.length === 0 ? (
              <div className="text-center">
                <p className="text-sm font-medium">No tenant members found</p>
              </div>
            ) : (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-subtle)]">
                  Role assignment status
                </p>

                <div className="mt-4 space-y-3">
                  {assignedMembers.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {member.user.email}
                        </p>

                        <p className="identity-muted text-xs">
                          {member.userId}
                        </p>
                      </div>

                      <span className="shrink-0 rounded-full bg-[var(--primary-soft)] px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                        Assigned
                      </span>
                    </div>
                  ))}

                  {assignedMembers.length === 0 && (
                    <p className="identity-muted text-sm">
                      No members are currently assigned to this role.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* DANGER ZONE                                                        */}
        {/* ------------------------------------------------------------------ */}

        <section className="mt-6 rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--danger)]">
            Danger zone
          </p>

          <h2 className="mt-2 text-base font-semibold">Delete role</h2>

          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            {isBuiltIn
              ? "The built-in tenant-admin role cannot be deleted."
              : "Deleting this role will remove the role from the tenant."}
          </p>

          {deleteError && (
            <div className="mt-4 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
              {deleteError}
            </div>
          )}

          {deleteSuccess && (
            <div className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-600">
              {deleteSuccess}
            </div>
          )}

          <button
            type="button"
            disabled={isBuiltIn || deleteLoading}
            onClick={handleDeleteRole}
            className="mt-4 rounded-xl border border-[var(--danger)]/30 px-4 py-2.5 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleteLoading
              ? "Deleting..."
              : isBuiltIn
              ? "Cannot delete built-in role"
              : "Delete role"}
          </button>
        </section>
      </div>
    </main>
  );
}

/* ========================================================================== */
/* DETAIL                                                                     */
/* ========================================================================== */

function Detail({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-subtle)]">
        {label}
      </p>

      <p
        className={`mt-2 break-all text-sm text-[var(--foreground)] ${
          mono ? "font-mono" : ""
        }`}
      >
        {value || "—"}
      </p>
    </div>
  );
}

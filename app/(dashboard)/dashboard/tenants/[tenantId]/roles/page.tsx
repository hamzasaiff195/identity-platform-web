"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import {
  createTenantRole,
  deleteRole,
  getTenantRoles,
  updateRole,
  type CreateTenantRoleInput,
  type Role,
  type UpdateRoleInput,
} from "@/lib/roles-api";

import { useAuth } from "@/providers/auth-provider";

export default function TenantRolesPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const { accessToken, loading: authLoading } = useAuth();

  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  // ---------------------------------------------------------------------------
  // Load roles
  // ---------------------------------------------------------------------------

  const loadRoles = useCallback(async () => {
    if (!accessToken || !tenantId) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await getTenantRoles(accessToken, tenantId);

      setRoles(result);
    } catch (error) {
      console.error("[ROLES] Failed to load roles:", error);

      setError(
        error instanceof Error ? error.message : "Unable to load roles."
      );
    } finally {
      setLoading(false);
    }
  }, [accessToken, tenantId]);

  // ---------------------------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!accessToken || !tenantId) {
      setLoading(false);
      return;
    }

    void loadRoles();
  }, [accessToken, authLoading, tenantId, loadRoles]);

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  const filteredRoles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return roles;
    }

    return roles.filter((role) => {
      return (
        role.name.toLowerCase().includes(query) ||
        role.slug.toLowerCase().includes(query) ||
        role.scope.toLowerCase().includes(query) ||
        (role.tenantId ?? "").toLowerCase().includes(query) ||
        (role.description ?? "").toLowerCase().includes(query)
      );
    });
  }, [roles, search]);

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  async function handleCreate(input: CreateTenantRoleInput) {
    if (!accessToken) {
      throw new Error("Authentication required.");
    }

    try {
      setSaving(true);
      setError("");

      await createTenantRole(accessToken, tenantId, input);

      setShowCreateModal(false);

      await loadRoles();
    } catch (error) {
      console.error("[ROLES] Failed to create role:", error);

      throw error;
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  async function handleUpdate(roleId: string, input: UpdateRoleInput) {
    if (!accessToken) {
      throw new Error("Authentication required.");
    }

    try {
      setSaving(true);
      setError("");

      await updateRole(accessToken, roleId, input);

      setEditingRole(null);

      await loadRoles();
    } catch (error) {
      console.error("[ROLES] Failed to update role:", error);

      throw error;
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  async function handleDelete() {
    if (!accessToken || !deletingRole) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await deleteRole(accessToken, deletingRole.id);

      setDeletingRole(null);

      await loadRoles();
    } catch (error) {
      console.error("[ROLES] Failed to delete role:", error);

      setError(
        error instanceof Error ? error.message : "Unable to delete role."
      );
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (authLoading || loading) {
    return (
      <main className="identity-page min-h-screen p-6">
        {" "}
        <div className="mx-auto max-w-7xl">
          {" "}
          <div className="identity-surface rounded-2xl p-8">
            {" "}
            <p className="identity-muted text-sm">Loading roles...</p>{" "}
          </div>{" "}
        </div>{" "}
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Page
  // ---------------------------------------------------------------------------

  return (
    <main className="identity-page min-h-screen p-6">
      {" "}
      <div className="mx-auto max-w-7xl">
        {/* Header */}

        <div className="mb-8">
          <Link
            href={`/dashboard/tenants/${tenantId}`}
            className="identity-muted text-sm hover:text-[var(--foreground)]"
          >
            ← Tenant administration
          </Link>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="identity-eyebrow">Tenant administration</p>

              <h1 className="mt-2 text-2xl font-semibold">Tenant Roles</h1>

              <p className="identity-muted mt-1 text-sm">
                Manage roles and the permissions available to this tenant.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="identity-button-primary rounded-xl px-4 py-2.5 text-sm font-medium"
            >
              + Create Role
            </button>
          </div>
        </div>

        {/* Error */}

        {error && (
          <div className="mb-6 rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        {/* Stats */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <RoleStat label="Total Roles" value={roles.length} />

          <RoleStat
            label="Active"
            value={roles.filter((role) => role.isActive).length}
          />

          <RoleStat
            label="Tenant Roles"
            value={roles.filter((role) => role.scope === "TENANT").length}
          />
        </div>

        {/* Roles */}

        <section className="identity-surface overflow-hidden rounded-2xl">
          {/* Toolbar */}

          <div className="border-b border-[var(--border)] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold">Roles</h2>

                <p className="identity-muted mt-1 text-sm">
                  Create roles and manage the permissions assigned to them.
                </p>
              </div>

              <div className="w-full lg:max-w-sm">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search roles..."
                  className="
                h-10
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
              "
                />
              </div>
            </div>
          </div>

          {/* Table */}

          {filteredRoles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <TableHeader>Role</TableHeader>
                    <TableHeader>Scope</TableHeader>
                    <TableHeader>Tenant ID</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Created</TableHeader>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRoles.map((role) => (
                    <RoleRow
                      key={role.id}
                      role={role}
                      tenantId={tenantId}
                      onEdit={() => setEditingRole(role)}
                      onDelete={() => setDeletingRole(role)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyRoles search={search} />
          )}
        </section>
      </div>
      {/* ------------------------------------------------------------------ */}
      {/* Create modal                                                        */}
      {/* ------------------------------------------------------------------ */}
      {showCreateModal && (
        <RoleFormDialog
          mode="create"
          title="Create Role"
          submitLabel="Create Role"
          loading={saving}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
        />
      )}
      {/* ------------------------------------------------------------------ */}
      {/* Edit modal                                                          */}
      {/* ------------------------------------------------------------------ */}
      {editingRole && (
        <RoleFormDialog
          mode="edit"
          title="Edit Role"
          submitLabel="Save Changes"
          role={editingRole}
          loading={saving}
          onClose={() => setEditingRole(null)}
          onSubmit={(input) => handleUpdate(editingRole.id, input)}
        />
      )}
      {/* ------------------------------------------------------------------ */}
      {/* Delete modal                                                        */}
      {/* ------------------------------------------------------------------ */}
      {deletingRole && (
        <DeleteRoleDialog
          role={deletingRole}
          loading={saving}
          onCancel={() => setDeletingRole(null)}
          onConfirm={() => void handleDelete()}
        />
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Role row                                                                   */
/* -------------------------------------------------------------------------- */

function RoleRow({
  role,
  tenantId,
  onEdit,
  onDelete,
}: {
  role: Role;
  tenantId: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)]">
      {" "}
      <td className="px-6 py-5">
        {" "}
        <div>
          {" "}
          <p className="text-sm font-medium">{role.name}</p>
          <p className="mt-1 font-mono text-xs text-[var(--foreground-muted)]">
            {role.slug}
          </p>
          {role.description && (
            <p className="mt-1 max-w-md text-xs text-[var(--foreground-muted)]">
              {role.description}
            </p>
          )}
          <p className="mt-2 font-mono text-[10px] text-[var(--foreground-muted)]">
            ID: {role.id}
          </p>
        </div>
      </td>
      <td className="px-6 py-5">
        <ScopeBadge scope={role.scope} />
      </td>
      <td className="px-6 py-5">
        <span className="font-mono text-xs text-[var(--foreground-muted)]">
          {role.tenantId ?? tenantId}
        </span>
      </td>
      <td className="px-6 py-5">
        <StatusBadge active={role.isActive && !role.isDeleted} />
      </td>
      <td className="px-6 py-5 text-sm text-[var(--foreground-muted)]">
        {formatDate(role.createdAt)}
      </td>
      <td className="px-6 py-5">
        <div className="flex justify-end gap-2">
          <Link
            href={`/dashboard/tenants/${tenantId}/roles/${role.id}/permissions`}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium hover:bg-[var(--background)]"
          >
            Permissions
          </Link>

          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-medium hover:bg-[var(--background)]"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-[var(--danger)] px-3 py-2 text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)]"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

/* -------------------------------------------------------------------------- */
/* Create / Edit dialog                                                       */
/* -------------------------------------------------------------------------- */

type RoleFormDialogProps =
  | {
      mode: "create";
      title: string;
      submitLabel: string;
      loading: boolean;
      onClose: () => void;
      onSubmit: (input: CreateTenantRoleInput) => Promise<void>;
      role?: never;
    }
  | {
      mode: "edit";
      title: string;
      submitLabel: string;
      loading: boolean;
      onClose: () => void;
      onSubmit: (input: UpdateRoleInput) => Promise<void>;
      role: Role;
    };

function RoleFormDialog(props: RoleFormDialogProps) {
  const { title, submitLabel, loading, onClose } = props;

  const role = props.mode === "edit" ? props.role : undefined;

  const [form, setForm] = useState({
    name: role?.name ?? "",
    slug: role?.slug ?? "",
    description: role?.description ?? "",
  });

  const [error, setError] = useState("");

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Role name is required.");
      return;
    }

    if (!form.slug.trim()) {
      setError("Role slug is required.");
      return;
    }

    try {
      setError("");

      if (props.mode === "edit") {
        await props.onSubmit({
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || undefined,
        });
      } else {
        await props.onSubmit({
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || undefined,
          scope: "TENANT",
        });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save role.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
    >
      {" "}
      <div className="w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        {/* Header */}

        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>

            <p className="identity-muted mt-1 text-sm">
              Configure the tenant role.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-[var(--foreground-muted)] hover:bg-[var(--background)] disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Form */}

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            {error && (
              <div className="rounded-lg border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
                {error}
              </div>
            )}

            <RoleField
              label="Name"
              value={form.name}
              disabled={loading}
              placeholder="Tenant Administrator"
              onChange={(value) => updateField("name", value)}
            />

            <RoleField
              label="Slug"
              value={form.slug}
              disabled={loading}
              placeholder="tenant-admin"
              onChange={(value) => updateField("slug", value)}
            />

            <div>
              <label className="mb-2 block text-sm font-medium">Scope</label>

              <div className="flex h-10 items-center rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 text-sm">
                TENANT
              </div>

              <p className="identity-muted mt-1 text-xs">
                Tenant roles can only be used inside this tenant.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>

              <textarea
                value={form.description}
                disabled={loading}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                rows={4}
                placeholder="Describe what this role is responsible for..."
                className="
              w-full
              rounded-lg
              border
              border-[var(--border)]
              bg-[var(--surface)]
              px-3
              py-2.5
              text-sm
              text-[var(--foreground)]
              outline-none
              focus:border-[var(--primary)]
              focus:ring-2
              focus:ring-[var(--primary)]/10
              disabled:opacity-60
            "
              />
            </div>
          </div>

          {/* Footer */}

          <div className="flex justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="identity-button-primary rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
            >
              {loading ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Delete dialog                                                              */
/* -------------------------------------------------------------------------- */

function DeleteRoleDialog({
  role,
  loading,
  onCancel,
  onConfirm,
}: {
  role: Role;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      {" "}
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        {" "}
        <h2 className="text-lg font-semibold">Delete role </h2>
        <p className="identity-muted mt-2 text-sm">
          Are you sure you want to delete{" "}
          <span className="font-medium text-[var(--foreground)]">
            {role.name}
          </span>
          ?
        </p>
        <p className="mt-3 text-sm text-[var(--danger)]">
          This may affect members and permissions currently using this role.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-[var(--danger)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Deleting..." : "Delete Role"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Field                                                                      */
/* -------------------------------------------------------------------------- */

function RoleField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      {" "}
      <label className="mb-2 block text-sm font-medium">{label} </label>
      <input
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="
      h-10
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
      disabled:opacity-60
    "
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat                                                                       */
/* -------------------------------------------------------------------------- */

function RoleStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="identity-surface rounded-2xl p-5">
      {" "}
      <p className="identity-muted text-sm">{label} </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Table header                                                               */
/* -------------------------------------------------------------------------- */

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
      {children}{" "}
    </th>
  );
}

/* -------------------------------------------------------------------------- */
/* Scope                                                                      */
/* -------------------------------------------------------------------------- */

function ScopeBadge({ scope }: { scope: Role["scope"] }) {
  return (
    <span
      className="
     inline-flex
     items-center
     rounded-full
     bg-[var(--background)]
     px-3
     py-1.5
     text-xs
     font-medium
   "
    >
      {scope}{" "}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Status                                                                     */
/* -------------------------------------------------------------------------- */

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
        active
          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
      }`}
    >
      {" "}
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                */
/* -------------------------------------------------------------------------- */

function EmptyRoles({ search }: { search: string }) {
  return (
    <div className="px-6 py-16 text-center">
      {" "}
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--background)] text-xl text-[var(--foreground-muted)]">
        🛡️{" "}
      </div>
      <p className="mt-4 text-sm font-medium">No roles found</p>
      <p className="identity-muted mt-1 text-sm">
        {search
          ? "Try adjusting your search."
          : "Create the first role for this tenant."}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Date                                                                       */
/* -------------------------------------------------------------------------- */

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

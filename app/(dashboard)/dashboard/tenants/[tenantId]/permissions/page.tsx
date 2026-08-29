"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import {
  createPermission,
  deletePermission,
  getPermissions,
  updatePermission,
  type CreatePermissionInput,
  type Permission,
  type UpdatePermissionInput,
} from "@/lib/permissions-api";

import { useAuth } from "@/providers/auth-provider";

export default function TenantPermissionsPage() {
  const params = useParams<{ tenantId: string }>();
  const tenantId = params.tenantId;

  const { accessToken, loading: authLoading } = useAuth();

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);

  const [editingPermission, setEditingPermission] = useState<Permission | null>(
    null
  );

  const [deletingPermission, setDeletingPermission] =
    useState<Permission | null>(null);

  // ---------------------------------------------------------------------------
  // Load permissions
  // ---------------------------------------------------------------------------

  const loadPermissions = useCallback(async () => {
    if (!accessToken || !tenantId) {
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
        error instanceof Error ? error.message : "Unable to load permissions."
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

    void loadPermissions();
  }, [accessToken, authLoading, tenantId, loadPermissions]);

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  const filteredPermissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return permissions;
    }

    return permissions.filter((permission) => {
      return (
        permission.name.toLowerCase().includes(query) ||
        permission.slug.toLowerCase().includes(query) ||
        permission.resource.toLowerCase().includes(query) ||
        permission.action.toLowerCase().includes(query) ||
        (permission.description ?? "").toLowerCase().includes(query)
      );
    });
  }, [permissions, search]);

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  async function handleCreate(input: CreatePermissionInput) {
    if (!accessToken) {
      throw new Error("Authentication required.");
    }

    try {
      setSaving(true);
      setError("");

      await createPermission(accessToken, input);

      setShowCreateModal(false);

      await loadPermissions();
    } catch (error) {
      console.error("[PERMISSIONS] Failed to create permission:", error);

      throw error;
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  async function handleUpdate(
    permissionId: string,
    input: UpdatePermissionInput
  ) {
    if (!accessToken) {
      throw new Error("Authentication required.");
    }

    try {
      setSaving(true);
      setError("");

      await updatePermission(accessToken, permissionId, input);

      setEditingPermission(null);

      await loadPermissions();
    } catch (error) {
      console.error("[PERMISSIONS] Failed to update permission:", error);

      throw error;
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  async function handleDelete() {
    if (!accessToken || !deletingPermission) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await deletePermission(accessToken, deletingPermission.id);

      setDeletingPermission(null);

      await loadPermissions();
    } catch (error) {
      console.error("[PERMISSIONS] Failed to delete permission:", error);

      setError(
        error instanceof Error ? error.message : "Unable to delete permission."
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
        <div className="mx-auto max-w-7xl">
          <div className="identity-surface rounded-2xl p-8">
            <p className="identity-muted text-sm">Loading permissions...</p>
          </div>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Page
  // ---------------------------------------------------------------------------

  return (
    <main className="identity-page min-h-screen p-6">
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

              <h1 className="mt-2 text-2xl font-semibold">
                Tenant Permissions
              </h1>

              <p className="identity-muted mt-1 text-sm">
                Manage permissions available to this tenant.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="identity-button-primary rounded-xl px-4 py-2.5 text-sm font-medium"
            >
              + Create Permission
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
          <PermissionStat
            label="Total Permissions"
            value={permissions.length}
          />

          <PermissionStat
            label="Active"
            value={
              permissions.filter((permission) => permission.isActive).length
            }
          />

          <PermissionStat
            label="Resources"
            value={
              new Set(permissions.map((permission) => permission.resource)).size
            }
          />
        </div>

        {/* Permissions */}

        <section className="identity-surface overflow-hidden rounded-2xl">
          {/* Toolbar */}

          <div className="border-b border-[var(--border)] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold">Permissions</h2>

                <p className="identity-muted mt-1 text-sm">
                  Define the actions users can perform on tenant resources.
                </p>
              </div>

              <div className="w-full lg:max-w-sm">
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

          {filteredPermissions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <TableHeader>Permission</TableHeader>
                    <TableHeader>Resource</TableHeader>
                    <TableHeader>Action</TableHeader>
                    <TableHeader>Status</TableHeader>
                    <TableHeader>Created</TableHeader>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredPermissions.map((permission) => (
                    <PermissionRow
                      key={permission.id}
                      permission={permission}
                      onEdit={() => setEditingPermission(permission)}
                      onDelete={() => setDeletingPermission(permission)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyPermissions search={search} />
          )}
        </section>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Create modal                                                        */}
      {/* ------------------------------------------------------------------ */}

      {showCreateModal && (
        <PermissionFormDialog
          mode="create"
          title="Create Permission"
          submitLabel="Create Permission"
          loading={saving}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreate}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Edit modal                                                          */}
      {/* ------------------------------------------------------------------ */}

      {editingPermission && (
        <PermissionFormDialog
          mode="edit"
          title="Edit Permission"
          submitLabel="Save Changes"
          permission={editingPermission}
          loading={saving}
          onClose={() => setEditingPermission(null)}
          onSubmit={(input) => handleUpdate(editingPermission.id, input)}
        />
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Delete modal                                                        */}
      {/* ------------------------------------------------------------------ */}

      {deletingPermission && (
        <DeletePermissionDialog
          permission={deletingPermission}
          loading={saving}
          onCancel={() => setDeletingPermission(null)}
          onConfirm={() => void handleDelete()}
        />
      )}
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Permission row                                                             */
/* -------------------------------------------------------------------------- */

function PermissionRow({
  permission,
  onEdit,
  onDelete,
}: {
  permission: Permission;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <tr className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)]">
      <td className="px-6 py-5">
        <div>
          <p className="text-sm font-medium">{permission.name}</p>

          <p className="mt-1 font-mono text-xs text-[var(--foreground-muted)]">
            {permission.slug}
          </p>

          {permission.description && (
            <p className="mt-1 max-w-md text-xs text-[var(--foreground-muted)]">
              {permission.description}
            </p>
          )}
        </div>
      </td>

      <td className="px-6 py-5">
        <span className="rounded-md bg-[var(--background)] px-2.5 py-1 font-mono text-xs">
          {permission.resource}
        </span>
      </td>

      <td className="px-6 py-5">
        <span className="rounded-md bg-[var(--background)] px-2.5 py-1 font-mono text-xs">
          {permission.action}
        </span>
      </td>

      <td className="px-6 py-5">
        <StatusBadge active={permission.isActive} />
      </td>

      <td className="px-6 py-5 text-sm text-[var(--foreground-muted)]">
        {formatDate(permission.createdAt)}
      </td>

      <td className="px-6 py-5 text-right">
        <div className="flex justify-end gap-2">
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

type PermissionFormDialogProps =
  | {
      mode: "create";
      title: string;
      submitLabel: string;
      loading: boolean;
      onClose: () => void;
      onSubmit: (input: CreatePermissionInput) => Promise<void>;
      permission?: never;
    }
  | {
      mode: "edit";
      title: string;
      submitLabel: string;
      loading: boolean;
      onClose: () => void;
      onSubmit: (input: UpdatePermissionInput) => Promise<void>;
      permission: Permission;
    };

function PermissionFormDialog(props: PermissionFormDialogProps) {
  const { title, submitLabel, loading, onClose } = props;

  const permission = props.mode === "edit" ? props.permission : undefined;

  const [form, setForm] = useState({
    name: permission?.name ?? "",
    slug: permission?.slug ?? "",
    description: permission?.description ?? "",
    resource: permission?.resource ?? "",
    action: permission?.action ?? "",
    isActive: permission?.isActive ?? true,
  });

  const [error, setError] = useState("");

  function updateField(field: keyof typeof form, value: string | boolean) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Permission name is required.");
      return;
    }

    if (!form.slug.trim()) {
      setError("Permission slug is required.");
      return;
    }

    if (!form.resource.trim()) {
      setError("Resource is required.");
      return;
    }

    if (!form.action.trim()) {
      setError("Action is required.");
      return;
    }

    try {
      setError("");

      if (props.mode === "edit") {
        await props.onSubmit({
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || undefined,
          resource: form.resource.trim(),
          action: form.action.trim(),
          isActive: form.isActive,
        });
      } else {
        await props.onSubmit({
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || undefined,
          resource: form.resource.trim(),
          action: form.action.trim(),
        });
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to save permission."
      );
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
      <div className="w-full max-w-xl rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        {/* Header */}

        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>

            <p className="identity-muted mt-1 text-sm">
              Configure the permission definition.
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

            <PermissionField
              label="Name"
              value={form.name}
              disabled={loading}
              onChange={(value) => updateField("name", value)}
            />

            <PermissionField
              label="Slug"
              value={form.slug}
              disabled={loading}
              placeholder="members.read"
              onChange={(value) => updateField("slug", value)}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <PermissionField
                label="Resource"
                value={form.resource}
                disabled={loading}
                placeholder="members"
                onChange={(value) => updateField("resource", value)}
              />

              <PermissionField
                label="Action"
                value={form.action}
                disabled={loading}
                placeholder="read"
                onChange={(value) => updateField("action", value)}
              />
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
                placeholder="Describe what this permission allows..."
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

            {props.mode === "edit" && (
              <label className="flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  disabled={loading}
                  onChange={(event) =>
                    updateField("isActive", event.target.checked)
                  }
                />

                <span>Permission is active</span>
              </label>
            )}
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

function DeletePermissionDialog({
  permission,
  loading,
  onCancel,
  onConfirm,
}: {
  permission: Permission;
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
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        <h2 className="text-lg font-semibold">Delete permission</h2>

        <p className="identity-muted mt-2 text-sm">
          Are you sure you want to delete{" "}
          <span className="font-medium text-[var(--foreground)]">
            {permission.name}
          </span>
          ?
        </p>

        <p className="mt-3 text-sm text-[var(--danger)]">
          This may affect roles that currently use this permission.
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
            {loading ? "Deleting..." : "Delete Permission"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Field                                                                      */
/* -------------------------------------------------------------------------- */

function PermissionField({
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
      <label className="mb-2 block text-sm font-medium">{label}</label>

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

function PermissionStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="identity-surface rounded-2xl p-5">
      <p className="identity-muted text-sm">{label}</p>

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
      {children}
    </th>
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
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {active ? "Active" : "Inactive"}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                */
/* -------------------------------------------------------------------------- */

function EmptyPermissions({ search }: { search: string }) {
  return (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--background)] text-xl text-[var(--foreground-muted)]">
        🔐
      </div>

      <p className="mt-4 text-sm font-medium">No permissions found</p>

      <p className="identity-muted mt-1 text-sm">
        {search
          ? "Try adjusting your search."
          : "Create the first permission for this tenant."}
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

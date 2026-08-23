"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/providers/auth-provider";
import { getRole, updateRole, deleteRole, type Role } from "@/lib/roles-api";

import RolePermissions from "../components/role-permissions";
import { Button } from "@/components/ui/button";

export default function RoleDetailPage() {
  const params = useParams<{ roleId: string }>();
  const router = useRouter();
  const { accessToken } = useAuth();

  const roleId = params.roleId;

  const [role, setRole] = useState<Role | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  // ---------------------------------------------------------------------------
  // Load role
  // ---------------------------------------------------------------------------

  const loadRole = useCallback(async () => {
    if (!accessToken || !roleId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await getRole(accessToken, roleId);

      setRole(result);
      setName(result.name);
      setSlug(result.slug);
      setDescription(result.description ?? "");
    } catch (error) {
      console.error("[ROLE] Failed to load role:", error);

      setError(error instanceof Error ? error.message : "Unable to load role");
    } finally {
      setLoading(false);
    }
  }, [accessToken, roleId]);

  useEffect(() => {
    loadRole();
  }, [loadRole]);

  // ---------------------------------------------------------------------------
  // Save role
  // ---------------------------------------------------------------------------

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();

    if (!accessToken || !role) {
      return;
    }

    if (!name.trim() || !slug.trim()) {
      setError("Role name and slug are required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const updatedRole = await updateRole(accessToken, role.id, {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim() || undefined,
      });

      setRole(updatedRole);

      setName(updatedRole.name);
      setSlug(updatedRole.slug);
      setDescription(updatedRole.description ?? "");

      setEditing(false);
    } catch (error) {
      console.error("[ROLE] Failed to update role:", error);

      setError(
        error instanceof Error ? error.message : "Unable to update role"
      );
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Delete role
  // ---------------------------------------------------------------------------

  async function handleDelete() {
    if (!accessToken || !role) {
      return;
    }

    const confirmed = window.confirm(
      `Delete the role "${role.name}"? This action cannot be undone from this screen.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setDeleting(true);
      setError("");

      await deleteRole(accessToken, role.id);

      router.push("/dashboard/roles");
    } catch (error) {
      console.error("[ROLE] Failed to delete role:", error);

      setError(
        error instanceof Error ? error.message : "Unable to delete role"
      );
    } finally {
      setDeleting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-full bg-[var(--background)] p-6 lg:p-8">
        <div className="flex min-h-[500px] items-center justify-center">
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
              Loading role...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Role not found
  // ---------------------------------------------------------------------------

  if (!role) {
    return (
      <main className="min-h-full bg-[var(--background)] p-6 lg:p-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/dashboard/roles"
            className="text-sm font-medium text-[var(--primary)] hover:underline"
          >
            ← Back to roles
          </Link>

          <div
            className="
              mt-6
              rounded-xl
              border
              border-[var(--danger)]
              bg-[var(--danger-soft)]
              px-6
              py-5
              text-sm
              text-[var(--danger)]
            "
          >
            {error || "Role not found."}
          </div>
        </div>
      </main>
    );
  }

  const isActive = role.isActive && !role.isDeleted;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main className="min-h-full bg-[var(--background)] p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* ------------------------------------------------------------------ */}
        {/* Breadcrumb */}
        {/* ------------------------------------------------------------------ */}

        <div className="mb-6">
          <Link
            href="/dashboard/roles"
            className="
              text-sm
              font-medium
              text-[var(--primary)]
              hover:underline
            "
          >
            ← Back to roles
          </Link>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Header */}
        {/* ------------------------------------------------------------------ */}

        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--primary)]">
              Authorization / Role
            </p>

            <div className="mt-2 flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">
                {role.name}
              </h1>

              <RoleStatusBadge
                isActive={role.isActive}
                isDeleted={role.isDeleted}
              />
            </div>

            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Manage this role and its permissions.
            </p>
          </div>

          {!editing && (
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={() => setEditing(true)}
                disabled={role.isDeleted}
              >
                Edit role
              </Button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || role.isDeleted}
                className="
                  rounded-lg
                  border
                  border-[var(--danger)]
                  bg-[var(--surface)]
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-[var(--danger)]
                  transition
                  hover:bg-[var(--danger-soft)]
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          )}
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Error */}
        {/* ------------------------------------------------------------------ */}

        {error && (
          <div
            className="
              mb-6
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
              onClick={loadRole}
              className="font-medium underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* Role information */}
        {/* ------------------------------------------------------------------ */}

        <section
          className="
            mb-6
            overflow-hidden
            rounded-xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
            shadow-[var(--shadow-sm)]
          "
        >
          <div
            className="
              border-b
              border-[var(--border)]
              px-6
              py-5
            "
          >
            <h2 className="font-semibold text-[var(--foreground)]">
              Role information
            </h2>

            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Basic information about this role.
            </p>
          </div>

          {editing ? (
            <form onSubmit={handleSave}>
              <div className="grid gap-5 px-6 py-6 md:grid-cols-2">
                <FormField
                  label="Name"
                  value={name}
                  placeholder="Manager"
                  onChange={setName}
                />

                <FormField
                  label="Slug"
                  value={slug}
                  placeholder="manager"
                  onChange={setSlug}
                />

                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                    Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={4}
                    placeholder="Describe this role..."
                    className="
                      w-full
                      rounded-lg
                      border
                      border-[var(--border)]
                      bg-[var(--surface)]
                      px-3
                      py-2
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
                  onClick={() => {
                    setEditing(false);
                    setName(role.name);
                    setSlug(role.slug);
                    setDescription(role.description ?? "");
                    setError("");
                  }}
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
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="grid gap-6 px-6 py-6 md:grid-cols-2">
              <DetailField label="Name" value={role.name} />

              <DetailField label="Slug" value={role.slug} mono />

              <DetailField label="Scope" value={role.scope} />

              <DetailField
                label="Status"
                value={isActive ? "Active" : "Inactive"}
              />

              <DetailField
                label="Created"
                value={new Date(role.createdAt).toLocaleString()}
              />

              <DetailField
                label="Updated"
                value={new Date(role.updatedAt).toLocaleString()}
              />

              <div className="md:col-span-2">
                <DetailField
                  label="Description"
                  value={role.description || "No description"}
                />
              </div>

              <div className="md:col-span-2">
                <DetailField label="Role ID" value={role.id} mono />
              </div>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* Permissions */}
        {/* ------------------------------------------------------------------ */}

        {!role.isDeleted && <RolePermissions roleId={role.id} />}
      </div>
    </main>
  );
}

// =============================================================================
// Detail Field
// =============================================================================

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
        {label}
      </p>

      <p
        className={
          mono
            ? "break-all font-mono text-sm text-[var(--foreground)]"
            : "text-sm text-[var(--foreground)]"
        }
      >
        {value}
      </p>
    </div>
  );
}

// =============================================================================
// Form Field
// =============================================================================

function FormField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
        {label}
      </label>

      <input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
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
  );
}

// =============================================================================
// Status Badge
// =============================================================================

function RoleStatusBadge({
  isActive,
  isDeleted,
}: {
  isActive: boolean;
  isDeleted: boolean;
}) {
  if (isDeleted) {
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
        DELETED
      </span>
    );
  }

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

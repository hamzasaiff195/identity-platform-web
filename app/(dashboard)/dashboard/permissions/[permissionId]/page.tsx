"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";

import {
  deletePermission,
  getPermission,
  updatePermission,
  type Permission,
} from "@/lib/permissions-api";

export default function PermissionDetailsPage() {
  const { accessToken } = useAuth();

  const params = useParams();
  const router = useRouter();

  const permissionId = params.permissionId as string;

  const [permission, setPermission] = useState<Permission | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [resource, setResource] = useState("");
  const [action, setAction] = useState("");
  const [isActive, setIsActive] = useState(true);

  // ---------------------------------------------------------------------------
  // Load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!accessToken || !permissionId) {
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await getPermission(accessToken, permissionId);

        setPermission(result);

        setName(result.name);
        setSlug(result.slug);
        setDescription(result.description ?? "");
        setResource(result.resource);
        setAction(result.action);
        setIsActive(result.isActive);
      } catch (error) {
        console.error("[PERMISSION] Failed to load permission:", error);

        setError(
          error instanceof Error ? error.message : "Unable to load permission"
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [accessToken, permissionId]);

  // ---------------------------------------------------------------------------
  // Update
  // ---------------------------------------------------------------------------

  async function handleUpdate(event: React.FormEvent) {
    event.preventDefault();

    if (!accessToken || !permission) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      const result = await updatePermission(accessToken, permission.id, {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim(),
        resource: resource.trim().toLowerCase(),
        action: action.trim().toLowerCase(),
        isActive,
      });

      setPermission(result);

      setName(result.name);
      setSlug(result.slug);
      setDescription(result.description ?? "");
      setResource(result.resource);
      setAction(result.action);
      setIsActive(result.isActive);

      setEditing(false);
    } catch (error) {
      console.error("[PERMISSION] Failed to update permission:", error);

      setError(
        error instanceof Error ? error.message : "Unable to update permission"
      );
    } finally {
      setSaving(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  async function handleDelete() {
    if (!accessToken || !permission) {
      return;
    }

    const confirmed = window.confirm(`Delete permission "${permission.name}"?`);

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await deletePermission(accessToken, permission.id);

      router.push("/dashboard/permissions");
    } catch (error) {
      console.error("[PERMISSION] Failed to delete permission:", error);

      setError(
        error instanceof Error ? error.message : "Unable to delete permission"
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (loading) {
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
              Loading permission...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!permission) {
    return (
      <main className="min-h-full bg-[var(--background)] p-6 lg:p-8">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8">
          <p className="text-sm text-[var(--danger)]">
            {error || "Permission not found."}
          </p>

          <Link
            href="/dashboard/permissions"
            className="
              mt-4
              inline-flex
              text-sm
              font-medium
              text-[var(--primary)]
              hover:underline
            "
          >
            ← Back to permissions
          </Link>
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
          <Link
            href="/dashboard/permissions"
            className="
              text-sm
              text-[var(--foreground-muted)]
              hover:text-[var(--foreground)]
              hover:underline
            "
          >
            ← Permissions
          </Link>

          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--primary)]">
            Authorization
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
            {permission.name}
          </h1>

          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Manage permission details and authorization metadata.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
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
              Edit
            </button>
          )}

          <button
            type="button"
            onClick={handleDelete}
            className="
              rounded-lg
              bg-[var(--danger)]
              px-4
              py-2
              text-sm
              font-medium
              text-white
            "
          >
            Delete
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Error */}
      {/* ------------------------------------------------------------------ */}

      {error && (
        <div
          className="
            mb-6
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

      {/* ------------------------------------------------------------------ */}
      {/* Details */}
      {/* ------------------------------------------------------------------ */}

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
        <div
          className="
            border-b
            border-[var(--border)]
            px-6
            py-5
          "
        >
          <h2 className="font-semibold text-[var(--foreground)]">
            Permission Details
          </h2>
        </div>

        {editing ? (
          <form onSubmit={handleUpdate} className="space-y-5 px-6 py-6">
            <FormField label="Name" value={name} onChange={setName} />

            <FormField label="Slug" value={slug} onChange={setSlug} />

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Resource"
                value={resource}
                onChange={setResource}
              />

              <FormField label="Action" value={action} onChange={setAction} />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
                Description
              </label>

              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={4}
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
                  focus:border-[var(--primary)]
                  focus:ring-2
                  focus:ring-[var(--primary)]/10
                "
              />
            </div>

            <label className="flex items-center gap-3 text-sm text-[var(--foreground)]">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(event) => setIsActive(event.target.checked)}
                className="h-4 w-4"
              />
              Permission is active
            </label>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="
                  rounded-lg
                  border
                  border-[var(--border)]
                  px-4
                  py-2
                  text-sm
                  font-medium
                  text-[var(--foreground)]
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
                  disabled:opacity-50
                "
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
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
      </section>
    </main>
  );
}

// =============================================================================
// Form Field
// =============================================================================

function FormField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
        {label}
      </label>

      <input
        value={value}
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
          focus:border-[var(--primary)]
          focus:ring-2
          focus:ring-[var(--primary)]/10
        "
      />
    </div>
  );
}

// =============================================================================
// Info
// =============================================================================

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
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

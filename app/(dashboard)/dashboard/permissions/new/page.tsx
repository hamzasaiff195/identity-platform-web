"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/providers/auth-provider";
import {
  createPermission,
  type CreatePermissionInput,
} from "@/lib/permissions-api";

export default function CreatePermissionPage() {
  const { accessToken } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [resource, setResource] = useState("");
  const [action, setAction] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      setError("You are not authenticated.");
      return;
    }

    const input: CreatePermissionInput = {
      name: name.trim(),
      slug: slug.trim().toLowerCase(),
      description: description.trim() || undefined,
      resource: resource.trim().toLowerCase(),
      action: action.trim().toLowerCase(),
    };

    if (!input.name) {
      setError("Permission name is required.");
      return;
    }

    if (!input.slug) {
      setError("Permission slug is required.");
      return;
    }

    if (!input.resource) {
      setError("Resource is required.");
      return;
    }

    if (!input.action) {
      setError("Action is required.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      console.log("[PERMISSIONS] Creating permission:", input);

      const permission = await createPermission(accessToken, input);

      console.log("[PERMISSIONS] Created permission:", permission);

      router.push("/dashboard/permissions");
    } catch (error) {
      console.error("[PERMISSIONS] Failed to create permission:", error);

      setError(
        error instanceof Error ? error.message : "Unable to create permission"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-full bg-[var(--background)] p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
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
          Create permission
        </h1>

        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Define a permission that can be assigned to roles.
        </p>
      </div>

      {/* Error */}
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

      {/* Form */}
      <section
        className="
          max-w-3xl
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

          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            A permission represents an action that can be granted to a role.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
          {/* Name */}
          <FormField
            label="Name"
            value={name}
            onChange={setName}
            placeholder="Tenant Read"
          />

          {/* Slug */}
          <FormField
            label="Slug"
            value={slug}
            onChange={setSlug}
            placeholder="tenant.read"
            mono
          />

          {/* Resource */}
          <FormField
            label="Resource"
            value={resource}
            onChange={setResource}
            placeholder="tenant"
            mono
          />

          {/* Action */}
          <FormField
            label="Action"
            value={action}
            onChange={setAction}
            placeholder="read"
            mono
          />

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Allows reading tenant information."
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

          {/* Preview */}
          <div
            className="
              rounded-lg
              border
              border-[var(--border)]
              bg-[var(--background)]
              px-4
              py-4
            "
          >
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
              Permission Preview
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-[var(--surface)] px-2.5 py-1 font-mono text-xs text-[var(--foreground)]">
                {resource || "resource"}
              </span>

              <span className="text-[var(--foreground-muted)]">.</span>

              <span className="rounded-md bg-[var(--surface)] px-2.5 py-1 font-mono text-xs text-[var(--foreground)]">
                {action || "action"}
              </span>

              <span className="text-xs text-[var(--foreground-muted)]">
                ({slug || "permission.slug"})
              </span>
            </div>
          </div>

          {/* Actions */}
          <div
            className="
              flex
              items-center
              justify-end
              gap-3
              border-t
              border-[var(--border)]
              pt-5
            "
          >
            <Link
              href="/dashboard/permissions"
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
              Cancel
            </Link>

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
              {saving ? "Creating..." : "Create permission"}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  mono = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`
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
          ${mono ? "font-mono" : ""}
        `}
      />
    </div>
  );
}

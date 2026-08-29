"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/providers/auth-provider";
import { createTenant, type CreateTenantInput } from "@/lib/tenants-api";

export default function NewTenantPage() {
  const router = useRouter();
  const { accessToken } = useAuth();

  const [form, setForm] = useState<CreateTenantInput>({
    name: "",
    slug: "",
    description: "",
    legalName: "",
    contactEmail: "",
    contactPhone: "",
    websiteUrl: "",
    country: "",
    state: "",
    city: "",
    timezone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: keyof CreateTenantInput, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      setError("Authentication required.");
      return;
    }

    if (!form.name.trim()) {
      setError("Tenant name is required.");
      return;
    }

    if (!form.slug.trim()) {
      setError("Tenant slug is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await createTenant(accessToken, {
        name: form.name.trim(),
        slug: form.slug.trim().toLowerCase(),
        description: form.description?.trim() || undefined,
        legalName: form.legalName?.trim() || undefined,
        contactEmail: form.contactEmail?.trim() || undefined,
        contactPhone: form.contactPhone?.trim() || undefined,
        websiteUrl: form.websiteUrl?.trim() || undefined,
        country: form.country?.trim() || undefined,
        state: form.state?.trim() || undefined,
        city: form.city?.trim() || undefined,
        timezone: form.timezone?.trim() || undefined,
      });

      router.push(`/dashboard/tenants/${result.id}`);
    } catch (error) {
      console.error("[TENANT] Failed to create tenant:", error);

      setError(
        error instanceof Error ? error.message : "Unable to create tenant"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-full bg-[var(--background)] p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard/tenants"
          className="text-sm font-medium text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
        >
          ← Back to Tenants
        </Link>

        <div className="mt-6">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">
            Create Tenant
          </h1>

          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Create a new organization.
          </p>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]"
        >
          <div className="grid gap-5 p-6 sm:grid-cols-2">
            <FormField
              label="Name"
              value={form.name}
              required
              disabled={loading}
              onChange={(value) => updateField("name", value)}
            />

            <FormField
              label="Slug"
              value={form.slug}
              required
              disabled={loading}
              onChange={(value) => updateField("slug", value)}
            />

            <FormField
              label="Legal Name"
              value={form.legalName ?? ""}
              disabled={loading}
              onChange={(value) => updateField("legalName", value)}
            />

            <FormField
              label="Contact Email"
              type="email"
              value={form.contactEmail ?? ""}
              disabled={loading}
              onChange={(value) => updateField("contactEmail", value)}
            />

            <FormField
              label="Contact Phone"
              value={form.contactPhone ?? ""}
              disabled={loading}
              onChange={(value) => updateField("contactPhone", value)}
            />

            <FormField
              label="Website"
              value={form.websiteUrl ?? ""}
              disabled={loading}
              onChange={(value) => updateField("websiteUrl", value)}
            />

            <FormField
              label="City"
              value={form.city ?? ""}
              disabled={loading}
              onChange={(value) => updateField("city", value)}
            />

            <FormField
              label="State / Province"
              value={form.state ?? ""}
              disabled={loading}
              onChange={(value) => updateField("state", value)}
            />

            <FormField
              label="Country"
              value={form.country ?? ""}
              disabled={loading}
              onChange={(value) => updateField("country", value)}
            />

            <FormField
              label="Timezone"
              value={form.timezone ?? ""}
              disabled={loading}
              onChange={(value) => updateField("timezone", value)}
            />

            <div className="sm:col-span-2">
              <label
                htmlFor="tenant-description"
                className="mb-2 block text-sm font-medium text-[var(--foreground)]"
              >
                Description
              </label>

              <textarea
                id="tenant-description"
                value={form.description ?? ""}
                disabled={loading}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                rows={4}
                placeholder="Describe this organization..."
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 disabled:opacity-60"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
            <button
              type="button"
              disabled={loading}
              onClick={() => router.push("/dashboard/tenants")}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Tenant"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function FormField({
  label,
  value,
  onChange,
  disabled,
  required = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
        {label}

        {required && <span className="ml-1 text-[var(--danger)]">*</span>}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

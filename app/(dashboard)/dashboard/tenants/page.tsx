"use client";

import { FormEvent, useEffect, useState } from "react";

import { useAuth } from "@/providers/auth-provider";

import { createTenant, getTenants, type Tenant } from "@/lib/tenants-api";

export default function TenantsPage() {
  const { accessToken, isSuperAdmin, loading: authLoading } = useAuth();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [creating, setCreating] = useState(false);

  async function loadTenants() {
    if (!accessToken) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await getTenants(accessToken, page, 10, search);

      setTenants(result.tenants);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadTenants();
    }
  }, [authLoading, accessToken, page]);

  function handleSearch(event: FormEvent) {
    event.preventDefault();

    setPage(1);
    loadTenants();
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();

    if (!accessToken) {
      return;
    }

    try {
      setCreating(true);
      setError("");

      await createTenant(accessToken, {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        contactEmail: contactEmail.trim() || undefined,
      });

      setName("");
      setSlug("");
      setContactEmail("");

      setShowCreate(false);

      await loadTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create tenant");
    } finally {
      setCreating(false);
    }
  }

  if (authLoading || loading) {
    return <TenantsLoading />;
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}

      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--primary)]">
            Platform
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Tenants
          </h1>

          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            Manage organizations and tenant access.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="
              rounded-xl
              bg-[var(--primary)]
              px-4
              py-2.5
              text-sm
              font-semibold
              text-white
              transition
              hover:opacity-90
            "
          >
            Create tenant
          </button>
        )}
      </section>

      {/* Search */}

      <section
        className="
          rounded-2xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          p-4
        "
      >
        <form
          onSubmit={handleSearch}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tenants..."
            className="
              flex-1
              rounded-xl
              border
              border-[var(--border)]
              bg-[var(--surface-muted)]
              px-4
              py-2.5
              text-sm
              outline-none
              focus:border-[var(--primary)]
            "
          />

          <button
            type="submit"
            className="
              rounded-xl
              border
              border-[var(--border)]
              px-5
              py-2.5
              text-sm
              font-medium
              transition
              hover:bg-[var(--surface-hover)]
            "
          >
            Search
          </button>
        </form>
      </section>

      {error && (
        <div
          className="
            rounded-xl
            border
            border-red-500/30
            bg-red-500/10
            px-4
            py-3
            text-sm
            text-red-500
          "
        >
          {error}
        </div>
      )}

      {/* Tenant table */}

      <section
        className="
          overflow-hidden
          rounded-3xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          shadow-[var(--shadow-sm)]
        "
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="px-6 py-4 text-xs font-medium text-[var(--foreground-muted)]">
                  Tenant
                </th>

                <th className="px-6 py-4 text-xs font-medium text-[var(--foreground-muted)]">
                  Slug
                </th>

                <th className="px-6 py-4 text-xs font-medium text-[var(--foreground-muted)]">
                  Contact
                </th>

                <th className="px-6 py-4 text-xs font-medium text-[var(--foreground-muted)]">
                  Status
                </th>

                <th className="px-6 py-4 text-xs font-medium text-[var(--foreground-muted)]">
                  Created
                </th>
              </tr>
            </thead>

            <tbody>
              {tenants.map((tenant) => (
                <tr
                  key={tenant.id}
                  className="
                    border-b
                    border-[var(--border)]
                    last:border-0
                    transition
                    hover:bg-[var(--surface-hover)]
                  "
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-semibold">{tenant.name}</p>

                      <p className="mt-1 font-mono text-[10px] text-[var(--foreground-subtle)]">
                        {tenant.id}
                      </p>
                    </div>
                  </td>

                  <td className="px-6 py-4">
                    <span className="rounded-lg bg-[var(--surface-muted)] px-2.5 py-1 font-mono text-xs">
                      {tenant.slug}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                    {tenant.contactEmail || "—"}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`
                        rounded-lg
                        px-2.5
                        py-1
                        text-xs
                        font-medium
                        ${
                          tenant.status === "ACTIVE"
                            ? "bg-[var(--success-soft)] text-[var(--success)]"
                            : "bg-[var(--surface-muted)] text-[var(--foreground-muted)]"
                        }
                      `}
                    >
                      {tenant.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-[var(--foreground-muted)]">
                    {new Date(tenant.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}

              {!tenants.length && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-16 text-center text-sm text-[var(--foreground-muted)]"
                  >
                    No tenants found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}

        <div className="flex items-center justify-between border-t border-[var(--border)] px-6 py-4">
          <p className="text-xs text-[var(--foreground-muted)]">
            Page {page} of {totalPages}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
              className="
                rounded-lg
                border
                border-[var(--border)]
                px-3
                py-2
                text-xs
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              Previous
            </button>

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
              className="
                rounded-lg
                border
                border-[var(--border)]
                px-3
                py-2
                text-xs
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* Create modal */}

      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div
            className="
              w-full
              max-w-lg
              rounded-3xl
              border
              border-[var(--border)]
              bg-[var(--surface)]
              p-6
              shadow-[var(--shadow-lg)]
            "
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--primary)]">
                  Platform administration
                </p>

                <h2 className="mt-2 text-xl font-semibold">Create tenant</h2>
              </div>

              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-xl text-[var(--foreground-muted)]"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-6 space-y-4">
              <Field
                label="Name"
                value={name}
                onChange={setName}
                placeholder="Acme Corporation"
                required
              />

              <Field
                label="Slug"
                value={slug}
                onChange={setSlug}
                placeholder="acme"
                required
              />

              <Field
                label="Contact email"
                value={contactEmail}
                onChange={setContactEmail}
                placeholder="admin@acme.com"
                type="email"
              />

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="
                    rounded-xl
                    border
                    border-[var(--border)]
                    px-4
                    py-2.5
                    text-sm
                  "
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="
                    rounded-xl
                    bg-[var(--primary)]
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-white
                    disabled:opacity-50
                  "
                >
                  {creating ? "Creating..." : "Create tenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-[var(--foreground-muted)]">
        {label}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="
          w-full
          rounded-xl
          border
          border-[var(--border)]
          bg-[var(--surface-muted)]
          px-4
          py-3
          text-sm
          outline-none
          focus:border-[var(--primary)]
        "
      />
    </div>
  );
}

function TenantsLoading() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="animate-pulse rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8">
        <div className="h-8 w-48 rounded bg-[var(--surface-muted)]" />

        <div className="mt-8 h-64 rounded-2xl bg-[var(--surface-muted)]" />
      </div>
    </div>
  );
}

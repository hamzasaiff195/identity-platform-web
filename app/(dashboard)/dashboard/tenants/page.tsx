"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/providers/auth-provider";
import { createTenant, getTenants, type Tenant } from "@/lib/tenants-api";

const PAGE_SIZE = 10;

export default function TenantsPage() {
  const { accessToken, isSuperAdmin, loading: authLoading } = useAuth();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  const [showCreate, setShowCreate] = useState(false);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  const [creating, setCreating] = useState(false);

  // ---------------------------------------------------------------------------
  // Load tenants
  // ---------------------------------------------------------------------------

  const loadTenants = useCallback(async () => {
    if (!accessToken) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const result = await getTenants(
        accessToken,
        page,
        PAGE_SIZE,
        submittedSearch
      );

      setTenants(result.tenants);
      setTotalPages(result.pagination.totalPages);
    } catch (err) {
      console.error("[TENANTS] Failed to load tenants:", err);

      setTenants([]);
      setTotalPages(1);

      setError(err instanceof Error ? err.message : "Failed to load tenants.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, submittedSearch]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    void loadTenants();
  }, [authLoading, loadTenants]);

  // ---------------------------------------------------------------------------
  // Tenant statistics
  // ---------------------------------------------------------------------------

  const activeTenants = useMemo(
    () => tenants.filter((tenant) => tenant.isActive).length,
    [tenants]
  );

  const inactiveTenants = useMemo(
    () => tenants.filter((tenant) => !tenant.isActive).length,
    [tenants]
  );

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPage(1);
    setSubmittedSearch(search.trim());
  }

  function clearSearch() {
    setSearch("");
    setSubmittedSearch("");
    setPage(1);
  }

  // ---------------------------------------------------------------------------
  // Create tenant
  // ---------------------------------------------------------------------------

  function openCreate() {
    setError("");

    setName("");
    setSlug("");
    setContactEmail("");

    setShowCreate(true);
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      setError("You are not authenticated.");
      return;
    }

    const trimmedName = name.trim();
    const normalizedSlug = slug.trim().toLowerCase();
    const trimmedContactEmail = contactEmail.trim();

    if (!trimmedName) {
      setError("Tenant name is required.");
      return;
    }

    if (!normalizedSlug) {
      setError("Tenant slug is required.");
      return;
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedSlug)) {
      setError(
        "Slug may contain only lowercase letters, numbers, and hyphens."
      );
      return;
    }

    try {
      setCreating(true);
      setError("");

      await createTenant(accessToken, {
        name: trimmedName,
        slug: normalizedSlug,
        contactEmail: trimmedContactEmail || undefined,
      });

      setName("");
      setSlug("");
      setContactEmail("");

      setShowCreate(false);

      setPage(1);

      await loadTenants();
    } catch (err) {
      console.error("[TENANTS] Failed to create tenant:", err);

      setError(err instanceof Error ? err.message : "Failed to create tenant.");
    } finally {
      setCreating(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (authLoading || loading) {
    return <TenantsLoading />;
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* --------------------------------------------------------------------- */}
      {/* Header                                                                */}
      {/* --------------------------------------------------------------------- */}

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
            onClick={openCreate}
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

      {/* --------------------------------------------------------------------- */}
      {/* Statistics                                                            */}
      {/* --------------------------------------------------------------------- */}

      <section className="grid gap-4 sm:grid-cols-3">
        <TenantStat label="Total Tenants" value={tenants.length} />

        <TenantStat label="Active" value={activeTenants} variant="active" />

        <TenantStat
          label="Inactive"
          value={inactiveTenants}
          variant="inactive"
        />
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* Search                                                                */}
      {/* --------------------------------------------------------------------- */}

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
            type="search"
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

          {submittedSearch && (
            <button
              type="button"
              onClick={clearSearch}
              className="
                rounded-xl
                border
                border-[var(--border)]
                px-5
                py-2.5
                text-sm
                font-medium
                text-[var(--foreground-muted)]
                transition
                hover:bg-[var(--surface-hover)]
              "
            >
              Clear
            </button>
          )}
        </form>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* Error                                                                 */}
      {/* --------------------------------------------------------------------- */}

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

      {/* --------------------------------------------------------------------- */}
      {/* Tenant table                                                          */}
      {/* --------------------------------------------------------------------- */}

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
          <table className="w-full min-w-[1000px] text-left">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <TenantTableHeader>Tenant</TenantTableHeader>

                <TenantTableHeader>Slug</TenantTableHeader>

                <TenantTableHeader>Contact</TenantTableHeader>

                <TenantTableHeader>Status</TenantTableHeader>

                <TenantTableHeader>Created</TenantTableHeader>

                <th className="px-6 py-4 text-right text-xs font-medium text-[var(--foreground-muted)]">
                  Actions
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
                  {/* Tenant */}

                  <td className="px-6 py-5">
                    <div>
                      <p className="text-sm font-semibold">{tenant.name}</p>

                      <p className="mt-1 font-mono text-[10px] text-[var(--foreground-subtle)]">
                        {tenant.id}
                      </p>
                    </div>
                  </td>

                  {/* Slug */}

                  <td className="px-6 py-5">
                    <span className="rounded-lg bg-[var(--surface-muted)] px-2.5 py-1 font-mono text-xs">
                      {tenant.slug}
                    </span>
                  </td>

                  {/* Contact */}

                  <td className="px-6 py-5 text-sm text-[var(--foreground-muted)]">
                    {tenant.contactEmail || "—"}
                  </td>

                  {/* Status */}

                  <td className="px-6 py-5">
                    <TenantStatusBadge active={tenant.isActive} />
                  </td>

                  {/* Created */}

                  <td className="px-6 py-5 text-sm text-[var(--foreground-muted)]">
                    {formatDate(tenant.createdAt)}
                  </td>

                  {/* Actions */}

                  <td className="px-6 py-5">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/dashboard/tenants/${tenant.id}`}
                        className="
                          rounded-lg
                          border
                          border-[var(--border)]
                          px-3
                          py-2
                          text-xs
                          font-medium
                          text-[var(--foreground-muted)]
                          transition
                          hover:bg-[var(--surface-hover)]
                        "
                      >
                        Manage
                      </Link>

                      <Link
                        href={`/dashboard/tenants/${tenant.id}/roles`}
                        className="
                          rounded-lg
                          border
                          border-[var(--primary)]/20
                          bg-[var(--primary-soft)]
                          px-3
                          py-2
                          text-xs
                          font-medium
                          text-[var(--primary)]
                          transition
                          hover:opacity-80
                        "
                      >
                        Roles
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}

              {!tenants.length && (
                <tr>
                  <td
                    colSpan={6}
                    className="
                      px-6
                      py-16
                      text-center
                      text-sm
                      text-[var(--foreground-muted)]
                    "
                  >
                    {submittedSearch
                      ? "No tenants match your search."
                      : "No tenants found."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* Pagination                                                           */}
        {/* ------------------------------------------------------------------- */}

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
                hover:bg-[var(--surface-hover)]
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
                hover:bg-[var(--surface-hover)]
              "
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------- */}
      {/* Create modal                                                          */}
      {/* --------------------------------------------------------------------- */}

      {showCreate && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/40
            p-4
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !creating) {
              setShowCreate(false);
            }
          }}
        >
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
                disabled={creating}
                className="
                  text-xl
                  text-[var(--foreground-muted)]
                  transition
                  hover:text-[var(--foreground)]
                  disabled:opacity-50
                "
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
                  disabled={creating}
                  className="
                    rounded-xl
                    border
                    border-[var(--border)]
                    px-4
                    py-2.5
                    text-sm
                    disabled:opacity-50
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

/* ========================================================================== */
/* TABLE HEADER                                                               */
/* ========================================================================== */

function TenantTableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-6 py-4 text-left text-xs font-medium text-[var(--foreground-muted)]">
      {children}
    </th>
  );
}

/* ========================================================================== */
/* STATUS BADGE                                                               */
/* ========================================================================== */

function TenantStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`
        inline-flex
        items-center
        gap-2
        rounded-full
        px-3
        py-1.5
        text-xs
        font-medium
        ${
          active
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
        }
      `}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {active ? "Active" : "Inactive"}
    </span>
  );
}

/* ========================================================================== */
/* STAT                                                                       */
/* ========================================================================== */

function TenantStat({
  label,
  value,
  variant = "default",
}: {
  label: string;
  value: number;
  variant?: "default" | "active" | "inactive";
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-[var(--border)]
        bg-[var(--surface)]
        p-5
      "
    >
      <p className="text-sm text-[var(--foreground-muted)]">{label}</p>

      <div className="mt-2 flex items-center gap-3">
        <p className="text-2xl font-semibold">{value}</p>

        {variant === "active" && (
          <span className="text-xs font-medium text-[var(--success)]">
            Active
          </span>
        )}

        {variant === "inactive" && (
          <span className="text-xs font-medium text-[var(--foreground-muted)]">
            Inactive
          </span>
        )}
      </div>
    </div>
  );
}

/* ========================================================================== */
/* FIELD                                                                      */
/* ========================================================================== */

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

/* ========================================================================== */
/* LOADING                                                                    */
/* ========================================================================== */

function TenantsLoading() {
  return (
    <div className="mx-auto max-w-7xl">
      <div
        className="
          animate-pulse
          rounded-3xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          p-8
        "
      >
        <div className="h-8 w-48 rounded bg-[var(--surface-muted)]" />

        <div className="mt-8 h-20 rounded-2xl bg-[var(--surface-muted)]" />

        <div className="mt-4 h-64 rounded-2xl bg-[var(--surface-muted)]" />
      </div>
    </div>
  );
}

/* ========================================================================== */
/* DATE                                                                       */
/* ========================================================================== */

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

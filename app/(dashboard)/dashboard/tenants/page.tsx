"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/providers/auth-provider";
import {
  getTenant,
  getTenants,
  type Tenant,
  type TenantPagination,
} from "@/lib/tenants-api";
import { Button } from "@/components/ui/button";

const INITIAL_PAGINATION: TenantPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

export default function TenantsPage() {
  const { accessToken } = useAuth();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [pagination, setPagination] =
    useState<TenantPagination>(INITIAL_PAGINATION);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [activeTenantId, setActiveTenantId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Load active tenant
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const storedTenantId = localStorage.getItem("activeTenantId");
    setActiveTenantId(storedTenantId);
  }, []);

  // ---------------------------------------------------------------------------
  // Load tenants
  // ---------------------------------------------------------------------------

  const loadTenants = useCallback(
    async (pageValue = 1, searchValue = "") => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const result = await getTenants(
          accessToken,
          pageValue,
          pagination.limit,
          searchValue
        );

        setTenants(result.tenants);
        setPagination(result.pagination);
      } catch (error) {
        console.error("[TENANTS] Failed to load tenants:", error);

        setError(
          error instanceof Error ? error.message : "Unable to load tenants"
        );
      } finally {
        setLoading(false);
      }
    },
    [accessToken, pagination.limit]
  );

  // ---------------------------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    loadTenants(1, "");
  }, [accessToken, loadTenants]);

  // ---------------------------------------------------------------------------
  // Select active tenant
  // ---------------------------------------------------------------------------

  function handleSelectTenant(tenantId: string) {
    const tenant = tenants.find((item) => item.id === tenantId);

    if (!tenant) {
      console.error("[TENANTS] Tenant not found:", tenantId);
      setError("Unable to select tenant.");
      return;
    }

    if (tenant.isDeleted || !tenant.isActive) {
      setError("This tenant is not active.");
      return;
    }

    console.log("[TENANTS] Selecting active tenant:", tenantId);

    // Persist BEFORE navigation.
    localStorage.setItem("activeTenantId", tenantId);

    // Verify immediately.
    const stored = localStorage.getItem("activeTenantId");

    console.log("[TENANTS] activeTenantId stored:", stored);

    setActiveTenantId(tenantId);

    window.dispatchEvent(
      new CustomEvent("activeTenantChanged", {
        detail: {
          tenantId,
        },
      })
    );

    window.location.href = "/dashboard/roles";
  }

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();

    loadTenants(1, search.trim());
  }

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------

  function handlePreviousPage() {
    if (!pagination.hasPreviousPage || loading) {
      return;
    }

    loadTenants(pagination.page - 1, search);
  }

  function handleNextPage() {
    if (!pagination.hasNextPage || loading) {
      return;
    }

    loadTenants(pagination.page + 1, search);
  }

  // ---------------------------------------------------------------------------
  // Refresh
  // ---------------------------------------------------------------------------

  function handleRefresh() {
    loadTenants(pagination.page, search);
  }

  // ---------------------------------------------------------------------------
  // View tenant
  // ---------------------------------------------------------------------------

  async function handleViewTenant(tenantId: string) {
    if (!accessToken) {
      return;
    }

    try {
      setViewLoading(true);
      setError("");

      const tenant = await getTenant(accessToken, tenantId);

      setSelectedTenant(tenant);
    } catch (error) {
      console.error("[TENANTS] Failed to load tenant:", error);

      setError(
        error instanceof Error ? error.message : "Unable to load tenant"
      );
    } finally {
      setViewLoading(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (loading && tenants.length === 0) {
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
              Loading tenants...
            </p>
          </div>
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
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--primary)]">
            Multi-tenancy
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
            Tenants
          </h1>

          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Manage organizations, members, and isolated resources.
          </p>
        </div>

        <Link href="/dashboard/tenants/new">
          <Button>Create tenant</Button>
        </Link>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Active Tenant */}
      {/* ------------------------------------------------------------------ */}

      {activeTenantId && (
        <div
          className="
            mb-4
            flex
            items-center
            justify-between
            gap-4
            rounded-lg
            border
            border-[var(--border)]
            bg-[var(--surface)]
            px-4
            py-3
          "
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
              Active tenant
            </p>

            <p className="mt-1 font-mono text-xs text-[var(--foreground)]">
              {activeTenantId}
            </p>
          </div>

          <Link
            href="/dashboard/roles"
            className="
              text-sm
              font-medium
              text-[var(--primary)]
              hover:underline
            "
          >
            Manage roles
          </Link>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Toolbar */}
      {/* ------------------------------------------------------------------ */}

      <div className="mb-4 flex items-center justify-between gap-4">
        <form
          onSubmit={handleSearchSubmit}
          className="flex w-full max-w-md gap-2"
        >
          <div className="relative flex-1">
            <span
              className="
                pointer-events-none
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-[var(--foreground-muted)]
              "
            >
              ⌕
            </span>

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tenants by name or slug..."
              className="
                h-10
                w-full
                rounded-lg
                border
                border-[var(--border)]
                bg-[var(--surface)]
                pl-9
                pr-3
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

          <button
            type="submit"
            disabled={loading}
            className="
              h-10
              rounded-lg
              border
              border-[var(--border)]
              bg-[var(--surface)]
              px-4
              text-sm
              font-medium
              text-[var(--foreground)]
              transition
              hover:bg-[var(--background)]
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            Search
          </button>
        </form>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="
            hidden
            h-10
            rounded-lg
            border
            border-[var(--border)]
            bg-[var(--surface)]
            px-4
            text-sm
            font-medium
            text-[var(--foreground)]
            transition
            hover:bg-[var(--background)]
            disabled:cursor-not-allowed
            disabled:opacity-50
            sm:block
          "
        >
          Refresh
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Error */}
      {/* ------------------------------------------------------------------ */}

      {error && (
        <div
          className="
            mb-4
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
            onClick={handleRefresh}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Table */}
      {/* ------------------------------------------------------------------ */}

      <section
        className="
          flex
          h-[calc(100vh-300px)]
          min-h-[400px]
          flex-col
          overflow-hidden
          rounded-xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          shadow-[var(--shadow-sm)]
        "
      >
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[1000px]">
            <thead className="sticky top-0 z-10 bg-[var(--surface)]">
              <tr className="border-b border-[var(--border)]">
                <TableHeader>Tenant</TableHeader>
                <TableHeader>Location</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Created Date</TableHeader>

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
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {tenants.map((tenant) => (
                <TenantRow
                  key={tenant.id}
                  tenant={tenant}
                  activeTenantId={activeTenantId}
                  onView={handleViewTenant}
                  onSelect={handleSelectTenant}
                />
              ))}
            </tbody>
          </table>

          {/* Empty state */}

          {tenants.length === 0 && (
            <div className="px-6 py-16 text-center">
              <div
                className="
                  mx-auto
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-full
                  bg-[var(--background)]
                  text-xl
                  text-[var(--foreground-muted)]
                "
              >
                ◇
              </div>

              <p className="mt-4 text-sm font-medium text-[var(--foreground)]">
                No tenants found
              </p>

              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                {search
                  ? "Try adjusting your search."
                  : "Create your first tenant to get started."}
              </p>

              {!search && (
                <Link
                  href="/dashboard/tenants/new"
                  className="
                    mt-4
                    inline-flex
                    text-sm
                    font-medium
                    text-[var(--primary)]
                    hover:underline
                  "
                >
                  Create tenant
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Pagination */}
        {/* ---------------------------------------------------------------- */}

        {pagination.total > 0 && (
          <div
            className="
              shrink-0
              border-t
              border-[var(--border)]
              bg-[var(--surface)]
              px-6
              py-4
            "
          >
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-[var(--foreground-muted)]">
                Showing{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {(pagination.page - 1) * pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}
                </span>{" "}
                of{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {pagination.total}
                </span>{" "}
                tenants
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handlePreviousPage}
                  disabled={!pagination.hasPreviousPage || loading}
                  className="
                    rounded-lg
                    border
                    border-[var(--border)]
                    bg-[var(--surface)]
                    px-3
                    py-2
                    text-sm
                    font-medium
                    text-[var(--foreground)]
                    transition
                    hover:bg-[var(--background)]
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  Previous
                </button>

                <span className="min-w-[100px] text-center text-sm text-[var(--foreground-muted)]">
                  Page{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {pagination.page}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {pagination.totalPages}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={handleNextPage}
                  disabled={!pagination.hasNextPage || loading}
                  className="
                    rounded-lg
                    border
                    border-[var(--border)]
                    bg-[var(--surface)]
                    px-3
                    py-2
                    text-sm
                    font-medium
                    text-[var(--foreground)]
                    transition
                    hover:bg-[var(--background)]
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                  "
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && tenants.length > 0 && (
          <div
            className="
              shrink-0
              border-t
              border-[var(--border)]
              bg-[var(--surface)]
              px-6
              py-2
              text-center
              text-xs
              text-[var(--foreground-muted)]
            "
          >
            Loading...
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Tenant details modal */}
      {/* ------------------------------------------------------------------ */}

      {selectedTenant && (
        <TenantDetailsModal
          tenant={selectedTenant}
          loading={viewLoading}
          onClose={() => setSelectedTenant(null)}
        />
      )}
    </main>
  );
}

// =============================================================================
// Table Header
// =============================================================================

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

// =============================================================================
// Tenant Row
// =============================================================================

function TenantRow({
  tenant,
  activeTenantId,
  onView,
  onSelect,
}: {
  tenant: Tenant;
  activeTenantId: string | null;
  onView: (tenantId: string) => void;
  onSelect: (tenantId: string) => void;
}) {
  const isActive = tenant.isActive && !tenant.isDeleted;
  const isSelected = activeTenantId === tenant.id;

  const location = [tenant.city, tenant.state, tenant.country]
    .filter(Boolean)
    .join(", ");

  return (
    <tr
      className={`
        border-b
        border-[var(--border)]
        last:border-0
        transition-colors
        hover:bg-[var(--background)]
        ${!isActive ? "opacity-60" : ""}
        ${isSelected ? "bg-[var(--background)]" : ""}
      `}
    >
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-full
              bg-[var(--background)]
              text-xs
              font-semibold
              text-[var(--foreground-muted)]
            "
          >
            {tenant.name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate text-sm font-medium text-[var(--foreground)]">
                {tenant.name}
              </p>

              {isSelected && (
                <span
                  className="
                    inline-flex
                    shrink-0
                    items-center
                    rounded-full
                    bg-[var(--primary)]
                    px-2
                    py-0.5
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-wide
                    text-white
                  "
                >
                  Active
                </span>
              )}
            </div>

            <p className="mt-0.5 truncate font-mono text-xs text-[var(--foreground-muted)]">
              {tenant.slug}
            </p>
          </div>
        </div>
      </td>

      <td className="px-6 py-5">
        <span className="text-sm text-[var(--foreground-muted)]">
          {location || "—"}
        </span>
      </td>

      <td className="px-6 py-5">
        <TenantStatusBadge
          isActive={tenant.isActive}
          isDeleted={tenant.isDeleted}
        />
      </td>

      <td className="px-6 py-5">
        <span className="text-sm text-[var(--foreground-muted)]">
          {new Date(tenant.createdAt).toLocaleDateString()}
        </span>
      </td>

      <td className="px-6 py-5">
        <div className="flex items-center justify-end gap-3">
          {/* View */}

          <button
            type="button"
            onClick={() => onView(tenant.id)}
            className="
              text-sm
              font-medium
              text-[var(--primary)]
              hover:underline
            "
          >
            View
          </button>

          {/* Select tenant */}

          <button
            type="button"
            onClick={() => onSelect(tenant.id)}
            disabled={!isActive || isSelected}
            className="
              rounded-lg
              border
              border-[var(--border)]
              bg-[var(--surface)]
              px-3
              py-1.5
              text-sm
              font-medium
              text-[var(--foreground)]
              transition
              hover:bg-[var(--background)]
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            {isSelected ? "Selected" : "Use"}
          </button>

          {/* Manage */}

          <Link
            href={`/dashboard/tenants/${tenant.id}`}
            className="
              rounded-lg
              border
              border-[var(--border)]
              bg-[var(--surface)]
              px-3
              py-1.5
              text-sm
              font-medium
              text-[var(--foreground)]
              transition
              hover:bg-[var(--background)]
            "
          >
            Manage
          </Link>
        </div>
      </td>
    </tr>
  );
}

// =============================================================================
// Status Badge
// =============================================================================

function TenantStatusBadge({
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

// =============================================================================
// Tenant Details Modal
// =============================================================================

function TenantDetailsModal({
  tenant,
  loading,
  onClose,
}: {
  tenant: Tenant;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="
        fixed
        inset-0
        z-[100000]
        flex
        items-center
        justify-center
        bg-black/50
        p-4
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="
          w-full
          max-w-2xl
          overflow-hidden
          rounded-2xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          shadow-2xl
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
          <div className="flex items-center gap-4">
            <div
              className="
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-xl
                bg-[var(--primary)]
                text-lg
                font-bold
                text-white
              "
            >
              {tenant.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  {tenant.name}
                </h2>

                <TenantStatusBadge
                  isActive={tenant.isActive}
                  isDeleted={tenant.isDeleted}
                />
              </div>

              <p className="mt-1 font-mono text-xs text-[var(--foreground-muted)]">
                {tenant.slug}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              flex
              h-8
              w-8
              items-center
              justify-center
              rounded-lg
              text-lg
              text-[var(--foreground-muted)]
              hover:bg-[var(--background)]
            "
          >
            ×
          </button>
        </div>

        {/* Content */}

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="py-10 text-center text-sm text-[var(--foreground-muted)]">
              Loading tenant details...
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2">
              <InfoItem label="Tenant ID" value={tenant.id} />
              <InfoItem label="Name" value={tenant.name} />
              <InfoItem label="Slug" value={tenant.slug} />
              <InfoItem label="Legal Name" value={tenant.legalName} />
              <InfoItem label="Contact Email" value={tenant.contactEmail} />
              <InfoItem label="Contact Phone" value={tenant.contactPhone} />
              <InfoItem label="Website" value={tenant.websiteUrl} />
              <InfoItem label="Location" value={formatLocation(tenant)} />
              <InfoItem label="Timezone" value={tenant.timezone} />

              <InfoItem
                label="Created"
                value={formatDateTime(tenant.createdAt)}
              />

              <InfoItem
                label="Last Updated"
                value={formatDateTime(tenant.updatedAt)}
              />

              {tenant.description && (
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium text-[var(--foreground-muted)]">
                    Description
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--foreground)]">
                    {tenant.description}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}

        <div
          className="
            flex
            justify-end
            border-t
            border-[var(--border)]
            px-6
            py-4
          "
        >
          <button
            type="button"
            onClick={onClose}
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Info Item
// =============================================================================

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--foreground-muted)]">
        {label}
      </p>

      <p className="mt-1 break-all text-sm text-[var(--foreground)]">
        {value || "—"}
      </p>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function formatLocation(tenant: Tenant): string {
  return [tenant.city, tenant.state, tenant.country]
    .filter((value): value is string => Boolean(value))
    .join(", ");
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

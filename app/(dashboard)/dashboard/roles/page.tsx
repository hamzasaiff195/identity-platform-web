"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { createTenantRole, getTenantRoles, type Role } from "@/lib/roles-api";
import { getTenants, type Tenant } from "@/lib/tenants-api";

const PAGE_SIZE = 10;

export default function RolesPage() {
  const { accessToken } = useAuth();

  // ---------------------------------------------------------------------------
  // Tenant state
  // ---------------------------------------------------------------------------

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [loadingTenants, setLoadingTenants] = useState(true);

  // ---------------------------------------------------------------------------
  // Role state
  // ---------------------------------------------------------------------------

  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  // ---------------------------------------------------------------------------
  // Search / pagination
  // ---------------------------------------------------------------------------

  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [page, setPage] = useState(1);

  // ---------------------------------------------------------------------------
  // Create role
  // ---------------------------------------------------------------------------

  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");

  // ---------------------------------------------------------------------------
  // General
  // ---------------------------------------------------------------------------

  const [error, setError] = useState("");

  // ===========================================================================
  // Load tenants
  // ===========================================================================

  const loadTenants = useCallback(async () => {
    if (!accessToken) {
      setLoadingTenants(false);
      return;
    }

    try {
      setLoadingTenants(true);
      setError("");

      const result = await getTenants(accessToken, 1, 100);

      const availableTenants = result.tenants.filter(
        (tenant) => tenant.isActive && !tenant.isDeleted
      );

      setTenants(availableTenants);

      setSelectedTenantId((current) => {
        // Keep current selection if it still exists.
        if (
          current &&
          availableTenants.some((tenant) => tenant.id === current)
        ) {
          return current;
        }

        // Automatically select the only available tenant.
        if (availableTenants.length === 1) {
          return availableTenants[0].id;
        }

        // If possible, restore the previously active tenant.
        const storedTenantId = localStorage.getItem("activeTenantId");

        if (
          storedTenantId &&
          availableTenants.some((tenant) => tenant.id === storedTenantId)
        ) {
          return storedTenantId;
        }

        return "";
      });
    } catch (err) {
      console.error("[ROLES] Failed to load tenants:", err);

      setError(
        err instanceof Error ? err.message : "Unable to load available tenants"
      );
    } finally {
      setLoadingTenants(false);
    }
  }, [accessToken]);

  // ===========================================================================
  // Load roles
  // ===========================================================================

  const loadRoles = useCallback(async () => {
    if (!accessToken) {
      setLoadingRoles(false);
      return;
    }

    if (!selectedTenantId) {
      setRoles([]);
      setLoadingRoles(false);
      return;
    }

    try {
      setLoadingRoles(true);
      setError("");

      console.log("[ROLES] Loading roles for tenant:", selectedTenantId);

      const result = await getTenantRoles(accessToken, selectedTenantId);

      console.log("[ROLES] Loaded roles:", result);

      setRoles(result);
      setPage(1);
    } catch (err) {
      console.error("[ROLES] Failed to load roles:", err);

      setRoles([]);

      setError(err instanceof Error ? err.message : "Unable to load roles");
    } finally {
      setLoadingRoles(false);
    }
  }, [accessToken, selectedTenantId]);

  // ===========================================================================
  // Initial tenant load
  // ===========================================================================

  useEffect(() => {
    if (!accessToken) {
      setLoadingTenants(false);
      setLoadingRoles(false);
      return;
    }

    loadTenants();
  }, [accessToken, loadTenants]);

  // ===========================================================================
  // Load roles whenever tenant changes
  // ===========================================================================

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    loadRoles();
  }, [accessToken, selectedTenantId, loadRoles]);

  // ===========================================================================
  // Persist active tenant
  // ===========================================================================

  useEffect(() => {
    if (!selectedTenantId) {
      return;
    }

    localStorage.setItem("activeTenantId", selectedTenantId);
  }, [selectedTenantId]);

  // ===========================================================================
  // Selected tenant
  // ===========================================================================

  const selectedTenant = useMemo(() => {
    return tenants.find((tenant) => tenant.id === selectedTenantId) ?? null;
  }, [tenants, selectedTenantId]);

  // ===========================================================================
  // Search
  // ===========================================================================

  const filteredRoles = useMemo(() => {
    const value = submittedSearch.trim().toLowerCase();

    if (!value) {
      return roles;
    }

    return roles.filter((role) => {
      return (
        role.name.toLowerCase().includes(value) ||
        role.slug.toLowerCase().includes(value) ||
        role.scope.toLowerCase().includes(value) ||
        (role.description ?? "").toLowerCase().includes(value)
      );
    });
  }, [roles, submittedSearch]);

  // ===========================================================================
  // Pagination
  // ===========================================================================

  const total = filteredRoles.length;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const paginatedRoles = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;

    return filteredRoles.slice(start, start + PAGE_SIZE);
  }, [filteredRoles, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // ===========================================================================
  // Search submit
  // ===========================================================================

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmittedSearch(search.trim());
    setPage(1);
  }

  // ===========================================================================
  // Tenant change
  // ===========================================================================

  function handleTenantChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextTenantId = event.target.value;

    setSelectedTenantId(nextTenantId);

    setSearch("");
    setSubmittedSearch("");
    setPage(1);
    setError("");
    setShowCreate(false);
  }

  // ===========================================================================
  // Refresh
  // ===========================================================================

  async function handleRefresh() {
    setError("");

    if (selectedTenantId) {
      await loadRoles();
      return;
    }

    await loadTenants();
  }

  // ===========================================================================
  // Open create modal
  // ===========================================================================

  function handleOpenCreate() {
    if (!selectedTenantId) {
      setError("Select a tenant before creating a role.");
      return;
    }

    setError("");
    setName("");
    setSlug("");
    setDescription("");
    setShowCreate(true);
  }

  // ===========================================================================
  // Create role
  // ===========================================================================

  async function handleCreateRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!accessToken) {
      setError("You are not authenticated.");
      return;
    }

    if (!selectedTenantId) {
      setError("Select a tenant before creating a role.");
      return;
    }

    const trimmedName = name.trim();
    const normalizedSlug = slug.trim().toLowerCase();

    if (!trimmedName) {
      setError("Role name is required.");
      return;
    }

    if (!normalizedSlug) {
      setError("Role slug is required.");
      return;
    }

    try {
      setCreating(true);
      setError("");

      console.log(
        "[CREATE ROLE] Creating tenant role for tenant:",
        selectedTenantId
      );

      const role = await createTenantRole(accessToken, selectedTenantId, {
        name: trimmedName,
        slug: normalizedSlug,
        description: description.trim() || undefined,
        scope: "TENANT",
      });

      console.log("[CREATE ROLE] Created role:", role);

      setRoles((current) => [role, ...current]);

      setName("");
      setSlug("");
      setDescription("");
      setShowCreate(false);
      setPage(1);
    } catch (err) {
      console.error("[CREATE ROLE] Failed:", err);

      setError(err instanceof Error ? err.message : "Unable to create role");
    } finally {
      setCreating(false);
    }
  }

  // ===========================================================================
  // Authentication loading
  // ===========================================================================

  if (!accessToken && loadingTenants) {
    return (
      <main className="min-h-full bg-[var(--background)] p-6 lg:p-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <LoadingState text="Authenticating..." />
        </div>
      </main>
    );
  }

  // ===========================================================================
  // Tenant loading
  // ===========================================================================

  if (loadingTenants && tenants.length === 0) {
    return (
      <main className="min-h-full bg-[var(--background)] p-6 lg:p-8">
        <div className="flex min-h-[400px] items-center justify-center">
          <LoadingState text="Loading tenants..." />
        </div>
      </main>
    );
  }

  // ===========================================================================
  // Render
  // ===========================================================================

  return (
    <main className="min-h-full bg-[var(--background)] p-6 lg:p-8">
      {/* Header */}

      <div className="mb-6 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--primary)]">
            Authorization
          </p>

          <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
            Roles
          </h1>

          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Manage tenant roles and access policies.
          </p>
        </div>

        <Button onClick={handleOpenCreate} disabled={!selectedTenantId}>
          Create role
        </Button>
      </div>

      {/* Tenant selector */}

      <section
        className="
          mb-5
          rounded-xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          p-5
          shadow-[var(--shadow-sm)]
        "
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <label
              htmlFor="tenant"
              className="
                mb-1.5
                block
                text-sm
                font-medium
                text-[var(--foreground)]
              "
            >
              Tenant
            </label>

            <select
              id="tenant"
              value={selectedTenantId}
              onChange={handleTenantChange}
              disabled={loadingTenants || tenants.length === 0}
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
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:max-w-md
              "
            >
              <option value="">
                {loadingTenants
                  ? "Loading tenants..."
                  : tenants.length === 0
                  ? "No tenants available"
                  : "Select a tenant"}
              </option>

              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name} ({tenant.slug})
                </option>
              ))}
            </select>
          </div>

          {selectedTenant && (
            <div className="text-left sm:text-right">
              <p className="text-xs text-[var(--foreground-muted)]">
                Managing roles for
              </p>

              <p className="mt-0.5 text-sm font-medium text-[var(--foreground)]">
                {selectedTenant.name}
              </p>

              <p className="mt-0.5 font-mono text-[10px] text-[var(--foreground-muted)]">
                {selectedTenant.id}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Error */}

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

      {/* No tenant */}

      {!selectedTenantId && !loadingTenants && (
        <div
          className="
            mb-4
            rounded-lg
            border
            border-amber-300
            bg-amber-50
            px-4
            py-3
            text-sm
            text-amber-800
            dark:border-amber-900
            dark:bg-amber-950/30
            dark:text-amber-300
          "
        >
          Select a tenant to view and manage its roles.
        </div>
      )}

      {/* Toolbar */}

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
              placeholder="Search roles by name or slug..."
              disabled={!selectedTenantId}
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
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            />
          </div>

          <button
            type="submit"
            disabled={loadingRoles || !selectedTenantId}
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
          disabled={loadingRoles || loadingTenants}
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

      {/* Roles table */}

      <section
        className="
          flex
          h-[calc(100vh-390px)]
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
          {loadingRoles && roles.length === 0 ? (
            <div className="flex h-full min-h-[300px] items-center justify-center">
              <LoadingState text="Loading roles..." />
            </div>
          ) : (
            <>
              <table className="w-full min-w-[900px]">
                <thead className="sticky top-0 z-10 bg-[var(--surface)]">
                  <tr className="border-b border-[var(--border)]">
                    <TableHeader>Role</TableHeader>
                    <TableHeader>Slug</TableHeader>
                    <TableHeader>Scope</TableHeader>
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
                  {paginatedRoles.map((role) => (
                    <RoleRow key={role.id} role={role} />
                  ))}
                </tbody>
              </table>

              {paginatedRoles.length === 0 && (
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
                    {!selectedTenantId
                      ? "No tenant selected"
                      : "No roles found"}
                  </p>

                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    {!selectedTenantId
                      ? "Select a tenant above to view its roles."
                      : submittedSearch
                      ? "Try adjusting your search."
                      : "Create your first role to get started."}
                  </p>

                  {!submittedSearch && selectedTenantId && (
                    <button
                      type="button"
                      onClick={handleOpenCreate}
                      className="
                          mt-4
                          text-sm
                          font-medium
                          text-[var(--primary)]
                          hover:underline
                        "
                    >
                      Create role
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination */}

        {total > 0 && (
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
                  {(page - 1) * PAGE_SIZE + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {Math.min(page * PAGE_SIZE, total)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-[var(--foreground)]">
                  {total}
                </span>{" "}
                roles
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1 || loadingRoles}
                  className={paginationButtonClass}
                >
                  Previous
                </button>

                <span className="min-w-[100px] text-center text-sm text-[var(--foreground-muted)]">
                  Page{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {page}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {totalPages}
                  </span>
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setPage((current) => Math.min(totalPages, current + 1))
                  }
                  disabled={page === totalPages || loadingRoles}
                  className={paginationButtonClass}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {loadingRoles && roles.length > 0 && (
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

      {/* Create role modal */}

      {showCreate && selectedTenant && (
        <CreateRoleModal
          tenant={selectedTenant}
          name={name}
          slug={slug}
          description={description}
          creating={creating}
          onNameChange={setName}
          onSlugChange={setSlug}
          onDescriptionChange={setDescription}
          onClose={() => {
            if (!creating) {
              setShowCreate(false);
            }
          }}
          onSubmit={handleCreateRole}
        />
      )}
    </main>
  );
}

// =============================================================================
// Loading State
// =============================================================================

function LoadingState({ text }: { text: string }) {
  return (
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

      <p className="mt-4 text-sm text-[var(--foreground-muted)]">{text}</p>
    </div>
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
// Role Row
// =============================================================================

function RoleRow({ role }: { role: Role }) {
  const isActive = role.isActive && !role.isDeleted;

  return (
    <tr
      className={`
        border-b
        border-[var(--border)]
        last:border-0
        transition-colors
        hover:bg-[var(--background)]
        ${!isActive ? "opacity-60" : ""}
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
            {role.name.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--foreground)]">
              {role.name}
            </p>

            <p className="mt-0.5 truncate text-xs text-[var(--foreground-muted)]">
              {role.description || "No description"}
            </p>
          </div>
        </div>
      </td>

      <td className="px-6 py-5">
        <span className="font-mono text-xs text-[var(--foreground-muted)]">
          {role.slug}
        </span>
      </td>

      <td className="px-6 py-5">
        <RoleScopeBadge scope={role.scope} />
      </td>

      <td className="px-6 py-5">
        <RoleStatusBadge isActive={role.isActive} isDeleted={role.isDeleted} />
      </td>

      <td className="px-6 py-5">
        <span className="text-sm text-[var(--foreground-muted)]">
          {new Date(role.createdAt).toLocaleDateString()}
        </span>
      </td>

      <td className="px-6 py-5">
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/dashboard/roles/${role.id}`}
            className="
              text-sm
              font-medium
              text-[var(--primary)]
              hover:underline
            "
          >
            View
          </Link>

          <Link
            href={`/dashboard/roles/${role.id}`}
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
// Scope Badge
// =============================================================================

function RoleScopeBadge({ scope }: { scope: Role["scope"] }) {
  return (
    <span
      className="
        inline-flex
        items-center
        rounded-full
        border
        border-[var(--border)]
        bg-[var(--background)]
        px-3
        py-1.5
        text-xs
        font-medium
        text-[var(--foreground-muted)]
      "
    >
      {scope}
    </span>
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

// =============================================================================
// Create Role Modal
// =============================================================================

function CreateRoleModal({
  tenant,
  name,
  slug,
  description,
  creating,
  onNameChange,
  onSlugChange,
  onDescriptionChange,
  onClose,
  onSubmit,
}: {
  tenant: Tenant;
  name: string;
  slug: string;
  description: string;
  creating: boolean;
  onNameChange: (value: string) => void;
  onSlugChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
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
      <form
        onSubmit={onSubmit}
        className="
          w-full
          max-w-lg
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
            border-b
            border-[var(--border)]
            px-6
            py-5
          "
        >
          <h2 className="text-lg font-semibold text-[var(--foreground)]">
            Create role
          </h2>

          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            Create a new role for{" "}
            <span className="font-medium text-[var(--foreground)]">
              {tenant.name}
            </span>
            .
          </p>

          <p className="mt-2 font-mono text-[10px] text-[var(--foreground-muted)]">
            Tenant: {tenant.slug}
          </p>
        </div>

        {/* Form */}

        <div className="space-y-5 px-6 py-6">
          <FormField
            label="Name"
            value={name}
            placeholder="Manager"
            onChange={onNameChange}
          />

          <FormField
            label="Slug"
            value={slug}
            placeholder="manager"
            onChange={onSlugChange}
          />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
              Description
            </label>

            <textarea
              value={description}
              onChange={(event) => onDescriptionChange(event.target.value)}
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

        {/* Footer */}

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
            onClick={onClose}
            disabled={creating}
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
            disabled={creating}
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
            {creating ? "Creating..." : "Create role"}
          </button>
        </div>
      </form>
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
// Pagination
// =============================================================================

const paginationButtonClass = `
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
`;

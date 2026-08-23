"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import { useAuth } from "@/providers/auth-provider";
import { getTenants, type Tenant } from "@/lib/tenants-api";
import {
  getAuditLog,
  getTenantAuditLogs,
  type AuditLog,
} from "@/lib/audit-logs-api";

const PAGE_SIZE = 25;

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

type AuditLogsResponse = {
  items: AuditLog[];
  pagination: Pagination;
};

type ApiEnvelope<T> = {
  message?: string;
  data: T;
};

const EMPTY_PAGINATION: Pagination = {
  page: 1,
  limit: PAGE_SIZE,
  total: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPreviousPage: false,
};

function normalizeAuditLogsResponse(result: unknown): AuditLogsResponse {
  const response = result as
    | AuditLogsResponse
    | ApiEnvelope<AuditLogsResponse>
    | null
    | undefined;

  if (!response) {
    return {
      items: [],
      pagination: EMPTY_PAGINATION,
    };
  }

  if (
    "data" in response &&
    response.data &&
    typeof response.data === "object"
  ) {
    return normalizeAuditLogsResponse(response.data);
  }

  if (
    "items" in response &&
    Array.isArray(response.items) &&
    "pagination" in response &&
    response.pagination
  ) {
    return {
      items: response.items,
      pagination: {
        ...EMPTY_PAGINATION,
        ...response.pagination,
      },
    };
  }

  return {
    items: [],
    pagination: EMPTY_PAGINATION,
  };
}

function normalizeAuditLog(result: unknown): AuditLog | null {
  const response = result as
    | AuditLog
    | ApiEnvelope<AuditLog>
    | null
    | undefined;

  if (!response) {
    return null;
  }

  if (
    "data" in response &&
    response.data &&
    typeof response.data === "object"
  ) {
    return normalizeAuditLog(response.data);
  }

  if ("id" in response && typeof response.id === "string") {
    return response as AuditLog;
  }

  return null;
}

export default function AuditLogsPage() {
  const { accessToken } = useAuth();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");

  const [logs, setLogs] = useState<AuditLog[]>([]);

  const [pagination, setPagination] = useState<Pagination>(EMPTY_PAGINATION);

  const [action, setAction] = useState("");
  const [resource, setResource] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [loadingTenants, setLoadingTenants] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [error, setError] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const selectedTenant = useMemo(
    () => tenants.find((tenant) => tenant.id === selectedTenantId) ?? null,
    [tenants, selectedTenantId]
  );

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
        if (
          current &&
          availableTenants.some((tenant) => tenant.id === current)
        ) {
          return current;
        }

        if (availableTenants.length === 1) {
          return availableTenants[0].id;
        }

        return "";
      });
    } catch (error) {
      console.error("[AUDIT LOGS] Failed to load tenants:", error);

      setError(
        error instanceof Error ? error.message : "Unable to load tenants"
      );
    } finally {
      setLoadingTenants(false);
    }
  }, [accessToken]);

  // ===========================================================================
  // Load audit logs
  // ===========================================================================

  const loadLogs = useCallback(
    async (page: number = 1) => {
      if (!accessToken || !selectedTenantId) {
        setLogs([]);
        return;
      }

      try {
        setLoadingLogs(true);
        setError("");

        const result = await getTenantAuditLogs(accessToken, selectedTenantId, {
          page,
          limit: PAGE_SIZE,
          action: action.trim() || undefined,
          resource: resource.trim() || undefined,
          resourceId: resourceId.trim() || undefined,
          from: from || undefined,
          to: to ? `${to}T23:59:59.999` : undefined,
        });

        const normalized = normalizeAuditLogsResponse(result);

        setLogs(normalized.items);

        setPagination(normalized.pagination);
      } catch (error) {
        console.error("[AUDIT LOGS] Failed to load:", error);

        setLogs([]);

        setPagination(EMPTY_PAGINATION);

        setError(
          error instanceof Error ? error.message : "Unable to load audit logs"
        );
      } finally {
        setLoadingLogs(false);
      }
    },
    [accessToken, selectedTenantId, action, resource, resourceId, from, to]
  );

  // ===========================================================================
  // Initial tenant load
  // ===========================================================================

  useEffect(() => {
    if (!accessToken) {
      setLoadingTenants(false);
      return;
    }

    void loadTenants();
  }, [accessToken, loadTenants]);

  // ===========================================================================
  // Load logs whenever tenant or filters change
  // ===========================================================================

  useEffect(() => {
    if (!accessToken || !selectedTenantId) {
      return;
    }

    void loadLogs(1);
  }, [accessToken, selectedTenantId, loadLogs]);

  // ===========================================================================
  // Tenant change
  // ===========================================================================

  function handleTenantChange(event: ChangeEvent<HTMLSelectElement>) {
    const tenantId = event.target.value;

    setSelectedTenantId(tenantId);

    setLogs([]);

    setPagination(EMPTY_PAGINATION);

    setSelectedLog(null);

    setError("");
  }

  // ===========================================================================
  // Filters
  // ===========================================================================

  function handleApplyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setPagination(EMPTY_PAGINATION);

    void loadLogs(1);
  }

  function handleClearFilters() {
    setAction("");
    setResource("");
    setResourceId("");
    setFrom("");
    setTo("");

    setPagination(EMPTY_PAGINATION);

    if (selectedTenantId) {
      void loadLogs(1);
    }
  }

  // ===========================================================================
  // Detail
  // ===========================================================================

  async function handleViewLog(id: string) {
    if (!accessToken) {
      return;
    }

    try {
      setLoadingDetail(true);
      setError("");

      const result = await getAuditLog(accessToken, id);

      const log = normalizeAuditLog(result);

      if (!log) {
        throw new Error("Invalid audit log response.");
      }

      setSelectedLog(log);
    } catch (error) {
      console.error("[AUDIT LOGS] Failed to load detail:", error);

      setError(
        error instanceof Error ? error.message : "Unable to load audit log"
      );
    } finally {
      setLoadingDetail(false);
    }
  }

  // ===========================================================================
  // Pagination
  // ===========================================================================

  function goToPreviousPage() {
    if (!pagination.hasPreviousPage || loadingLogs) {
      return;
    }

    const nextPage = pagination.page - 1;

    void loadLogs(nextPage);
  }

  function goToNextPage() {
    if (!pagination.hasNextPage || loadingLogs) {
      return;
    }

    const nextPage = pagination.page + 1;

    void loadLogs(nextPage);
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

      <div className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--primary)]">
          Security
        </p>

        <h1 className="mt-1 text-2xl font-semibold text-[var(--foreground)]">
          Audit Logs
        </h1>

        <p className="mt-1 text-sm text-[var(--foreground-muted)]">
          Review activity and changes across your tenant.
        </p>
      </div>

      {/* Tenant selector */}

      <section className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <label
              htmlFor="tenant"
              className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
            >
              Tenant
            </label>

            <select
              id="tenant"
              value={selectedTenantId}
              onChange={handleTenantChange}
              disabled={loadingTenants || tenants.length === 0}
              className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-md"
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
                Viewing audit logs for
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
        <div className="mb-4 flex items-center justify-between gap-4 rounded-lg border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
          <span>{error}</span>

          <button
            type="button"
            onClick={() => void loadLogs(pagination.page)}
            className="font-medium underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* No tenant */}

      {!selectedTenantId && !loadingTenants && (
        <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
          Select a tenant to view its audit logs.
        </div>
      )}

      {/* Filters */}

      <form
        onSubmit={handleApplyFilters}
        className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <FilterField label="Action">
            <input
              value={action}
              onChange={(event) => setAction(event.target.value)}
              placeholder="e.g. CREATE"
              disabled={!selectedTenantId}
              className={inputClass}
            />
          </FilterField>

          <FilterField label="Resource">
            <input
              value={resource}
              onChange={(event) => setResource(event.target.value)}
              placeholder="e.g. USER"
              disabled={!selectedTenantId}
              className={inputClass}
            />
          </FilterField>

          <FilterField label="Resource ID">
            <input
              value={resourceId}
              onChange={(event) => setResourceId(event.target.value)}
              placeholder="Resource UUID"
              disabled={!selectedTenantId}
              className={inputClass}
            />
          </FilterField>

          <FilterField label="From">
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              disabled={!selectedTenantId}
              className={inputClass}
            />
          </FilterField>

          <FilterField label="To">
            <input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              disabled={!selectedTenantId}
              className={inputClass}
            />
          </FilterField>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={!selectedTenantId || loadingLogs}
              className="h-10 flex-1 rounded-lg bg-[var(--primary)] px-4 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Apply
            </button>

            <button
              type="button"
              onClick={handleClearFilters}
              disabled={!selectedTenantId || loadingLogs}
              className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>
      </form>

      {/* Table */}

      <section className="flex min-h-[500px] flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
        <div className="min-h-0 flex-1 overflow-auto">
          {loadingLogs && logs.length === 0 ? (
            <div className="flex min-h-[400px] items-center justify-center">
              <LoadingState text="Loading audit logs..." />
            </div>
          ) : (
            <>
              <table className="w-full min-w-[1000px]">
                <thead className="sticky top-0 z-10 bg-[var(--surface)]">
                  <tr className="border-b border-[var(--border)]">
                    <TableHeader>Time</TableHeader>

                    <TableHeader>Actor</TableHeader>

                    <TableHeader>Action</TableHeader>

                    <TableHeader>Resource</TableHeader>

                    <TableHeader>Resource ID</TableHeader>

                    <TableHeader>IP Address</TableHeader>

                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {logs.map((log) => (
                    <AuditLogRow
                      key={log.id}
                      log={log}
                      onView={() => handleViewLog(log.id)}
                    />
                  ))}
                </tbody>
              </table>

              {logs.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--background)] text-xl text-[var(--foreground-muted)]">
                    ◇
                  </div>

                  <p className="mt-4 text-sm font-medium text-[var(--foreground)]">
                    No audit logs found
                  </p>

                  <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                    Try adjusting your filters.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pagination */}

        {pagination.total > 0 && (
          <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-6 py-4">
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
                logs
              </p>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={goToPreviousPage}
                  disabled={!pagination.hasPreviousPage || loadingLogs}
                  className={paginationButtonClass}
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
                  onClick={goToNextPage}
                  disabled={!pagination.hasNextPage || loadingLogs}
                  className={paginationButtonClass}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {loadingLogs && logs.length > 0 && (
          <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface)] px-6 py-2 text-center text-xs text-[var(--foreground-muted)]">
            Loading...
          </div>
        )}
      </section>

      {/* Detail modal */}

      {selectedLog && (
        <AuditLogModal
          log={selectedLog}
          loading={loadingDetail}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </main>
  );
}

// =============================================================================
// Audit Log Row
// =============================================================================

function AuditLogRow({ log, onView }: { log: AuditLog; onView: () => void }) {
  return (
    <tr className="border-b border-[var(--border)] last:border-0 transition-colors hover:bg-[var(--background)]">
      <td className="px-6 py-5">
        <div>
          <p className="text-sm font-medium text-[var(--foreground)]">
            {formatDate(log.createdAt)}
          </p>

          <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
            {formatTime(log.createdAt)}
          </p>
        </div>
      </td>

      <td className="px-6 py-5">
        {log.actor ? (
          <div>
            <p className="text-sm font-medium text-[var(--foreground)]">
              {log.actor.email}
            </p>

            <p className="mt-0.5 font-mono text-[10px] text-[var(--foreground-muted)]">
              {log.actor.id}
            </p>
          </div>
        ) : (
          <span className="text-sm text-[var(--foreground-muted)]">System</span>
        )}
      </td>

      <td className="px-6 py-5">
        <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 font-mono text-xs font-medium text-[var(--foreground-muted)]">
          {log.action}
        </span>
      </td>

      <td className="px-6 py-5">
        <span className="text-sm font-medium text-[var(--foreground)]">
          {log.resource}
        </span>
      </td>

      <td className="max-w-[220px] px-6 py-5">
        <span
          className="block truncate font-mono text-xs text-[var(--foreground-muted)]"
          title={log.resourceId ?? undefined}
        >
          {log.resourceId ?? "—"}
        </span>
      </td>

      <td className="px-6 py-5">
        <span className="font-mono text-xs text-[var(--foreground-muted)]">
          {log.ipAddress ?? "—"}
        </span>
      </td>

      <td className="px-6 py-5 text-right">
        <button
          type="button"
          onClick={onView}
          className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm font-medium text-[var(--foreground)] transition hover:bg-[var(--background)]"
        >
          View
        </button>
      </td>
    </tr>
  );
}

// =============================================================================
// Detail Modal
// =============================================================================

function AuditLogModal({
  log,
  loading,
  onClose,
}: {
  log: AuditLog;
  loading: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-start justify-between border-b border-[var(--border)] px-6 py-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--primary)]">
              Audit Event
            </p>

            <h2 className="mt-1 text-lg font-semibold text-[var(--foreground)]">
              {log.action} · {log.resource}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-xl text-[var(--foreground-muted)] hover:bg-[var(--background)]"
          >
            ×
          </button>
        </div>

        <div className="max-h-[65vh] overflow-auto px-6 py-6">
          {loading ? (
            <LoadingState text="Loading audit event..." />
          ) : (
            <div className="space-y-5">
              <DetailField label="Audit ID" value={log.id} mono />

              <DetailField label="Action" value={log.action} />

              <DetailField label="Resource" value={log.resource} />

              <DetailField
                label="Resource ID"
                value={log.resourceId ?? "—"}
                mono
              />

              <DetailField
                label="Actor"
                value={
                  log.actor ? `${log.actor.email} (${log.actor.id})` : "System"
                }
              />

              <DetailField
                label="Tenant"
                value={
                  log.tenant ? `${log.tenant.name} (${log.tenant.id})` : "—"
                }
              />

              <DetailField
                label="IP Address"
                value={log.ipAddress ?? "—"}
                mono
              />

              <DetailField label="User Agent" value={log.userAgent ?? "—"} />

              <DetailField
                label="Created At"
                value={new Date(log.createdAt).toLocaleString()}
              />

              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
                  Metadata
                </p>

                <pre className="max-h-72 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--background)] p-4 font-mono text-xs text-[var(--foreground-muted)]">
                  {JSON.stringify(log.metadata ?? {}, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-[var(--border)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function FilterField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
        {label}
      </label>

      {children}
    </div>
  );
}

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
        className={`break-all text-sm text-[var(--foreground)] ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-[var(--foreground-muted)]">
      {children}
    </th>
  );
}

function LoadingState({ text }: { text: string }) {
  return (
    <div className="text-center">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[var(--border)] border-t-[var(--primary)]" />

      <p className="mt-4 text-sm text-[var(--foreground-muted)]">{text}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const inputClass = `
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
  disabled:cursor-not-allowed
  disabled:opacity-50
`;

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

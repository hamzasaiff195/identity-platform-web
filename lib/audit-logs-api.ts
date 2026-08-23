import { api } from "./api";

export type AuditAction = string;

export type AuditResource = string;

export interface AuditActor {
  id: string;
  email: string;
}

export interface AuditTenant {
  id: string;
  name: string;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  tenantId: string | null;
  action: AuditAction;
  resource: AuditResource;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  actor: AuditActor | null;
  tenant: AuditTenant | null;
}

export interface AuditPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AuditLogsResponse {
  items: AuditLog[];
  pagination: AuditPagination;
}

export interface AuditLogQuery {
  page?: number;
  limit?: number;
  actorId?: string;
  tenantId?: string;
  resourceId?: string;
  action?: string;
  resource?: string;
  from?: string;
  to?: string;
}

// -----------------------------------------------------------------------------
// Get single audit log
// -----------------------------------------------------------------------------

export async function getAuditLog(
  accessToken: string,
  id: string
): Promise<AuditLog> {
  return api.get<AuditLog>(`/audit-logs/${id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// -----------------------------------------------------------------------------
// Get tenant audit logs
// -----------------------------------------------------------------------------

export async function getTenantAuditLogs(
  accessToken: string,
  tenantId: string,
  query: AuditLogQuery = {}
): Promise<AuditLogsResponse> {
  const params = new URLSearchParams();

  if (query.page !== undefined) {
    params.set("page", String(query.page));
  }

  if (query.limit !== undefined) {
    params.set("limit", String(query.limit));
  }

  if (query.actorId) {
    params.set("actorId", query.actorId);
  }

  if (query.tenantId) {
    params.set("tenantId", query.tenantId);
  }

  if (query.resourceId) {
    params.set("resourceId", query.resourceId);
  }

  if (query.action) {
    params.set("action", query.action);
  }

  if (query.resource) {
    params.set("resource", query.resource);
  }

  if (query.from) {
    params.set("from", query.from);
  }

  if (query.to) {
    params.set("to", query.to);
  }

  const queryString = params.toString();

  const path =
    `/audit-logs/tenants/${tenantId}` + (queryString ? `?${queryString}` : "");

  return api.get<AuditLogsResponse>(path, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

import { api } from "@/lib/api";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  legalName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  websiteUrl?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  timezone?: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateTenantInput = {
  name: string;
  slug: string;
  description?: string;
  legalName?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  country?: string;
  state?: string;
  city?: string;
  timezone?: string;
};

export type CreateTenantResponse = {
  message: string;
  tenant: Tenant;
};

export type TenantPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type Pagination = TenantPagination;

export type TenantMember = {
  id: string;
  tenantId: string;
  userId: string;
  joinedAt: string;
  user: {
    id: string;
    email: string;
    status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
    isVerified: boolean;
    isEmailVerified: boolean;
    createdAt?: string;
  };
};

export type UpdateTenantInput = {
  name?: string;
  slug?: string;
  description?: string;
  legalName?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  country?: string;
  state?: string;
  city?: string;
  timezone?: string;
  isActive?: boolean;
};

// -----------------------------------------------------------------------------
// Create tenant
// -----------------------------------------------------------------------------

export async function createTenant(
  accessToken: string,
  data: CreateTenantInput
): Promise<CreateTenantResponse> {
  return api.post<CreateTenantResponse>("/tenants", data, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// -----------------------------------------------------------------------------
// Get tenants
// -----------------------------------------------------------------------------

export async function getTenants(
  accessToken: string,
  page = 1,
  limit = 10,
  search = ""
): Promise<{
  tenants: Tenant[];
  pagination: TenantPagination;
}> {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  if (search.trim()) {
    params.set("search", search.trim());
  }

  return api.get<{
    tenants: Tenant[];
    pagination: TenantPagination;
  }>(`/tenants?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// -----------------------------------------------------------------------------
// Get single tenant
// -----------------------------------------------------------------------------

export async function getTenant(
  accessToken: string,
  tenantId: string
): Promise<Tenant> {
  return api.get<Tenant>(`/tenants/${tenantId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// -----------------------------------------------------------------------------
// Update tenant
// -----------------------------------------------------------------------------

export async function updateTenant(
  accessToken: string,
  tenantId: string,
  data: UpdateTenantInput
): Promise<Tenant> {
  return api.patch<Tenant>(`/tenants/${tenantId}`, data, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// -----------------------------------------------------------------------------
// Get tenant members
// -----------------------------------------------------------------------------

export async function getTenantMembers(
  accessToken: string,
  tenantId: string,
  page = 1,
  limit = 10,
  search = ""
): Promise<{
  members: TenantMember[];
  pagination: Pagination;
}> {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  if (search.trim()) {
    params.set("search", search.trim());
  }

  return api.get<{
    members: TenantMember[];
    pagination: Pagination;
  }>(`/tenants/${tenantId}/members?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// -----------------------------------------------------------------------------
// Add member
// -----------------------------------------------------------------------------

export async function addTenantMember(
  accessToken: string,
  tenantId: string,
  userId: string
): Promise<TenantMember> {
  return api.post<TenantMember>(
    `/tenants/${tenantId}/members`,
    {
      userId,
    },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}

// -----------------------------------------------------------------------------
// Remove member
// -----------------------------------------------------------------------------

export async function removeTenantMember(
  accessToken: string,
  tenantId: string,
  userId: string
): Promise<void> {
  return api.delete<void>(`/tenants/${tenantId}/members/${userId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

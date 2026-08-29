import { api } from "@/lib/api";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type TenantPagination = Pagination;

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
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
};

export type UpdateTenantInput = {
  name?: string;
  slug?: string;
  description?: string;
  legalName?: string;
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  city?: string;
  state?: string;
  country?: string;
  timezone?: string;
  isActive?: boolean;
};

export type TenantsResponse = {
  tenants: Tenant[];
  pagination: Pagination;
};

export type TenantMember = {
  id: string;
  userId: string;
  tenantId: string;
  isActive: boolean;
  joinedAt?: string | null;

  user: {
    id: string;
    email: string;
    status: string;
    isEmailVerified: boolean;
    isVerified: boolean;
    createdAt: string;
  };
};

export type TenantMembersResponse = {
  members: TenantMember[];
  pagination: Pagination;
};

// -----------------------------------------------------------------------------
// GET MY TENANTS
// -----------------------------------------------------------------------------

export async function getTenants(
  accessToken: string,
  page = 1,
  limit = 10,
  search?: string
): Promise<TenantsResponse> {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  return api.get<TenantsResponse>(`/tenants?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// -----------------------------------------------------------------------------
// GET TENANT
// -----------------------------------------------------------------------------

export async function getTenant(
  accessToken: string,
  tenantId: string
): Promise<Tenant> {
  return api.get<Tenant>(`/tenants/${encodeURIComponent(tenantId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// -----------------------------------------------------------------------------
// CREATE TENANT
// -----------------------------------------------------------------------------

export async function createTenant(
  accessToken: string,
  data: CreateTenantInput
): Promise<Tenant> {
  return api.post<Tenant>("/tenants", data, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// -----------------------------------------------------------------------------
// UPDATE TENANT
// -----------------------------------------------------------------------------

export async function updateTenant(
  accessToken: string,
  tenantId: string,
  data: UpdateTenantInput
): Promise<Tenant> {
  return api.patch<Tenant>(`/tenants/${encodeURIComponent(tenantId)}`, data, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// -----------------------------------------------------------------------------
// GET TENANT MEMBERS
// -----------------------------------------------------------------------------

export async function getTenantMembers(
  accessToken: string,
  tenantId: string,
  page = 1,
  limit = 10,
  search?: string
): Promise<TenantMembersResponse> {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  return api.get<TenantMembersResponse>(
    `/tenants/${encodeURIComponent(tenantId)}/members?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}

// -----------------------------------------------------------------------------
// ADD MEMBER
// -----------------------------------------------------------------------------

export async function addTenantMember(
  accessToken: string,
  tenantId: string,
  userId: string
): Promise<TenantMember> {
  return api.post<TenantMember>(
    `/tenants/${encodeURIComponent(tenantId)}/members`,
    { userId },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}

// -----------------------------------------------------------------------------
// REMOVE MEMBER
// -----------------------------------------------------------------------------

export async function removeTenantMember(
  accessToken: string,
  tenantId: string,
  userId: string
): Promise<void> {
  return api.delete<void>(
    `/tenants/${encodeURIComponent(tenantId)}/members/${encodeURIComponent(
      userId
    )}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}

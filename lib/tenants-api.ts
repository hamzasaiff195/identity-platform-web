import { api } from "@/lib/api";

export type TenantStatus = "ACTIVE" | "INACTIVE";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  contactEmail?: string | null;
  status: TenantStatus;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TenantPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type TenantsResponse = {
  tenants: Tenant[];
  pagination: TenantPagination;
};

export type TenantMember = {
  id: string;
  userId: string;
  tenantId: string;
  isActive: boolean;
  joinedAt?: string;
  user: {
    id: string;
    email: string;
    status: string;
    isEmailVerified: boolean;
  };
};

export type TenantMembersResponse = {
  members: TenantMember[];
  pagination: TenantPagination;
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
  return api.get<Tenant>(`/tenants/${tenantId}`, {
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
  data: {
    name: string;
    slug: string;
    contactEmail?: string;
  }
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
  data: {
    name?: string;
    slug?: string;
    contactEmail?: string;
    status?: TenantStatus;
  }
): Promise<Tenant> {
  return api.patch<Tenant>(`/tenants/${tenantId}`, data, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// -----------------------------------------------------------------------------
// GET MEMBERS
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
    `/tenants/${tenantId}/members?${params.toString()}`,
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
    `/tenants/${tenantId}/members`,
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
  return api.delete<void>(`/tenants/${tenantId}/members/${userId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

import { api } from "@/lib/api";
import type { Permission } from "@/lib/permissions-api";
import type { Role } from "@/lib/roles-api";

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type User = {
  id: string;
  email: string;
  status: UserStatus;

  isDeleted: boolean;

  isVerified: boolean;
  isEmailVerified: boolean;

  createdAt: string;
  updatedAt: string;

  deletedAt?: string | null;
};

export type UsersPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type UsersResponse = {
  users: User[];
  pagination: UsersPagination;
};

export async function getUsers(
  accessToken: string,
  page = 1,
  limit = 10,
  search?: string,
  status?: UserStatus
): Promise<UsersResponse> {
  const params = new URLSearchParams();

  params.set("page", String(page));
  params.set("limit", String(limit));

  if (search?.trim()) {
    params.set("search", search.trim());
  }

  if (status) {
    params.set("status", status);
  }

  return api.get<UsersResponse>(`/users?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function getUser(
  accessToken: string,
  userId: string
): Promise<User> {
  return api.get<User>(`/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function updateUserStatus(
  accessToken: string,
  userId: string,
  status: UserStatus
): Promise<{
  message: string;
  user: User;
}> {
  return api.patch<{
    message: string;
    user: User;
  }>(
    `/users/${userId}/status`,
    { status },
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}

export async function updateUser(
  accessToken: string,
  userId: string,
  data: {
    email?: string;
    password?: string;
  }
): Promise<{
  message: string;
  user: User;
}> {
  return api.patch<{
    message: string;
    user: User;
  }>(`/users/${userId}`, data, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function deleteUser(
  accessToken: string,
  userId: string
): Promise<void> {
  return api.delete<void>(`/users/${userId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function restoreUser(
  accessToken: string,
  userId: string
): Promise<User> {
  return api.post<User>(`/users/${userId}/restore`, undefined, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function revokeUserSessions(
  accessToken: string,
  userId: string
): Promise<void> {
  return api.post<void>(`/users/${userId}/sessions/revoke`, undefined, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function createUser(
  accessToken: string,
  data: {
    email: string;
    password: string;
  }
): Promise<{
  message: string;
  user: User;
}> {
  return api.post<{
    message: string;
    user: User;
  }>("/users", data, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// -----------------------------------------------------------------------------
// GET SYSTEM ROLES
// -----------------------------------------------------------------------------

export async function getSystemRoles(accessToken: string): Promise<Role[]> {
  return api.get<Role[]>("/roles/system", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// -----------------------------------------------------------------------------
// ASSIGN TENANT ROLE TO USER
// -----------------------------------------------------------------------------

export async function assignTenantRole(
  accessToken: string,
  tenantId: string,
  userId: string,
  roleId: string
): Promise<void> {
  return api.post<void>(
    `/roles/tenants/${encodeURIComponent(tenantId)}/users/${encodeURIComponent(
      userId
    )}/roles/${encodeURIComponent(roleId)}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}

// -----------------------------------------------------------------------------
// REMOVE TENANT ROLE FROM USER
// -----------------------------------------------------------------------------

export async function removeTenantRole(
  accessToken: string,
  tenantId: string,
  userId: string,
  roleId: string
): Promise<void> {
  return api.delete<void>(
    `/roles/tenants/${encodeURIComponent(tenantId)}/users/${encodeURIComponent(
      userId
    )}/roles/${encodeURIComponent(roleId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}

// -----------------------------------------------------------------------------
// GET TENANT MEMBER ROLES
// -----------------------------------------------------------------------------

export async function getTenantMemberRoles(
  accessToken: string,
  tenantId: string,
  userId: string
): Promise<Role[]> {
  return api.get<Role[]>(
    `/roles/tenants/${encodeURIComponent(tenantId)}/users/${encodeURIComponent(
      userId
    )}/roles`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}

// -----------------------------------------------------------------------------
// GET TENANT MEMBER EFFECTIVE PERMISSIONS
// -----------------------------------------------------------------------------

export async function getTenantMemberPermissions(
  accessToken: string,
  tenantId: string,
  userId: string
): Promise<Permission[]> {
  return api.get<Permission[]>(
    `/roles/tenants/${encodeURIComponent(tenantId)}/users/${encodeURIComponent(
      userId
    )}/permissions`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}

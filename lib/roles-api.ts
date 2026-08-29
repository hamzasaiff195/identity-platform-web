import { api } from "@/lib/api";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export type RoleScope = "SYSTEM" | "TENANT";

export type Role = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  scope: RoleScope;
  tenantId?: string | null;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Permission = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  resource: string;
  action: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type RolePermission = {
  id: string;
  roleId: string;
  permissionId: string;
  isActive: boolean;
  assignedAt: string;
  removedAt?: string | null;
  permission: Permission;
};

export type CreateRoleInput = {
  name: string;
  slug: string;
  description?: string;
};

export type CreateTenantRoleInput = {
  name: string;
  slug: string;
  description?: string;
  scope: "TENANT";
};

export type UpdateRoleInput = {
  name?: string;
  slug?: string;
  description?: string;
};

export type RoleAssignmentResponse = {
  message: string;
  role?: Role;
};

export type PermissionAssignmentResponse = {
  message: string;
  rolePermission?: RolePermission;
};

// -----------------------------------------------------------------------------
// TENANT ROLES
// -----------------------------------------------------------------------------

export async function getTenantRoles(
  accessToken: string,
  tenantId: string
): Promise<Role[]> {
  if (!tenantId) {
    throw new Error("Tenant ID is required.");
  }

  return api.get<Role[]>(`/roles/tenants/${encodeURIComponent(tenantId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function createTenantRole(
  accessToken: string,
  tenantId: string,
  data: CreateTenantRoleInput
): Promise<Role> {
  if (!tenantId) {
    throw new Error("Tenant ID is required.");
  }

  const response = await api.post<{
    message: string;
    role: Role;
  }>(`/roles/tenants/${encodeURIComponent(tenantId)}`, data, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.role;
}

// -----------------------------------------------------------------------------
// SINGLE ROLE
// -----------------------------------------------------------------------------

export async function getRole(
  accessToken: string,
  roleId: string
): Promise<Role> {
  return api.get<Role>(`/roles/${encodeURIComponent(roleId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export async function updateRole(
  accessToken: string,
  roleId: string,
  data: UpdateRoleInput
): Promise<Role> {
  const response = await api.put<{
    message: string;
    role: Role;
  }>(`/roles/${encodeURIComponent(roleId)}`, data, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return response.role;
}

export async function deleteRole(
  accessToken: string,
  roleId: string
): Promise<void> {
  await api.delete(`/roles/${encodeURIComponent(roleId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// -----------------------------------------------------------------------------
// ROLE PERMISSIONS
// -----------------------------------------------------------------------------

export async function getRolePermissions(
  accessToken: string,
  roleId: string
): Promise<RolePermission[]> {
  return api.get<RolePermission[]>(
    `/roles/${encodeURIComponent(roleId)}/permissions`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}

export async function assignPermissionToRole(
  accessToken: string,
  roleId: string,
  permissionId: string
): Promise<PermissionAssignmentResponse> {
  return api.post<PermissionAssignmentResponse>(
    `/roles/${encodeURIComponent(roleId)}/permissions/${encodeURIComponent(
      permissionId
    )}`,
    {},
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}

export async function removePermissionFromRole(
  accessToken: string,
  roleId: string,
  permissionId: string
): Promise<void> {
  await api.delete(
    `/roles/${encodeURIComponent(roleId)}/permissions/${encodeURIComponent(
      permissionId
    )}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}

// -----------------------------------------------------------------------------
// SYSTEM ROLES
// -----------------------------------------------------------------------------

export async function getSystemRoles(accessToken: string): Promise<Role[]> {
  return api.get<Role[]>("/roles/system", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// -----------------------------------------------------------------------------
// TENANT MEMBER ROLES
// -----------------------------------------------------------------------------

export async function assignTenantRole(
  accessToken: string,
  tenantId: string,
  userId: string,
  roleId: string
): Promise<RoleAssignmentResponse> {
  return api.post<RoleAssignmentResponse>(
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

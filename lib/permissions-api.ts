import { api } from "@/lib/api";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export type Permission = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  resource: string;
  action: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreatePermissionInput = {
  name: string;
  slug: string;
  description?: string;
  resource: string;
  action: string;
};

export type UpdatePermissionInput = {
  name?: string;
  slug?: string;
  description?: string;
  resource?: string;
  action?: string;
  isActive?: boolean;
};

// -----------------------------------------------------------------------------
// GET ALL PERMISSIONS
// -----------------------------------------------------------------------------

export async function getPermissions(
  accessToken: string
): Promise<Permission[]> {
  return api.get<Permission[]>("/permissions", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// -----------------------------------------------------------------------------
// GET SINGLE PERMISSION
// -----------------------------------------------------------------------------

export async function getPermission(
  accessToken: string,
  permissionId: string
): Promise<Permission> {
  return api.get<Permission>(
    `/permissions/${encodeURIComponent(permissionId)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}

// -----------------------------------------------------------------------------
// CREATE PERMISSION
// -----------------------------------------------------------------------------

export async function createPermission(
  accessToken: string,
  input: CreatePermissionInput
): Promise<Permission> {
  return api.post<Permission>("/permissions", input, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

// -----------------------------------------------------------------------------
// UPDATE PERMISSION
// -----------------------------------------------------------------------------

export async function updatePermission(
  accessToken: string,
  permissionId: string,
  input: UpdatePermissionInput
): Promise<Permission> {
  return api.patch<Permission>(
    `/permissions/${encodeURIComponent(permissionId)}`,
    input,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
}

// -----------------------------------------------------------------------------
// DELETE PERMISSION
// -----------------------------------------------------------------------------

export async function deletePermission(
  accessToken: string,
  permissionId: string
): Promise<void> {
  await api.delete<void>(`/permissions/${encodeURIComponent(permissionId)}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

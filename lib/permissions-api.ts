import { api } from "@/lib/api";

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

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

console.log("[PERMISSIONS API] API_URL:", API_URL);

async function request<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      ...(options.headers ?? {}),
    },
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(body?.message || body?.error || "Request failed.");
  }

  return body?.data ?? body;
}

export async function getPermissions(
  accessToken: string
): Promise<Permission[]> {
  return request<Permission[]>("/permissions", accessToken);
}

export async function getPermission(
  accessToken: string,
  permissionId: string
): Promise<Permission> {
  return request<Permission>(`/permissions/${permissionId}`, accessToken);
}

export async function createPermission(
  accessToken: string,
  input: CreatePermissionInput
): Promise<Permission> {
  return request<Permission>("/permissions", accessToken, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updatePermission(
  accessToken: string,
  permissionId: string,
  input: UpdatePermissionInput
): Promise<Permission> {
  return request<Permission>(`/permissions/${permissionId}`, accessToken, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deletePermission(
  accessToken: string,
  permissionId: string
): Promise<void> {
  await request(`/permissions/${permissionId}`, accessToken, {
    method: "DELETE",
  });
}

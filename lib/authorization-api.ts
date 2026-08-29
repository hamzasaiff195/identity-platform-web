import { api } from "@/lib/api";

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

export type EffectiveTenantRole = {
  id: string;
  name: string;
  slug: string;
  scope: "TENANT";
  tenantId: string;
};

export type EffectiveTenantPermission = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  resource: string;
  action: string;
};

export type TenantAuthorization = {
  /**
   * Whether the authenticated user is an active member
   * of the requested tenant.
   */
  isMember: boolean;

  /**
   * Effective tenant roles assigned to the user.
   */
  roles: EffectiveTenantRole[];

  /**
   * Effective permissions inherited from the user's
   * tenant roles.
   */
  permissions: EffectiveTenantPermission[];
};

// -----------------------------------------------------------------------------
// GET TENANT AUTHORIZATION
// -----------------------------------------------------------------------------

export async function getTenantAuthorization(
  accessToken: string,
  tenantId: string,
  userId: string
): Promise<TenantAuthorization> {
  if (!tenantId) {
    throw new Error("Tenant ID is required.");
  }

  if (!userId) {
    throw new Error("User ID is required.");
  }

  return api.get<TenantAuthorization>(
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

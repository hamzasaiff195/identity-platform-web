import { api } from "@/lib/api";

/* ========================================================================== */
/* TYPES                                                                      */
/* ========================================================================== */

export type AiSearchSourceType = "ROLE" | "TENANT" | string;

/* -------------------------------------------------------------------------- */
/* ROLE                                                                       */
/* -------------------------------------------------------------------------- */

export type AiSearchRoleData = {
  type: "ROLE";

  tenantId?: string;
  tenantName?: string;

  roleId?: string;
  roleName?: string;
  roleSlug?: string;
  roleScope?: string;

  description?: string | null;

  permissions?: string[];
  capabilities?: string[];
};

/* -------------------------------------------------------------------------- */
/* TENANT                                                                     */
/* -------------------------------------------------------------------------- */

export type AiSearchTenantData = {
  type: "TENANT";

  tenantId?: string;
  tenantName?: string;
  tenantSlug?: string;

  description?: string | null;
  legalName?: string | null;

  contactEmail?: string | null;
  contactPhone?: string | null;

  websiteUrl?: string | null;

  country?: string | null;
  state?: string | null;
  city?: string | null;
  timezone?: string | null;
};

/* -------------------------------------------------------------------------- */
/* UNKNOWN                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Unknown structured metadata.
 *
 * Important:
 * Do NOT use Record<string, unknown> directly in the main union.
 *
 * It allows arbitrary objects to enter places where the UI expects
 * ROLE/TENANT data and causes TypeScript narrowing problems.
 */
export type AiSearchUnknownData = {
  type?: string;
  [key: string]: unknown;
};

/* -------------------------------------------------------------------------- */
/* STRUCTURED DATA                                                            */
/* -------------------------------------------------------------------------- */

export type AiSearchStructuredData =
  | AiSearchRoleData
  | AiSearchTenantData
  | AiSearchUnknownData;

/* -------------------------------------------------------------------------- */
/* RESULT                                                                     */
/* -------------------------------------------------------------------------- */

export type AiSearchResult = {
  id: string;

  documentId: string;

  chunkIndex: number;

  content: string;

  sourceType: AiSearchSourceType;

  sourceId: string;

  /**
   * Original AI chunk metadata.
   */
  chunkMetadata: unknown;

  /**
   * Original AI document metadata.
   */
  documentMetadata: unknown;

  /**
   * Structured data generated during indexing.
   */
  data?: AiSearchStructuredData | null;

  /**
   * Retrieval scores.
   *
   * Expected range: 0..1
   */
  semanticScore: number;

  keywordScore: number;

  hybridScore: number;
};

/* -------------------------------------------------------------------------- */
/* REQUEST                                                                    */
/* -------------------------------------------------------------------------- */

export type AiSearchRequest = {
  query: string;

  tenantId?: string;

  limit?: number;
};

/* ========================================================================== */
/* API                                                                        */
/* ========================================================================== */

export async function searchAi(
  accessToken: string,
  data: AiSearchRequest
): Promise<AiSearchResult[]> {
  return api.post<AiSearchResult[]>("/ai/search", data, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

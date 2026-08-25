"use client";

import { FormEvent, ReactNode, useEffect, useState } from "react";

import {
  BrainCircuit,
  Check,
  ChevronDown,
  Database,
  Globe,
  KeyRound,
  Mail,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { getTenants, type Tenant } from "@/lib/tenants-api";

import {
  searchAi,
  type AiSearchResult,
  type AiSearchRoleData,
  type AiSearchTenantData,
  type AiSearchStructuredData,
} from "@/lib/ai-search-api";

/* ========================================================================= */
/* PAGE                                                                      */
/* ========================================================================= */

export default function AiSearchPage() {
  const { accessToken, loading: authLoading, isSuperAdmin } = useAuth();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [tenantsLoading, setTenantsLoading] = useState(false);

  const [tenantId, setTenantId] = useState("");
  const [query, setQuery] = useState("");

  const [results, setResults] = useState<AiSearchResult[]>([]);

  const [selectedResult, setSelectedResult] = useState<AiSearchResult | null>(
    null
  );

  const [searching, setSearching] = useState(false);

  const [error, setError] = useState<string | null>(null);

  /* ====================================================================== */
  /* LOAD TENANTS                                                           */
  /* ====================================================================== */

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const token = accessToken;

    let mounted = true;

    async function loadTenants() {
      setTenantsLoading(true);

      try {
        const response = await getTenants(token, 1, 100);

        if (mounted) {
          setTenants(response.tenants);
        }
      } catch (error) {
        console.error("[AI SEARCH] Failed to load tenants:", error);

        if (mounted) {
          setError(
            error instanceof Error ? error.message : "Failed to load tenants"
          );
        }
      } finally {
        if (mounted) {
          setTenantsLoading(false);
        }
      }
    }

    void loadTenants();

    return () => {
      mounted = false;
    };
  }, [accessToken]);

  /* ====================================================================== */
  /* SEARCH                                                                 */
  /* ====================================================================== */

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      setError("Please enter a search query.");
      return;
    }

    if (!accessToken) {
      setError("Authentication session is not available.");
      return;
    }

    if (!isSuperAdmin && !tenantId) {
      setError("Please select a tenant.");
      return;
    }

    setSearching(true);
    setError(null);
    setResults([]);
    setSelectedResult(null);

    try {
      const response = await searchAi(accessToken, {
        query: normalizedQuery,
        limit: 10,
        ...(tenantId ? { tenantId } : {}),
      });

      setResults(response);
    } catch (error) {
      console.error("[AI SEARCH] Search failed:", error);

      setError(error instanceof Error ? error.message : "AI search failed");
    } finally {
      setSearching(false);
    }
  }

  /* ====================================================================== */
  /* AUTH LOADING                                                            */
  /* ====================================================================== */

  if (authLoading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-10">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 rounded bg-[var(--surface-muted)]" />

            <div className="h-10 w-72 rounded bg-[var(--surface-muted)]" />

            <div className="h-4 w-full max-w-xl rounded bg-[var(--surface-muted)]" />
          </div>
        </div>
      </div>
    );
  }

  /* ====================================================================== */
  /* PAGE                                                                    */
  /* ====================================================================== */

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* ================================================================== */}
      {/* HERO                                                               */}
      {/* ================================================================== */}

      <section
        className="
          relative
          overflow-hidden
          rounded-3xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          p-8
          shadow-[var(--shadow-sm)]
          lg:p-10
        "
      >
        <div
          className="
            absolute
            -right-24
            -top-24
            h-72
            w-72
            rounded-full
            bg-[var(--primary)]
            opacity-[0.08]
            blur-3xl
          "
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-2xl
                bg-[var(--primary-soft)]
                text-[var(--primary)]
              "
            >
              <BrainCircuit className="h-5 w-5" />
            </div>

            <div>
              <p
                className="
                  font-mono
                  text-[10px]
                  uppercase
                  tracking-[0.2em]
                  text-[var(--primary)]
                "
              >
                Intelligence
              </p>

              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                AI Search
              </h1>
            </div>
          </div>

          <p className="mt-5 max-w-3xl text-sm leading-6 text-[var(--foreground-muted)]">
            Search tenant knowledge using semantic and keyword retrieval. Click
            any result to inspect its structured knowledge.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <FeatureBadge
              icon={<Sparkles className="h-3.5 w-3.5" />}
              label="Semantic Search"
            />

            <FeatureBadge
              icon={<Database className="h-3.5 w-3.5" />}
              label="Hybrid Search"
            />

            <FeatureBadge
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              label="Tenant Scoped"
            />
          </div>
        </div>
      </section>

      {/* ================================================================== */}
      {/* SEARCH PANEL                                                       */}
      {/* ================================================================== */}

      <section
        className="
          rounded-3xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          p-6
          shadow-[var(--shadow-sm)]
          lg:p-8
        "
      >
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--primary)]">
          Query
        </p>

        <h2 className="mt-2 text-xl font-semibold">Search your AI knowledge</h2>

        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          Ask a natural-language question about tenants, roles, permissions, or
          indexed platform knowledge.
        </p>

        <form onSubmit={handleSearch} className="mt-6 space-y-5">
          {/* TENANT */}

          <div>
            <label
              htmlFor="tenant"
              className="mb-2 block text-sm font-medium text-[var(--foreground-secondary)]"
            >
              Tenant
            </label>

            <select
              id="tenant"
              value={tenantId}
              onChange={(event) => {
                setTenantId(event.target.value);
                setError(null);
                setResults([]);
                setSelectedResult(null);
              }}
              className="
                w-full
                rounded-xl
                border
                border-[var(--border)]
                bg-[var(--surface)]
                px-4
                py-3
                text-sm
                outline-none
                transition
                focus:border-[var(--primary)]
                focus:ring-2
                focus:ring-[var(--primary-soft)]
              "
            >
              {isSuperAdmin && (
                <option value="">All tenants / platform knowledge</option>
              )}

              {!isSuperAdmin && (
                <option value="">
                  {tenantsLoading ? "Loading tenants..." : "Select a tenant"}
                </option>
              )}

              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>

            <p className="mt-2 text-xs text-[var(--foreground-subtle)]">
              {isSuperAdmin
                ? "Super admins can search globally or select a specific tenant."
                : "Tenant selection is required for tenant-scoped search."}
            </p>
          </div>

          {/* QUESTION */}

          <div>
            <label
              htmlFor="query"
              className="mb-2 block text-sm font-medium text-[var(--foreground-secondary)]"
            >
              Question
            </label>

            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--foreground-subtle)]" />

              <input
                id="query"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setError(null);
                }}
                placeholder="e.g. Who can add members to a tenant?"
                className="
                  w-full
                  rounded-xl
                  border
                  border-[var(--border)]
                  bg-[var(--surface)]
                  py-3
                  pl-12
                  pr-4
                  text-sm
                  outline-none
                  transition
                  placeholder:text-[var(--foreground-subtle)]
                  focus:border-[var(--primary)]
                  focus:ring-2
                  focus:ring-[var(--primary-soft)]
                "
              />
            </div>
          </div>

          {/* ERROR */}

          {error && (
            <div className="rounded-xl border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
              {error}
            </div>
          )}

          {/* BUTTON */}

          <button
            type="submit"
            disabled={
              searching || !query.trim() || (!isSuperAdmin && !tenantId)
            }
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-[var(--primary)]
              px-5
              py-3
              text-sm
              font-semibold
              text-white
              shadow-sm
              transition
              hover:opacity-90
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {searching ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Searching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Search Knowledge
              </>
            )}
          </button>
        </form>
      </section>

      {/* ================================================================== */}
      {/* RESULTS                                                            */}
      {/* ================================================================== */}

      {results.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[var(--primary)]">
                Retrieval
              </p>

              <h2 className="mt-2 text-xl font-semibold">Search results</h2>
            </div>

            <span className="rounded-full bg-[var(--primary-soft)] px-3 py-1 font-mono text-xs text-[var(--primary)]">
              {results.length} {results.length === 1 ? "result" : "results"}
            </span>
          </div>

          <div className="overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]">
            {results.map((result, index) => (
              <SearchResultRow
                key={`${result.id}-${index}`}
                result={result}
                index={index}
                onClick={() => setSelectedResult(result)}
              />
            ))}
          </div>
        </section>
      )}

      {/* ================================================================== */}
      {/* EMPTY                                                              */}
      {/* ================================================================== */}

      {!searching && results.length === 0 && !error && (
        <section className="rounded-3xl border border-dashed border-[var(--border)] bg-[var(--surface-muted)] p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface)] text-[var(--primary)] shadow-sm">
            <BrainCircuit className="h-6 w-6" />
          </div>

          <h3 className="mt-5 text-lg font-semibold">
            Ask your first question
          </h3>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--foreground-muted)]">
            Try questions such as &quot;Who can read the tenant?&quot; or
            &quot;Which role can manage tenant members?&quot;
          </p>
        </section>
      )}

      {/* ================================================================== */}
      {/* MODAL                                                              */}
      {/* ================================================================== */}

      {selectedResult && (
        <KnowledgeModal
          result={selectedResult}
          onClose={() => setSelectedResult(null)}
        />
      )}
    </div>
  );
}

/* ========================================================================= */
/* RESULT ROW                                                               */
/* ========================================================================= */

function SearchResultRow({
  result,
  index,
  onClick,
}: {
  result: AiSearchResult;
  index: number;
  onClick: () => void;
}) {
  const hybrid = percentage(result.hybridScore);

  const data = result.data;

  const isRole = isRoleData(data);
  const isTenant = isTenantData(data);

  const title = getResultTitle(data);

  const subtitle = getResultSubtitle(data);

  const description = getResultDescription(data);

  const permissions = isRole ? data.permissions ?? [] : [];

  const icon = isRole ? (
    <ShieldCheck className="h-5 w-5" />
  ) : isTenant ? (
    <Users className="h-5 w-5" />
  ) : (
    <BrainCircuit className="h-5 w-5" />
  );

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group
        w-full
        border-b
        border-[var(--border)]
        px-5
        py-5
        text-left
        transition
        last:border-b-0
        hover:bg-[var(--surface-muted)]
      "
    >
      <div className="flex items-start gap-4">
        {/* NUMBER */}

        <div
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-xl
            bg-[var(--primary-soft)]
            font-mono
            text-xs
            font-semibold
            text-[var(--primary)]
          "
        >
          {String(index + 1).padStart(2, "0")}
        </div>

        {/* ICON */}

        <div
          className="
            hidden
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
            text-[var(--primary)]
            sm:flex
          "
        >
          {icon}
        </div>

        {/* CONTENT */}

        <div className="min-w-0 flex-1">
          {/* TYPE */}

          <div className="flex flex-wrap items-center gap-2">
            <span
              className="
                rounded-full
                bg-[var(--primary-soft)]
                px-2.5
                py-1
                font-mono
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.15em]
                text-[var(--primary)]
              "
            >
              {result.sourceType}
            </span>

            {isRole && data.roleScope && (
              <span
                className="
                  rounded-full
                  border
                  border-[var(--border)]
                  px-2.5
                  py-1
                  font-mono
                  text-[9px]
                  uppercase
                  tracking-[0.12em]
                  text-[var(--foreground-subtle)]
                "
              >
                {data.roleScope}
              </span>
            )}

            {isTenant && data.tenantSlug && (
              <span className="font-mono text-[10px] text-[var(--foreground-subtle)]">
                @{data.tenantSlug}
              </span>
            )}
          </div>

          {/* TITLE */}

          <h3 className="mt-2 truncate text-base font-semibold text-[var(--foreground)]">
            {title}
          </h3>

          {/* SUBTITLE */}

          <p className="mt-1 truncate text-sm text-[var(--foreground-muted)]">
            {subtitle}
          </p>

          {/* DESCRIPTION */}

          {description && (
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--foreground-subtle)]">
              {description}
            </p>
          )}

          {/* ROLE PERMISSIONS */}

          {permissions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {permissions.slice(0, 4).map((permission) => (
                <span
                  key={permission}
                  className="
                    rounded-lg
                    border
                    border-[var(--border)]
                    bg-[var(--surface-muted)]
                    px-2
                    py-1
                    font-mono
                    text-[9px]
                    text-[var(--foreground-muted)]
                  "
                >
                  {permission}
                </span>
              ))}

              {permissions.length > 4 && (
                <span
                  className="
                    rounded-lg
                    border
                    border-[var(--border)]
                    bg-[var(--surface-muted)]
                    px-2
                    py-1
                    font-mono
                    text-[9px]
                    text-[var(--foreground-subtle)]
                  "
                >
                  +{permissions.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* SCORE */}

        <div className="hidden w-32 shrink-0 md:block">
          <div className="text-right">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--foreground-subtle)]">
              Relevance
            </p>

            <p className="mt-1 text-sm font-semibold text-[var(--foreground)]">
              {hybrid.toFixed(1)}%
            </p>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-muted)]">
            <div
              className="h-full rounded-full bg-[var(--primary)] transition-all"
              style={{
                width: `${hybrid}%`,
              }}
            />
          </div>

          <div className="mt-2 flex justify-end gap-2 font-mono text-[8px] text-[var(--foreground-subtle)]">
            <span>S {percentage(result.semanticScore).toFixed(0)}</span>

            <span>K {percentage(result.keywordScore).toFixed(0)}</span>
          </div>
        </div>

        {/* ARROW */}

        <div className="pt-1">
          <ChevronDown className="h-4 w-4 -rotate-90 text-[var(--foreground-subtle)] transition group-hover:translate-x-0.5 group-hover:text-[var(--primary)]" />
        </div>
      </div>
    </button>
  );
}

/* ========================================================================= */
/* MODAL                                                                     */
/* ========================================================================= */

function KnowledgeModal({
  result,
  onClose,
}: {
  result: AiSearchResult;
  onClose: () => void;
}) {
  const data = result.data;

  const hybrid = percentage(result.hybridScore);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const isRole = isRoleData(data);
  const isTenant = isTenantData(data);

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        bg-black/50
        p-4
        backdrop-blur-sm
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="
          flex
          max-h-[90vh]
          w-full
          max-w-3xl
          flex-col
          overflow-hidden
          rounded-3xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          shadow-2xl
        "
      >
        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-6 py-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--primary-soft)] px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.15em] text-[var(--primary)]">
                {result.sourceType}
              </span>

              <span className="rounded-full bg-[var(--success-soft)] px-2.5 py-1 font-mono text-[9px] font-semibold text-[var(--success)]">
                {hybrid.toFixed(1)}% match
              </span>
            </div>

            <h2 className="mt-3 text-xl font-semibold">
              {getResultTitle(data)}
            </h2>

            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              {getResultSubtitle(data)}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--foreground-muted)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BODY */}

        <div className="overflow-y-auto p-6">
          {isRole && <RoleDetails data={data} />}

          {isTenant && <TenantDetails data={data} />}

          {!isRole && !isTenant && <FallbackDetails result={result} />}

          {/* RETRIEVAL */}

          <div className="mt-8">
            <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--foreground-subtle)]">
              Retrieval
            </p>

            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <ScoreItem label="Semantic" value={result.semanticScore} />

              <ScoreItem label="Keyword" value={result.keywordScore} />

              <ScoreItem label="Hybrid" value={result.hybridScore} emphasized />
            </div>
          </div>

          {/* TECHNICAL */}

          <details className="group mt-6 overflow-hidden rounded-2xl border border-[var(--border)]">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-medium text-[var(--foreground-muted)] hover:bg-[var(--surface-muted)]">
              Technical details
              <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
            </summary>

            <div className="grid gap-4 border-t border-[var(--border)] bg-[var(--surface-muted)] p-4 sm:grid-cols-3">
              <MetadataItem label="Document" value={result.documentId} />

              <MetadataItem label="Source" value={result.sourceId} />

              <MetadataItem label="Chunk" value={String(result.chunkIndex)} />
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================= */
/* ROLE DETAILS                                                              */
/* ========================================================================= */

function RoleDetails({ data }: { data: AiSearchRoleData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoRow
          label="Tenant"
          value={data.tenantName}
          icon={<Users className="h-4 w-4" />}
        />

        <InfoRow
          label="Role"
          value={data.roleName}
          icon={<ShieldCheck className="h-4 w-4" />}
        />

        <InfoRow
          label="Role slug"
          value={data.roleSlug}
          icon={<KeyRound className="h-4 w-4" />}
        />

        <InfoRow
          label="Scope"
          value={data.roleScope}
          icon={<Database className="h-4 w-4" />}
        />
      </div>

      <Section title="Description">
        <p className="text-sm leading-7 text-[var(--foreground-secondary)]">
          {data.description || "No description available."}
        </p>
      </Section>

      <Section title="Capabilities">
        {data.capabilities && data.capabilities.length > 0 ? (
          <div className="space-y-2">
            {data.capabilities.map((capability) => (
              <div
                key={capability}
                className="flex items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3"
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />

                <span className="text-sm text-[var(--foreground-secondary)]">
                  {capability}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <EmptyValue />
        )}
      </Section>

      <Section title="Permissions">
        {data.permissions && data.permissions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {data.permissions.map((permission) => (
              <span
                key={permission}
                className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 font-mono text-xs text-[var(--foreground-secondary)]"
              >
                {permission}
              </span>
            ))}
          </div>
        ) : (
          <EmptyValue />
        )}
      </Section>
    </div>
  );
}

/* ========================================================================= */
/* TENANT DETAILS                                                            */
/* ========================================================================= */

function TenantDetails({ data }: { data: AiSearchTenantData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <InfoRow
          label="Tenant"
          value={data.tenantName}
          icon={<Users className="h-4 w-4" />}
        />

        <InfoRow
          label="Slug"
          value={data.tenantSlug}
          icon={<KeyRound className="h-4 w-4" />}
        />

        <InfoRow
          label="Legal name"
          value={data.legalName}
          icon={<Database className="h-4 w-4" />}
        />

        <InfoRow
          label="Timezone"
          value={data.timezone}
          icon={<Globe className="h-4 w-4" />}
        />
      </div>

      <Section title="Description">
        <p className="text-sm leading-7 text-[var(--foreground-secondary)]">
          {data.description || "No description available."}
        </p>
      </Section>

      <Section title="Contact">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow
            label="Email"
            value={data.contactEmail}
            icon={<Mail className="h-4 w-4" />}
          />

          <InfoRow
            label="Phone"
            value={data.contactPhone}
            icon={<Users className="h-4 w-4" />}
          />

          <InfoRow
            label="Website"
            value={data.websiteUrl}
            icon={<Globe className="h-4 w-4" />}
          />
        </div>
      </Section>

      <Section title="Location">
        <div className="grid gap-3 sm:grid-cols-3">
          <InfoRow
            label="City"
            value={data.city}
            icon={<MapPin className="h-4 w-4" />}
          />

          <InfoRow
            label="State"
            value={data.state}
            icon={<MapPin className="h-4 w-4" />}
          />

          <InfoRow
            label="Country"
            value={data.country}
            icon={<MapPin className="h-4 w-4" />}
          />
        </div>
      </Section>
    </div>
  );
}

/* ========================================================================= */
/* FALLBACK                                                                  */
/* ========================================================================= */

function FallbackDetails({ result }: { result: AiSearchResult }) {
  return (
    <Section title="Knowledge">
      <p className="whitespace-pre-wrap text-sm leading-7 text-[var(--foreground-secondary)]">
        {result.content}
      </p>
    </Section>
  );
}

/* ========================================================================= */
/* INFO ROW                                                                  */
/* ========================================================================= */

function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string | null;
  icon?: ReactNode;
}) {
  const displayValue =
    typeof value === "string" && value.trim() ? value : "Not available";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-[var(--primary)]">{icon}</span>

        <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--foreground-subtle)]">
          {label}
        </p>
      </div>

      <p className="mt-2 break-words text-sm font-medium text-[var(--foreground-secondary)]">
        {displayValue}
      </p>
    </div>
  );
}

/* ========================================================================= */
/* SECTION                                                                   */
/* ========================================================================= */

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>

      {children}
    </section>
  );
}

/* ========================================================================= */
/* SCORE                                                                     */
/* ========================================================================= */

function ScoreItem({
  label,
  value,
  emphasized = false,
}: {
  label: string;
  value: number;
  emphasized?: boolean;
}) {
  const score = percentage(value);

  return (
    <div
      className={`
        rounded-xl
        border
        px-4
        py-3
        ${
          emphasized
            ? "border-[var(--primary)] bg-[var(--primary-soft)]"
            : "border-[var(--border)] bg-[var(--surface-muted)]"
        }
      `}
    >
      <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--foreground-subtle)]">
        {label}
      </p>

      <p
        className={`
          mt-1
          text-sm
          font-semibold
          ${emphasized ? "text-[var(--primary)]" : "text-[var(--foreground)]"}
        `}
      >
        {score.toFixed(2)}%
      </p>
    </div>
  );
}

/* ========================================================================= */
/* METADATA                                                                  */
/* ========================================================================= */

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--foreground-subtle)]">
        {label}
      </p>

      <p
        className="mt-1 truncate font-mono text-[10px] text-[var(--foreground-muted)]"
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

/* ========================================================================= */
/* FEATURE BADGE                                                             */
/* ========================================================================= */

function FeatureBadge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-1.5 text-xs text-[var(--foreground-muted)]">
      <span className="text-[var(--primary)]">{icon}</span>

      {label}
    </span>
  );
}

/* ========================================================================= */
/* EMPTY                                                                     */
/* ========================================================================= */

function EmptyValue() {
  return (
    <p className="text-sm text-[var(--foreground-subtle)]">
      Nothing available.
    </p>
  );
}

/* ========================================================================= */
/* TYPE GUARDS                                                               */
/* ========================================================================= */

/**
 * Runtime-safe check for ROLE structured data.
 */
function isRoleData(
  data: AiSearchStructuredData | null | undefined
): data is AiSearchRoleData {
  return data?.type === "ROLE";
}

/**
 * Runtime-safe check for TENANT structured data.
 */
function isTenantData(
  data: AiSearchStructuredData | null | undefined
): data is AiSearchTenantData {
  return data?.type === "TENANT";
}

/* ========================================================================= */
/* HELPERS                                                                   */
/* ========================================================================= */

function percentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, value * 100));
}

function getResultTitle(
  data: AiSearchStructuredData | null | undefined
): string {
  if (isRoleData(data)) {
    return data.roleName ?? "Role";
  }

  if (isTenantData(data)) {
    return data.tenantName ?? "Tenant";
  }

  return "AI knowledge result";
}

function getResultSubtitle(
  data: AiSearchStructuredData | null | undefined
): string {
  if (isRoleData(data)) {
    return data.tenantName ?? "Tenant role";
  }

  if (isTenantData(data)) {
    return data.tenantSlug ?? "Tenant";
  }

  return "Indexed knowledge";
}

function getResultDescription(
  data: AiSearchStructuredData | null | undefined
): string {
  if (isRoleData(data)) {
    return data.description?.trim() || "";
  }

  if (isTenantData(data)) {
    return data.description?.trim() || "";
  }

  return "";
}

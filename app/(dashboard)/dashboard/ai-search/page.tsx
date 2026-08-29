"use client";

import {
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  BrainCircuit,
  ChevronDown,
  Database,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { useAuth } from "@/providers/auth-provider";
import { getTenants, type Tenant } from "@/lib/tenants-api";

import {
  searchAi,
  type AiSearchResult,
  type AiSearchStructuredData,
} from "@/lib/ai-search-api";

import { AiSearchDetailModal } from "./ai-search-detail-model";

/* ========================================================================= */
/* PAGE                                                                      */
/* ========================================================================= */

export default function AiSearchPage() {
  const { accessToken, loading: authLoading, isSuperAdmin } = useAuth();

  const queryInputRef = useRef<HTMLInputElement>(null);

  /*
   * Used to automatically scroll to the results after
   * a search has completed.
   */
  const resultsRef = useRef<HTMLElement>(null);

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

  const [hasSearched, setHasSearched] = useState(false);

  /* ======================================================================= */
  /* LOAD TENANTS                                                            */
  /* ======================================================================= */

  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const token = accessToken;
    let mounted = true;

    async function loadTenants() {
      setTenantsLoading(true);
      setError(null);

      try {
        const response = await getTenants(token, 1, 100);

        if (!mounted) {
          return;
        }

        setTenants(response.tenants);
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

  /* ======================================================================= */
  /* SEARCH                                                                  */
  /* ======================================================================= */

  const executeSearch = useCallback(
    async (searchQuery: string) => {
      const normalizedQuery = searchQuery.trim();

      if (!normalizedQuery) {
        setError("Please enter a search query.");

        queryInputRef.current?.focus();

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
      setHasSearched(false);

      try {
        const response = await searchAi(accessToken, {
          query: normalizedQuery,
          limit: 10,
          ...(tenantId ? { tenantId } : {}),
        });

        setResults(response);
        setHasSearched(true);
      } catch (error) {
        console.error("[AI SEARCH] Search failed:", error);

        setError(error instanceof Error ? error.message : "AI search failed");

        setHasSearched(false);
      } finally {
        setSearching(false);
      }
    },
    [accessToken, isSuperAdmin, tenantId]
  );

  /* ======================================================================= */
  /* SCROLL TO RESULTS                                                       */
  /* ======================================================================= */

  useEffect(() => {
    if (!hasSearched || searching) {
      return;
    }

    /*
     * Wait until React has rendered the results section,
     * then scroll it into view.
     */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    });
  }, [hasSearched, searching]);

  /* ======================================================================= */
  /* FORM SUBMIT                                                             */
  /* ======================================================================= */

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    await executeSearch(query);
  }

  /* ======================================================================= */
  /* NEW SEARCH                                                              */
  /* ======================================================================= */

  function handleNewSearch() {
    setQuery("");
    setResults([]);
    setSelectedResult(null);
    setError(null);
    setHasSearched(false);

    requestAnimationFrame(() => {
      queryInputRef.current?.focus();
    });
  }

  /* ======================================================================= */
  /* TENANT CHANGE                                                           */
  /* ======================================================================= */

  function handleTenantChange(value: string) {
    setTenantId(value);
    setError(null);
    setResults([]);
    setSelectedResult(null);
    setHasSearched(false);
  }

  /* ======================================================================= */
  /* QUERY CHANGE                                                            */
  /* ======================================================================= */

  function handleQueryChange(value: string) {
    setQuery(value);
    setError(null);

    if (hasSearched) {
      setResults([]);
      setSelectedResult(null);
      setHasSearched(false);
    }
  }

  /* ======================================================================= */
  /* AUTH LOADING                                                            */
  /* ======================================================================= */

  if (authLoading) {
    return (
      <div className="mx-auto max-w-7xl">
        <div
          className="
            rounded-3xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
            p-10
          "
        >
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 rounded bg-[var(--surface-muted)]" />

            <div className="h-10 w-72 rounded bg-[var(--surface-muted)]" />

            <div className="h-4 w-full max-w-xl rounded bg-[var(--surface-muted)]" />
          </div>
        </div>
      </div>
    );
  }

  /* ======================================================================= */
  /* PAGE                                                                    */
  /* ======================================================================= */

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* =================================================================== */}
      {/* HERO                                                                */}
      {/* =================================================================== */}

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
            pointer-events-none
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

          <p
            className="
              mt-5
              max-w-3xl
              text-sm
              leading-6
              text-[var(--foreground-muted)]
            "
          >
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

      {/* =================================================================== */}
      {/* SEARCH PANEL                                                        */}
      {/* =================================================================== */}

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
        <p
          className="
            font-mono
            text-[10px]
            uppercase
            tracking-[0.2em]
            text-[var(--primary)]
          "
        >
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
              className="
                mb-2
                block
                text-sm
                font-medium
                text-[var(--foreground-secondary)]
              "
            >
              Tenant
            </label>

            <select
              id="tenant"
              value={tenantId}
              onChange={(event) => handleTenantChange(event.target.value)}
              disabled={tenantsLoading}
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
                disabled:cursor-not-allowed
                disabled:opacity-60
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

            <p
              className="
                mt-2
                text-xs
                text-[var(--foreground-subtle)]
              "
            >
              {isSuperAdmin
                ? "Super admins can search globally or select a specific tenant."
                : "Tenant selection is required for tenant-scoped search."}
            </p>
          </div>

          {/* QUESTION */}

          <div>
            <label
              htmlFor="query"
              className="
                mb-2
                block
                text-sm
                font-medium
                text-[var(--foreground-secondary)]
              "
            >
              Question
            </label>

            <div className="relative">
              <Search
                className="
                  pointer-events-none
                  absolute
                  left-4
                  top-1/2
                  h-5
                  w-5
                  -translate-y-1/2
                  text-[var(--foreground-subtle)]
                "
              />

              <input
                ref={queryInputRef}
                id="query"
                value={query}
                onChange={(event) => handleQueryChange(event.target.value)}
                placeholder="e.g. Who can add members to a tenant?"
                autoComplete="off"
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
            <div
              role="alert"
              className="
                rounded-xl
                border
                border-[var(--danger)]
                bg-[var(--danger-soft)]
                px-4
                py-3
                text-sm
                text-[var(--danger)]
              "
            >
              {error}
            </div>
          )}

          {/* SEARCH BUTTON */}

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
                <span
                  className="
                    h-4
                    w-4
                    animate-spin
                    rounded-full
                    border-2
                    border-white/40
                    border-t-white
                  "
                />
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

      {/* =================================================================== */}
      {/* RESULTS                                                             */}
      {/* =================================================================== */}

      {results.length > 0 && (
        <section ref={resultsRef} className="scroll-mt-24 space-y-4">
          <div
            className="
              flex
              flex-col
              gap-4
              sm:flex-row
              sm:items-end
              sm:justify-between
            "
          >
            <div>
              <div className="flex items-center gap-2">
                <Sparkles
                  className="
                    h-4
                    w-4
                    text-[var(--primary)]
                  "
                />

                <p
                  className="
                    font-mono
                    text-[10px]
                    uppercase
                    tracking-[0.2em]
                    text-[var(--primary)]
                  "
                >
                  AI Retrieval
                </p>
              </div>

              <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                Knowledge matches
              </h2>

              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                Ranked by semantic similarity and keyword relevance.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className="
                  rounded-full
                  border
                  border-[var(--border)]
                  bg-[var(--surface)]
                  px-3
                  py-1.5
                  font-mono
                  text-xs
                  text-[var(--foreground-muted)]
                "
              >
                {results.length} {results.length === 1 ? "match" : "matches"}
              </span>

              <span
                className="
                  rounded-full
                  bg-[var(--primary-soft)]
                  px-3
                  py-1.5
                  font-mono
                  text-xs
                  text-[var(--primary)]
                "
              >
                {tenantId ? "Tenant scoped" : "Global"}
              </span>
            </div>
          </div>

          <div
            className="
              overflow-hidden
              rounded-3xl
              border
              border-[var(--border)]
              bg-[var(--surface)]
              shadow-[var(--shadow-sm)]
            "
          >
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

      {/* =================================================================== */}
      {/* INITIAL EMPTY STATE                                                 */}
      {/* =================================================================== */}

      {!searching && !hasSearched && results.length === 0 && !error && (
        <AiSearchEmptyState
          type="initial"
          onExampleClick={(example) => {
            setQuery(example);
            void executeSearch(example);
          }}
        />
      )}

      {/* =================================================================== */}
      {/* NO RESULTS                                                          */}
      {/* =================================================================== */}

      {!searching && hasSearched && results.length === 0 && !error && (
        <AiSearchEmptyState
          type="no-results"
          query={query}
          tenantName={
            tenantId
              ? tenants.find((tenant) => tenant.id === tenantId)?.name
              : undefined
          }
          onExampleClick={(example) => {
            setQuery(example);
            void executeSearch(example);
          }}
          onNewSearch={handleNewSearch}
        />
      )}

      {/* =================================================================== */}
      {/* DETAIL MODAL                                                        */}
      {/* =================================================================== */}

      {selectedResult && (
        <AiSearchDetailModal
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

        <div className="min-w-0 flex-1">
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
              <span
                className="
                  font-mono
                  text-[10px]
                  text-[var(--foreground-subtle)]
                "
              >
                @{data.tenantSlug}
              </span>
            )}
          </div>

          <h3
            className="
              mt-2
              truncate
              text-base
              font-semibold
              text-[var(--foreground)]
            "
          >
            {title}
          </h3>

          <p
            className="
              mt-1
              truncate
              text-sm
              text-[var(--foreground-muted)]
            "
          >
            {subtitle}
          </p>

          {description && (
            <p
              className="
                mt-2
                line-clamp-2
                text-xs
                leading-5
                text-[var(--foreground-subtle)]
              "
            >
              {description}
            </p>
          )}

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

        <div className="hidden w-32 shrink-0 md:block">
          <div className="text-right">
            <p
              className="
                font-mono
                text-[9px]
                uppercase
                tracking-widest
                text-[var(--foreground-subtle)]
              "
            >
              Relevance
            </p>

            <p className="mt-1 text-sm font-semibold">{hybrid.toFixed(1)}%</p>
          </div>

          <div
            className="
              mt-2
              h-1.5
              overflow-hidden
              rounded-full
              bg-[var(--surface-muted)]
            "
          >
            <div
              className="
                h-full
                rounded-full
                bg-[var(--primary)]
                transition-all
              "
              style={{
                width: `${hybrid}%`,
              }}
            />
          </div>

          <div
            className="
              mt-2
              flex
              justify-end
              gap-2
              font-mono
              text-[8px]
              text-[var(--foreground-subtle)]
            "
          >
            <span>S {percentage(result.semanticScore).toFixed(0)}</span>

            <span>K {percentage(result.keywordScore).toFixed(0)}</span>
          </div>
        </div>

        <div className="pt-1">
          <ChevronDown
            className="
              h-4
              w-4
              -rotate-90
              text-[var(--foreground-subtle)]
              transition
              group-hover:translate-x-0.5
              group-hover:text-[var(--primary)]
            "
          />
        </div>
      </div>
    </button>
  );
}

/* ========================================================================= */
/* FEATURE BADGE                                                             */
/* ========================================================================= */

function FeatureBadge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span
      className="
        inline-flex
        items-center
        gap-2
        rounded-full
        border
        border-[var(--border)]
        bg-[var(--surface-muted)]
        px-3
        py-1.5
        text-xs
        text-[var(--foreground-muted)]
      "
    >
      <span className="text-[var(--primary)]">{icon}</span>

      {label}
    </span>
  );
}

/* ========================================================================= */
/* EMPTY STATE                                                               */
/* ========================================================================= */

function AiSearchEmptyState({
  type,
  query,
  tenantName,
  onExampleClick,
  onNewSearch,
}: {
  type: "initial" | "no-results";
  query?: string;
  tenantName?: string;
  onExampleClick: (query: string) => void;
  onNewSearch?: () => void;
}) {
  const isNoResults = type === "no-results";

  const examples = [
    "Who can read the tenant?",
    "Who can add members to a tenant?",
    "Which role can update the tenant?",
  ];

  return (
    <section
      className="
        relative
        overflow-hidden
        rounded-3xl
        border
        border-dashed
        border-[var(--border)]
        bg-[var(--surface-muted)]
        p-8
        sm:p-10
      "
    >
      <div
        className="
          pointer-events-none
          absolute
          -right-20
          -top-20
          h-56
          w-56
          rounded-full
          bg-[var(--primary)]
          opacity-[0.05]
          blur-3xl
        "
      />

      <div className="relative text-center">
        <div
          className="
            mx-auto
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-2xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
            text-[var(--primary)]
            shadow-sm
          "
        >
          {isNoResults ? (
            <Search className="h-7 w-7" />
          ) : (
            <BrainCircuit className="h-7 w-7" />
          )}
        </div>

        <h3 className="mt-5 text-xl font-semibold tracking-tight">
          {isNoResults ? "No knowledge found" : "Ask your first question"}
        </h3>

        {isNoResults ? (
          <>
            <p
              className="
                mx-auto
                mt-2
                max-w-2xl
                text-sm
                leading-6
                text-[var(--foreground-muted)]
              "
            >
              We couldn&apos;t find any indexed knowledge matching:
            </p>

            <div
              className="
                mx-auto
                mt-4
                max-w-2xl
                rounded-xl
                border
                border-[var(--border)]
                bg-[var(--surface)]
                px-4
                py-3
                text-left
              "
            >
              <div className="flex items-start gap-3">
                <Search
                  className="
                    mt-0.5
                    h-4
                    w-4
                    shrink-0
                    text-[var(--primary)]
                  "
                />

                <p className="text-sm font-medium">&quot;{query}&quot;</p>
              </div>
            </div>

            {tenantName && (
              <p
                className="
                  mt-3
                  text-xs
                  text-[var(--foreground-subtle)]
                "
              >
                Search scope:{" "}
                <span className="font-medium text-[var(--foreground-muted)]">
                  {tenantName}
                </span>
              </p>
            )}

            <p
              className="
                mx-auto
                mt-5
                max-w-xl
                text-sm
                leading-6
                text-[var(--foreground-muted)]
              "
            >
              Try using different wording, a broader question, or search for
              another role, permission, tenant, or platform capability.
            </p>
          </>
        ) : (
          <p
            className="
              mx-auto
              mt-2
              max-w-lg
              text-sm
              leading-6
              text-[var(--foreground-muted)]
            "
          >
            Ask a natural-language question about tenants, roles, permissions,
            or indexed platform knowledge.
          </p>
        )}

        <div className="mt-7">
          <p
            className="
              font-mono
              text-[9px]
              uppercase
              tracking-[0.18em]
              text-[var(--foreground-subtle)]
            "
          >
            {isNoResults ? "Try one of these" : "Example questions"}
          </p>

          <div
            className="
              mx-auto
              mt-3
              flex
              max-w-3xl
              flex-wrap
              justify-center
              gap-2
            "
          >
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => onExampleClick(example)}
                className="
                  rounded-xl
                  border
                  border-[var(--border)]
                  bg-[var(--surface)]
                  px-3
                  py-2
                  text-xs
                  text-[var(--foreground-muted)]
                  transition
                  hover:border-[var(--primary)]
                  hover:bg-[var(--primary-soft)]
                  hover:text-[var(--primary)]
                  active:scale-[0.98]
                "
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {isNoResults && (
          <button
            type="button"
            onClick={onNewSearch}
            className="
              mt-6
              inline-flex
              items-center
              gap-2
              rounded-xl
              border
              border-[var(--border)]
              bg-[var(--surface)]
              px-4
              py-2.5
              text-sm
              font-medium
              text-[var(--foreground-secondary)]
              transition
              hover:bg-[var(--surface-muted)]
              hover:text-[var(--foreground)]
              active:scale-[0.98]
            "
          >
            <Search className="h-4 w-4" />
            Start a new search
          </button>
        )}
      </div>
    </section>
  );
}

/* ========================================================================= */
/* TYPE GUARDS                                                               */
/* ========================================================================= */

function isRoleData(
  data: AiSearchStructuredData | null | undefined
): data is Extract<AiSearchStructuredData, { type: "ROLE" }> {
  return data?.type === "ROLE";
}

function isTenantData(
  data: AiSearchStructuredData | null | undefined
): data is Extract<AiSearchStructuredData, { type: "TENANT" }> {
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
    return data.description?.trim() ?? "";
  }

  if (isTenantData(data)) {
    return data.description?.trim() ?? "";
  }

  return "";
}

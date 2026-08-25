"use client";

import {
  X,
  Shield,
  Building2,
  KeyRound,
  CheckCircle2,
  Activity,
} from "lucide-react";

import type {
  AiSearchResult,
  AiSearchRoleData,
  AiSearchTenantData,
} from "@/lib/ai-search-api";

export function AiSearchDetailModal({
  result,
  onClose,
}: {
  result: AiSearchResult;
  onClose: () => void;
}) {
  const data = result.data ?? {};

  const isRole = result.sourceType === "ROLE";
  const isTenant = result.sourceType === "TENANT";

  const role = isRole ? (data as AiSearchRoleData) : null;

  const tenant = isTenant ? (data as AiSearchTenantData) : null;

  const title = role?.roleName ?? tenant?.tenantName ?? result.sourceType;

  const subtitle =
    role?.tenantName ?? tenant?.tenantSlug ?? "Platform knowledge";

  const semantic = result.semanticScore * 100;
  const keyword = result.keywordScore * 100;
  const hybrid = result.hybridScore * 100;

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

        <div
          className="
            flex
            items-start
            justify-between
            border-b
            border-[var(--border)]
            px-6
            py-5
          "
        >
          <div className="flex items-center gap-4">
            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-[var(--primary-soft)]
                text-[var(--primary)]
              "
            >
              {isRole ? (
                <Shield className="h-5 w-5" />
              ) : (
                <Building2 className="h-5 w-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span
                  className="
                    font-mono
                    text-[9px]
                    uppercase
                    tracking-[0.18em]
                    text-[var(--primary)]
                  "
                >
                  {result.sourceType}
                </span>
              </div>

              <h2 className="mt-1 text-xl font-semibold">{title}</h2>

              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                {subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              rounded-xl
              p-2
              text-[var(--foreground-muted)]
              transition
              hover:bg-[var(--surface-muted)]
              hover:text-[var(--foreground)]
            "
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* BODY */}

        <div className="overflow-y-auto p-6">
          {isRole && role && <RoleDetails role={role} />}

          {isTenant && tenant && <TenantDetails tenant={tenant} />}

          {!isRole && !isTenant && <GenericDetails result={result} />}

          {/* RETRIEVAL */}

          <section className="mt-8">
            <SectionTitle
              icon={<Activity className="h-4 w-4" />}
              title="Retrieval"
            />

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <Score label="Semantic" value={semantic} />

              <Score label="Keyword" value={keyword} />

              <Score label="Hybrid" value={hybrid} primary />
            </div>
          </section>

          {/* TECHNICAL */}

          <details className="mt-8">
            <summary
              className="
                cursor-pointer
                text-sm
                font-medium
                text-[var(--foreground-muted)]
              "
            >
              Technical details
            </summary>

            <div className="mt-4 space-y-3">
              <TechnicalRow label="Document" value={result.documentId} />

              <TechnicalRow label="Source" value={result.sourceId} />

              <TechnicalRow label="Chunk" value={String(result.chunkIndex)} />

              <div
                className="
                  rounded-xl
                  border
                  border-[var(--border)]
                  bg-[var(--surface-muted)]
                  p-4
                "
              >
                <p
                  className="
                    font-mono
                    text-[9px]
                    uppercase
                    tracking-widest
                    text-[var(--foreground-subtle)]
                  "
                >
                  Indexed content
                </p>

                <p className="mt-3 whitespace-pre-wrap text-xs leading-6 text-[var(--foreground-muted)]">
                  {result.content}
                </p>
              </div>
            </div>
          </details>
        </div>

        {/* FOOTER */}

        <div
          className="
            flex
            justify-end
            border-t
            border-[var(--border)]
            px-6
            py-4
          "
        >
          <button
            type="button"
            onClick={onClose}
            className="
              rounded-xl
              border
              border-[var(--border)]
              px-4
              py-2
              text-sm
              font-medium
              transition
              hover:bg-[var(--surface-muted)]
            "
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/* ROLE                                                                       */
/* ========================================================================== */

function RoleDetails({ role }: { role: AiSearchRoleData }) {
  return (
    <div className="space-y-7">
      <section>
        <SectionTitle
          icon={<Shield className="h-4 w-4" />}
          title="Role information"
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Info label="Name" value={role.roleName} />
          <Info label="Slug" value={role.roleSlug} />
          <Info label="Scope" value={role.roleScope} />
          <Info label="Tenant" value={role.tenantName} />
        </div>
      </section>

      <section>
        <SectionTitle
          icon={<KeyRound className="h-4 w-4" />}
          title="Description"
        />

        <div
          className="
            mt-4
            rounded-xl
            border
            border-[var(--border)]
            bg-[var(--surface-muted)]
            p-4
            text-sm
            leading-6
            text-[var(--foreground-secondary)]
          "
        >
          {role.description || "No description available."}
        </div>
      </section>

      <TagSection title="Permissions" values={role.permissions ?? []} />

      <TagSection title="Capabilities" values={role.capabilities ?? []} check />
    </div>
  );
}

/* ========================================================================== */
/* TENANT                                                                     */
/* ========================================================================== */

function TenantDetails({ tenant }: { tenant: AiSearchTenantData }) {
  return (
    <section>
      <SectionTitle
        icon={<Building2 className="h-4 w-4" />}
        title="Tenant information"
      />

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Info label="Name" value={tenant.tenantName} />
        <Info label="Slug" value={tenant.tenantSlug} />
        <Info label="Legal name" value={tenant.legalName} />
        <Info label="Email" value={tenant.contactEmail} />
        <Info label="Phone" value={tenant.contactPhone} />
        <Info label="Website" value={tenant.websiteUrl} />
        <Info label="Country" value={tenant.country} />
        <Info label="State" value={tenant.state} />
        <Info label="City" value={tenant.city} />
        <Info label="Timezone" value={tenant.timezone} />
      </div>

      <div className="mt-4">
        <Info label="Description" value={tenant.description} />
      </div>
    </section>
  );
}

/* ========================================================================== */
/* GENERIC                                                                    */
/* ========================================================================== */

function GenericDetails({ result }: { result: AiSearchResult }) {
  return (
    <section>
      <SectionTitle icon={<Activity className="h-4 w-4" />} title="Knowledge" />

      <div
        className="
          mt-4
          rounded-xl
          border
          border-[var(--border)]
          bg-[var(--surface-muted)]
          p-5
          text-sm
          leading-7
        "
      >
        {result.content}
      </div>
    </section>
  );
}

/* ========================================================================== */
/* SMALL COMPONENTS                                                           */
/* ========================================================================== */

function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--primary)]">{icon}</span>

      <h3 className="text-sm font-semibold">{title}</h3>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div
      className="
        rounded-xl
        border
        border-[var(--border)]
        bg-[var(--surface-muted)]
        px-4
        py-3
      "
    >
      <p
        className="
          font-mono
          text-[9px]
          uppercase
          tracking-widest
          text-[var(--foreground-subtle)]
        "
      >
        {label}
      </p>

      <p className="mt-1 text-sm font-medium">{value || "—"}</p>
    </div>
  );
}

function TagSection({
  title,
  values,
  check = false,
}: {
  title: string;
  values: string[];
  check?: boolean;
}) {
  return (
    <section>
      <h3 className="text-sm font-semibold">{title}</h3>

      {values.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--foreground-muted)]">None</p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                border
                border-[var(--border)]
                bg-[var(--surface-muted)]
                px-3
                py-2
                text-xs
              "
            >
              {check && (
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--success)]" />
              )}

              {value}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

function Score({
  label,
  value,
  primary = false,
}: {
  label: string;
  value: number;
  primary?: boolean;
}) {
  return (
    <div
      className={`
        rounded-xl
        border
        border-[var(--border)]
        px-4
        py-4
        ${primary ? "bg-[var(--primary-soft)]" : "bg-[var(--surface-muted)]"}
      `}
    >
      <p
        className="
          font-mono
          text-[9px]
          uppercase
          tracking-widest
          text-[var(--foreground-subtle)]
        "
      >
        {label}
      </p>

      <p
        className={`
          mt-2
          text-lg
          font-semibold
          ${primary ? "text-[var(--primary)]" : ""}
        `}
      >
        {value.toFixed(2)}%
      </p>
    </div>
  );
}

function TechnicalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-[var(--foreground-muted)]">{label}</span>

      <span className="truncate font-mono text-[10px]" title={value}>
        {value}
      </span>
    </div>
  );
}

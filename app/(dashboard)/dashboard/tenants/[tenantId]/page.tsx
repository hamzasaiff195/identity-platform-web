"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/providers/auth-provider";

import {
  addTenantMember,
  getTenant,
  getTenantMembers,
  removeTenantMember,
  updateTenant,
  type Pagination,
  type Tenant,
  type TenantMember,
  type UpdateTenantInput,
} from "@/lib/tenants-api";

import { TenantMemberActions } from "../components/tenant-member-actions";

const DEFAULT_PAGE_SIZE = 10;

const DEFAULT_PAGINATION: Pagination = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

export default function TenantPage() {
  const params = useParams<{ tenantId: string }>();

  const tenantId = params?.tenantId;

  const { accessToken } = useAuth();

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [members, setMembers] = useState<TenantMember[]>([]);

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);

  const [error, setError] = useState("");

  const [pagination, setPagination] = useState<Pagination>(DEFAULT_PAGINATION);

  const [selectedMember, setSelectedMember] = useState<TenantMember | null>(
    null
  );

  const [memberModal, setMemberModal] = useState<"view" | "remove" | null>(
    null
  );

  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditTenantModal, setShowEditTenantModal] = useState(false);

  // ---------------------------------------------------------------------------
  // Load tenant
  // ---------------------------------------------------------------------------

  const loadTenant = useCallback(async () => {
    if (!accessToken || !tenantId || tenantId === "new") {
      return;
    }

    try {
      setError("");

      const result = await getTenant(accessToken, tenantId);

      setTenant(result);
    } catch (error) {
      console.error("[TENANT] Failed to load tenant:", error);

      setError(
        error instanceof Error ? error.message : "Unable to load tenant"
      );
    }
  }, [accessToken, tenantId]);

  // ---------------------------------------------------------------------------
  // Load members
  // ---------------------------------------------------------------------------

  const loadMembers = useCallback(
    async (pageValue = 1, searchValue = "") => {
      if (!accessToken || !tenantId || tenantId === "new") {
        return;
      }

      try {
        setMembersLoading(true);
        setError("");

        const result = await getTenantMembers(
          accessToken,
          tenantId,
          pageValue,
          DEFAULT_PAGE_SIZE,
          searchValue
        );

        setMembers(result.members);
        setPagination(result.pagination);
      } catch (error) {
        console.error("[TENANT] Failed to load members:", error);

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load tenant members"
        );
      } finally {
        setMembersLoading(false);
      }
    },
    [accessToken, tenantId]
  );

  // ---------------------------------------------------------------------------
  // Initial load
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!accessToken || !tenantId || tenantId === "new") {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        await Promise.all([loadTenant(), loadMembers(1, "")]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [accessToken, tenantId, loadTenant, loadMembers]);

  // ---------------------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------------------

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    void loadMembers(1, search.trim());
  }

  // ---------------------------------------------------------------------------
  // Pagination
  // ---------------------------------------------------------------------------

  function handlePreviousPage() {
    if (!pagination.hasPreviousPage || membersLoading) {
      return;
    }

    void loadMembers(pagination.page - 1, search.trim());
  }

  function handleNextPage() {
    if (!pagination.hasNextPage || membersLoading) {
      return;
    }

    void loadMembers(pagination.page + 1, search.trim());
  }

  // ---------------------------------------------------------------------------
  // Refresh
  // ---------------------------------------------------------------------------

  async function handleRefresh() {
    if (!tenantId || !accessToken) {
      return;
    }

    await Promise.all([
      loadTenant(),
      loadMembers(pagination.page, search.trim()),
    ]);
  }

  // ---------------------------------------------------------------------------
  // View member
  // ---------------------------------------------------------------------------

  function handleViewMember(member: TenantMember) {
    setSelectedMember(member);
    setMemberModal("view");
  }

  // ---------------------------------------------------------------------------
  // Remove member
  // ---------------------------------------------------------------------------

  function handleRemoveMember(member: TenantMember) {
    setSelectedMember(member);
    setMemberModal("remove");
  }

  async function confirmRemoveMember() {
    if (!accessToken || !tenantId || !selectedMember) {
      return;
    }

    try {
      setError("");

      await removeTenantMember(accessToken, tenantId, selectedMember.userId);

      closeMemberModal();

      const shouldGoToPreviousPage =
        members.length === 1 && pagination.hasPreviousPage;

      await loadMembers(
        shouldGoToPreviousPage ? pagination.page - 1 : pagination.page,
        search.trim()
      );
    } catch (error) {
      console.error("[TENANT] Failed to remove member:", error);

      const message =
        error instanceof Error ? error.message : "Unable to remove member";

      setError(message);

      throw new Error(message);
    }
  }

  // ---------------------------------------------------------------------------
  // Add member
  // ---------------------------------------------------------------------------

  async function handleAddMember(userId: string) {
    if (!accessToken || !tenantId) {
      throw new Error("Authentication required");
    }

    try {
      setError("");

      await addTenantMember(accessToken, tenantId, userId);

      setShowAddMemberModal(false);

      // Return to first page after adding a member.
      await loadMembers(1, search.trim());
    } catch (error) {
      console.error("[TENANT] Failed to add member:", error);

      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Update tenant
  // ---------------------------------------------------------------------------

  async function handleUpdateTenant(data: UpdateTenantInput) {
    if (!accessToken || !tenantId) {
      throw new Error("Authentication required");
    }

    try {
      setError("");

      const updatedTenant = await updateTenant(accessToken, tenantId, data);

      setTenant(updatedTenant);
      setShowEditTenantModal(false);

      // Reload from server so the UI reflects the
      // canonical backend representation.
      await loadTenant();
    } catch (error) {
      console.error("[TENANT] Failed to update tenant:", error);

      const message =
        error instanceof Error ? error.message : "Unable to update tenant";

      setError(message);

      throw new Error(message);
    }
  }

  // ---------------------------------------------------------------------------
  // Close member modal
  // ---------------------------------------------------------------------------

  function closeMemberModal() {
    setSelectedMember(null);
    setMemberModal(null);
  }

  // ---------------------------------------------------------------------------
  // Statistics
  // ---------------------------------------------------------------------------

  const memberStats = useMemo(() => {
    const active = members.filter(
      (member) => member.user.status === "ACTIVE"
    ).length;

    const inactive = members.filter(
      (member) => member.user.status === "INACTIVE"
    ).length;

    const suspended = members.filter(
      (member) => member.user.status === "SUSPENDED"
    ).length;

    const verified = members.filter(
      (member) => member.user.isEmailVerified
    ).length;

    return {
      active,
      inactive,
      suspended,
      verified,
    };
  }, [members]);

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-full bg-[var(--background)] p-6 lg:p-8">
        <div className="flex min-h-[500px] items-center justify-center">
          <div className="text-center">
            <div
              className="
                mx-auto
                h-8
                w-8
                animate-spin
                rounded-full
                border-2
                border-[var(--border)]
                border-t-[var(--primary)]
              "
            />

            <p className="mt-4 text-sm text-[var(--foreground-muted)]">
              Loading tenant...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Tenant not found
  // ---------------------------------------------------------------------------

  if (!tenant) {
    return (
      <main className="min-h-full bg-[var(--background)] p-6 lg:p-8">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/dashboard/tenants"
            className="
              inline-flex
              items-center
              gap-2
              text-sm
              font-medium
              text-[var(--foreground-muted)]
              hover:text-[var(--foreground)]
            "
          >
            ← Back to Tenants
          </Link>

          <div
            className="
              mt-6
              rounded-xl
              border
              border-[var(--danger)]
              bg-[var(--danger-soft)]
              p-6
            "
          >
            <p className="text-sm font-medium text-[var(--danger)]">
              {error || "Tenant not found."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // ---------------------------------------------------------------------------
  // Page
  // ---------------------------------------------------------------------------

  return (
    <main className="min-h-full bg-[var(--background)] p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px]">
        {/* Breadcrumb */}

        <Link
          href="/dashboard/tenants"
          className="
            inline-flex
            items-center
            gap-2
            text-sm
            font-medium
            text-[var(--foreground-muted)]
            transition
            hover:text-[var(--foreground)]
          "
        >
          ← Back to Tenants
        </Link>

        {/* Header */}

        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div
              className="
                flex
                h-14
                w-14
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-[var(--primary)]
                text-xl
                font-bold
                text-white
                shadow-sm
              "
            >
              {tenant.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold text-[var(--foreground)]">
                  {tenant.name}
                </h1>

                <TenantStatusBadge active={tenant.isActive} />
              </div>

              <p className="mt-1 font-mono text-sm text-[var(--foreground-muted)]">
                {tenant.slug}
              </p>

              {tenant.description && (
                <p className="mt-2 max-w-2xl text-sm text-[var(--foreground-muted)]">
                  {tenant.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowEditTenantModal(true)}
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                border
                border-[var(--border)]
                bg-[var(--surface)]
                px-4
                py-2.5
                text-sm
                font-medium
                text-[var(--foreground)]
                transition
                hover:bg-[var(--background)]
              "
            >
              Edit Tenant
            </button>

            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={membersLoading}
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                border
                border-[var(--border)]
                bg-[var(--surface)]
                px-4
                py-2.5
                text-sm
                font-medium
                text-[var(--foreground)]
                transition
                hover:bg-[var(--background)]
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              ↻ Refresh
            </button>

            <button
              type="button"
              onClick={() => setShowAddMemberModal(true)}
              className="
                inline-flex
                items-center
                gap-2
                rounded-lg
                bg-[var(--primary)]
                px-4
                py-2.5
                text-sm
                font-medium
                text-white
                transition
                hover:opacity-90
              "
            >
              + Add Member
            </button>
          </div>
        </div>

        {/* Error */}

        {error && (
          <div
            className="
              mt-6
              rounded-lg
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

        {/* Stats */}

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Members"
            value={pagination.total}
            description="All members in this tenant"
          />

          <StatCard
            label="Active"
            value={memberStats.active}
            description="Active users on this page"
          />

          <StatCard
            label="Verified"
            value={memberStats.verified}
            description="Email verified on this page"
          />

          <StatCard
            label="Suspended"
            value={memberStats.suspended}
            description="Suspended users on this page"
          />
        </section>

        {/* Tenant Information */}

        <section
          className="
            mt-6
            rounded-xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
            shadow-[var(--shadow-sm)]
          "
        >
          <div className="border-b border-[var(--border)] px-6 py-4">
            <h2 className="text-base font-semibold text-[var(--foreground)]">
              Tenant Information
            </h2>

            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Basic information and contact details.
            </p>
          </div>

          <div className="grid gap-5 px-6 py-6 sm:grid-cols-2 xl:grid-cols-4">
            <InfoItem label="Tenant ID" value={tenant.id} />

            <InfoItem label="Slug" value={tenant.slug} />

            <InfoItem label="Legal Name" value={tenant.legalName} />

            <InfoItem label="Contact Email" value={tenant.contactEmail} />

            <InfoItem label="Phone" value={tenant.contactPhone} />

            <InfoItem label="Website" value={tenant.websiteUrl} />

            <InfoItem label="Location" value={formatLocation(tenant)} />

            <InfoItem label="Timezone" value={tenant.timezone} />

            <InfoItem
              label="Created"
              value={formatDateTime(tenant.createdAt)}
            />

            <InfoItem
              label="Last Updated"
              value={formatDateTime(tenant.updatedAt)}
            />
          </div>
        </section>

        {/* Members */}

        <section
          className="
            mt-6
            flex
            min-h-[520px]
            flex-col
            overflow-hidden
            rounded-xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
            shadow-[var(--shadow-sm)]
          "
        >
          {/* Members header */}

          <div className="shrink-0 border-b border-[var(--border)] px-6 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-base font-semibold text-[var(--foreground)]">
                  Members
                </h2>

                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  Manage users belonging to this tenant.
                </p>
              </div>

              <form
                onSubmit={handleSearchSubmit}
                className="flex w-full gap-2 lg:max-w-md"
              >
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search members by email..."
                  className="
                    h-10
                    w-full
                    rounded-lg
                    border
                    border-[var(--border)]
                    bg-[var(--surface)]
                    px-3
                    text-sm
                    text-[var(--foreground)]
                    outline-none
                    placeholder:text-[var(--foreground-muted)]
                    focus:border-[var(--primary)]
                    focus:ring-2
                    focus:ring-[var(--primary)]/10
                  "
                />

                <button
                  type="submit"
                  disabled={membersLoading}
                  className="
                    h-10
                    rounded-lg
                    border
                    border-[var(--border)]
                    bg-[var(--surface)]
                    px-4
                    text-sm
                    font-medium
                    text-[var(--foreground)]
                    hover:bg-[var(--background)]
                    disabled:opacity-50
                  "
                >
                  Search
                </button>
              </form>
            </div>
          </div>

          {/* Members table */}

          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[900px]">
              <thead className="sticky top-0 z-10 bg-[var(--surface)]">
                <tr className="border-b border-[var(--border)]">
                  <TableHeader>Member</TableHeader>

                  <TableHeader>Account Status</TableHeader>

                  <TableHeader>Email Verification</TableHeader>

                  <TableHeader>Joined</TableHeader>

                  <th
                    className="
                      px-6
                      py-4
                      text-right
                      text-xs
                      font-semibold
                      uppercase
                      tracking-wide
                      text-[var(--foreground-muted)]
                    "
                  >
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {members.map((member) => (
                  <TenantMemberRow
                    key={member.id}
                    member={member}
                    onView={handleViewMember}
                    onRemove={handleRemoveMember}
                  />
                ))}
              </tbody>
            </table>

            {members.length === 0 && (
              <div className="px-6 py-16 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--background)] text-xl text-[var(--foreground-muted)]">
                  👥
                </div>

                <p className="mt-4 text-sm font-medium text-[var(--foreground)]">
                  No members found
                </p>

                <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                  {search
                    ? "Try adjusting your search."
                    : "Add your first member to this tenant."}
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}

          {pagination.total > 0 && (
            <div className="shrink-0 border-t border-[var(--border)] px-6 py-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-[var(--foreground-muted)]">
                  Showing{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {(pagination.page - 1) * pagination.limit + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-[var(--foreground)]">
                    {pagination.total}
                  </span>{" "}
                  members
                </p>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePreviousPage}
                    disabled={!pagination.hasPreviousPage || membersLoading}
                    className="
                      rounded-lg
                      border
                      border-[var(--border)]
                      px-3
                      py-2
                      text-sm
                      font-medium
                      disabled:opacity-40
                    "
                  >
                    Previous
                  </button>

                  <span className="min-w-[100px] text-center text-sm text-[var(--foreground-muted)]">
                    Page{" "}
                    <span className="font-medium text-[var(--foreground)]">
                      {pagination.page}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-[var(--foreground)]">
                      {pagination.totalPages}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={handleNextPage}
                    disabled={!pagination.hasNextPage || membersLoading}
                    className="
                      rounded-lg
                      border
                      border-[var(--border)]
                      px-3
                      py-2
                      text-sm
                      font-medium
                      disabled:opacity-40
                    "
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}

          {membersLoading && (
            <div className="shrink-0 border-t border-[var(--border)] px-6 py-2 text-center text-xs text-[var(--foreground-muted)]">
              Loading members...
            </div>
          )}
        </section>
      </div>

      {/* Member View */}

      {selectedMember && memberModal === "view" && (
        <MemberViewDialog member={selectedMember} onClose={closeMemberModal} />
      )}

      {/* Member Remove */}

      {selectedMember && memberModal === "remove" && (
        <MemberRemoveDialog
          member={selectedMember}
          onCancel={closeMemberModal}
          onConfirm={confirmRemoveMember}
        />
      )}

      {/* Add Member */}

      {showAddMemberModal && (
        <AddMemberDialog
          onClose={() => setShowAddMemberModal(false)}
          onAdd={handleAddMember}
        />
      )}

      {/* Edit Tenant */}

      {showEditTenantModal && (
        <EditTenantDialog
          tenant={tenant}
          onClose={() => setShowEditTenantModal(false)}
          onSave={handleUpdateTenant}
        />
      )}
    </main>
  );
}

// -----------------------------------------------------------------------------
// Table Header
// -----------------------------------------------------------------------------

function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="
        px-6
        py-4
        text-left
        text-xs
        font-semibold
        uppercase
        tracking-wide
        text-[var(--foreground-muted)]
      "
    >
      {children}
    </th>
  );
}

// -----------------------------------------------------------------------------
// Tenant Status
// -----------------------------------------------------------------------------

function TenantStatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`
        inline-flex
        items-center
        gap-2
        rounded-full
        px-3
        py-1.5
        text-xs
        font-medium
        ${
          active
            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
        }
      `}
    >
      <span
        className={`
          h-1.5
          w-1.5
          rounded-full
          ${active ? "bg-emerald-500" : "bg-slate-400"}
        `}
      />

      {active ? "ACTIVE" : "INACTIVE"}
    </span>
  );
}

// -----------------------------------------------------------------------------
// Member Row
// -----------------------------------------------------------------------------

function TenantMemberRow({
  member,
  onView,
  onRemove,
}: {
  member: TenantMember;
  onView: (member: TenantMember) => void;
  onRemove: (member: TenantMember) => void;
}) {
  const user = member.user;

  return (
    <tr className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--background)]">
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--background)] text-xs font-semibold text-[var(--foreground-muted)]">
            {user.email.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--foreground)]">
              {user.email}
            </p>

            <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
              Member
            </p>
          </div>
        </div>
      </td>

      <td className="px-6 py-5">
        <AccountStatusBadge status={user.status} />
      </td>

      <td className="px-6 py-5">
        <VerificationBadge verified={user.isEmailVerified} />
      </td>

      <td className="px-6 py-5">
        <span className="text-sm text-[var(--foreground-muted)]">
          {formatDate(member.joinedAt)}
        </span>
      </td>

      <td className="px-6 py-5 text-right">
        <TenantMemberActions
          member={member}
          onView={onView}
          onRemove={onRemove}
        />
      </td>
    </tr>
  );
}

// -----------------------------------------------------------------------------
// Account Status
// -----------------------------------------------------------------------------

function AccountStatusBadge({
  status,
}: {
  status: TenantMember["user"]["status"];
}) {
  const config = {
    ACTIVE: {
      label: "Active",
      className:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
    },

    INACTIVE: {
      label: "Inactive",
      className:
        "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    },

    SUSPENDED: {
      label: "Suspended",
      className:
        "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
    },
  } as const;

  const current = config[status];

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-2
        rounded-full
        px-3
        py-1.5
        text-xs
        font-medium
        ${current.className}
      `}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />

      {current.label}
    </span>
  );
}

// -----------------------------------------------------------------------------
// Verification
// -----------------------------------------------------------------------------

function VerificationBadge({ verified }: { verified: boolean }) {
  return (
    <span
      className={`
        inline-flex
        items-center
        gap-2
        text-sm
        font-medium
        ${
          verified
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-amber-600 dark:text-amber-400"
        }
      `}
    >
      <span
        className={`
          flex
          h-5
          w-5
          items-center
          justify-center
          rounded-full
          text-xs
          font-bold
          ${
            verified
              ? "bg-emerald-100 dark:bg-emerald-950/40"
              : "bg-amber-100 dark:bg-amber-950/40"
          }
        `}
      >
        {verified ? "✓" : "!"}
      </span>

      {verified ? "Verified" : "Pending"}
    </span>
  );
}

// -----------------------------------------------------------------------------
// Stats
// -----------------------------------------------------------------------------

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)]">
      <p className="text-sm text-[var(--foreground-muted)]">{label}</p>

      <p className="mt-2 text-2xl font-semibold text-[var(--foreground)]">
        {value}
      </p>

      <p className="mt-1 text-xs text-[var(--foreground-muted)]">
        {description}
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Info
// -----------------------------------------------------------------------------

function InfoItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--foreground-muted)]">
        {label}
      </p>

      <p className="mt-1 break-all text-sm text-[var(--foreground)]">
        {value || "—"}
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Member View Dialog
// -----------------------------------------------------------------------------

function MemberViewDialog({
  member,
  onClose,
}: {
  member: TenantMember;
  onClose: () => void;
}) {
  const user = member.user;

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="member-view-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h2
              id="member-view-title"
              className="text-lg font-semibold text-[var(--foreground)]"
            >
              Member Details
            </h2>

            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              {user.email}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-[var(--foreground-muted)] hover:bg-[var(--background)]"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 px-6 py-6">
          <InfoItem label="User ID" value={user.id} />

          <InfoItem label="Email" value={user.email} />

          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--foreground-muted)]">
              Account Status
            </span>

            <AccountStatusBadge status={user.status} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--foreground-muted)]">
              Email Verification
            </span>

            <VerificationBadge verified={user.isEmailVerified} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--foreground-muted)]">
              User Verification
            </span>

            <VerificationBadge verified={user.isVerified} />
          </div>

          <InfoItem
            label="Joined Tenant"
            value={formatDateTime(member.joinedAt)}
          />

          <InfoItem
            label="User Created"
            value={user.createdAt ? formatDateTime(user.createdAt) : null}
          />
        </div>

        <div className="flex justify-end border-t border-[var(--border)] px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background)]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Remove Dialog
// -----------------------------------------------------------------------------

function MemberRemoveDialog({
  member,
  onConfirm,
  onCancel,
}: {
  member: TenantMember;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleConfirm() {
    try {
      setLoading(true);
      setError("");

      await onConfirm();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to remove member"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="remove-member-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl">
        <h2
          id="remove-member-title"
          className="text-lg font-semibold text-[var(--foreground)]"
        >
          Remove member
        </h2>

        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          Are you sure you want to remove{" "}
          <span className="font-medium text-[var(--foreground)]">
            {member.user.email}
          </span>{" "}
          from this tenant?
        </p>

        <p className="mt-3 text-sm text-[var(--danger)]">
          The user account will not be deleted. Only their membership in this
          tenant will be removed.
        </p>

        {error && (
          <div className="mt-4 rounded-lg border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => void handleConfirm()}
            className="rounded-lg bg-[var(--danger)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? "Removing..." : "Remove Member"}
          </button>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Add Member Dialog
// -----------------------------------------------------------------------------

function AddMemberDialog({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (userId: string) => Promise<void>;
}) {
  const [userId, setUserId] = useState("");

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedUserId = userId.trim();

    if (!normalizedUserId) {
      setError("User ID is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await onAdd(normalizedUserId);

      setUserId("");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to add member");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-member-title"
    >
      <div className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h2
              id="add-member-title"
              className="text-lg font-semibold text-[var(--foreground)]"
            >
              Add Member
            </h2>

            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Add an existing user to this tenant.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-[var(--foreground-muted)] disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-6">
            {error && (
              <div className="rounded-lg border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="tenant-member-user-id"
                className="mb-2 block text-sm font-medium text-[var(--foreground)]"
              >
                User ID
              </label>

              <input
                id="tenant-member-user-id"
                type="text"
                value={userId}
                onChange={(event) => setUserId(event.target.value)}
                disabled={loading}
                placeholder="Enter existing user ID"
                className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10"
              />

              <p className="mt-2 text-xs text-[var(--foreground-muted)]">
                This adds an existing platform user. It does not create a new
                account.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-[var(--border)] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Edit Tenant Dialog
// -----------------------------------------------------------------------------

function EditTenantDialog({
  tenant,
  onClose,
  onSave,
}: {
  tenant: Tenant;
  onClose: () => void;
  onSave: (input: UpdateTenantInput) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: tenant.name ?? "",
    slug: tenant.slug ?? "",
    description: tenant.description ?? "",
    legalName: tenant.legalName ?? "",
    contactEmail: tenant.contactEmail ?? "",
    contactPhone: tenant.contactPhone ?? "",
    websiteUrl: tenant.websiteUrl ?? "",
    city: tenant.city ?? "",
    state: tenant.state ?? "",
    country: tenant.country ?? "",
    timezone: tenant.timezone ?? "",
  });

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!form.name.trim()) {
      setError("Tenant name is required.");
      return;
    }

    if (!form.slug.trim()) {
      setError("Tenant slug is required.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await onSave({
        name: form.name.trim(),
        slug: form.slug.trim(),

        description: form.description.trim() || undefined,
        legalName: form.legalName.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        contactPhone: form.contactPhone.trim() || undefined,
        websiteUrl: form.websiteUrl.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        country: form.country.trim() || undefined,
        timezone: form.timezone.trim() || undefined,
      });
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Unable to update tenant"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-tenant-title"
    >
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        {/* Header */}

        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <h2
              id="edit-tenant-title"
              className="text-lg font-semibold text-[var(--foreground)]"
            >
              Edit Tenant
            </h2>

            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              Update organization information and contact details.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close dialog"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-lg text-[var(--foreground-muted)] disabled:opacity-50"
          >
            ×
          </button>
        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          className="min-h-0 flex-1 overflow-y-auto"
        >
          <div className="grid gap-5 px-6 py-6 sm:grid-cols-2">
            {error && (
              <div className="sm:col-span-2 rounded-lg border border-[var(--danger)] bg-[var(--danger-soft)] px-4 py-3 text-sm text-[var(--danger)]">
                {error}
              </div>
            )}

            <FormField
              label="Name"
              value={form.name}
              required
              disabled={loading}
              onChange={(value) => updateField("name", value)}
            />

            <FormField
              label="Slug"
              value={form.slug}
              required
              disabled={loading}
              onChange={(value) => updateField("slug", value)}
            />

            <FormField
              label="Legal Name"
              value={form.legalName}
              disabled={loading}
              onChange={(value) => updateField("legalName", value)}
            />

            <FormField
              label="Contact Email"
              type="email"
              value={form.contactEmail}
              disabled={loading}
              onChange={(value) => updateField("contactEmail", value)}
            />

            <FormField
              label="Contact Phone"
              value={form.contactPhone}
              disabled={loading}
              onChange={(value) => updateField("contactPhone", value)}
            />

            <FormField
              label="Website"
              value={form.websiteUrl}
              disabled={loading}
              onChange={(value) => updateField("websiteUrl", value)}
            />

            <FormField
              label="City"
              value={form.city}
              disabled={loading}
              onChange={(value) => updateField("city", value)}
            />

            <FormField
              label="State / Province"
              value={form.state}
              disabled={loading}
              onChange={(value) => updateField("state", value)}
            />

            <FormField
              label="Country"
              value={form.country}
              disabled={loading}
              onChange={(value) => updateField("country", value)}
            />

            <FormField
              label="Timezone"
              value={form.timezone}
              disabled={loading}
              onChange={(value) => updateField("timezone", value)}
            />

            <div className="sm:col-span-2">
              <label
                htmlFor="tenant-description"
                className="mb-2 block text-sm font-medium text-[var(--foreground)]"
              >
                Description
              </label>

              <textarea
                id="tenant-description"
                value={form.description}
                disabled={loading}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                rows={4}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 disabled:opacity-60"
                placeholder="Describe this organization..."
              />
            </div>
          </div>

          {/* Footer */}

          <div className="sticky bottom-0 flex justify-end gap-3 border-t border-[var(--border)] bg-[var(--surface)] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Form Field
// -----------------------------------------------------------------------------

function FormField({
  label,
  value,
  onChange,
  disabled,
  required = false,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
        {label}

        {required && <span className="ml-1 text-[var(--danger)]">*</span>}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-60"
      />
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatLocation(tenant: Tenant) {
  return [tenant.city, tenant.state, tenant.country].filter(Boolean).join(", ");
}

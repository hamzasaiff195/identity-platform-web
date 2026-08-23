"use client";

import { useAuth } from "@/providers/auth-provider";

type DashboardUser = NonNullable<ReturnType<typeof useAuth>["user"]>;

export default function DashboardPage() {
  const { user, loading, isSuperAdmin, isAdmin } = useAuth();

  if (loading) {
    return <DashboardLoading />;
  }

  if (!user) {
    return null;
  }

  /**
   * ROLE PRIORITY
   *
   * SUPER_ADMIN
   *      ↓
   * ADMIN
   *      ↓
   * USER
   *
   * Super admin always wins if the user
   * has multiple system roles.
   */

  if (isSuperAdmin) {
    return <SuperAdminDashboard user={user} />;
  }

  if (isAdmin) {
    return <AdminDashboard user={user} />;
  }

  return <UserDashboard user={user} />;
}

/* =========================================================
   SUPER ADMIN DASHBOARD
   ========================================================= */

function SuperAdminDashboard({ user }: { user: DashboardUser }) {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <DashboardHero
        eyebrow="Platform administration"
        title="Welcome back"
        email={user.email}
        description="Manage the entire Identity Platform, including tenants, roles, permissions, users and security."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Role"
          value="SUPER ADMIN"
          description="Full platform access"
        />

        <StatCard
          title="Account"
          value={user.status}
          description="Current account status"
        />

        <StatCard
          title="Email"
          value={user.isEmailVerified ? "Verified" : "Unverified"}
          description={user.email}
        />

        <StatCard
          title="Session"
          value="Active"
          description="Current authentication"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <DashboardCard
          eyebrow="Platform"
          title="Platform management"
          description="Manage the global Identity Platform."
          items={["Users", "Tenants", "Roles", "Permissions"]}
        />

        <DashboardCard
          eyebrow="Security"
          title="Security & auditing"
          description="Monitor authentication and platform activity."
          items={["Sessions", "Security", "Audit Logs"]}
        />

        <DashboardCard
          eyebrow="Access"
          title="Authorization"
          description="Control system-wide access and permissions."
          items={["System roles", "Permissions", "Tenant access"]}
        />
      </section>
    </div>
  );
}

/* =========================================================
   TENANT ADMIN DASHBOARD
   ========================================================= */

function AdminDashboard({ user }: { user: DashboardUser }) {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <DashboardHero
        eyebrow="Tenant administration"
        title="Welcome back"
        email={user.email}
        description="Manage users, authentication activity and tenant-level access within your organization."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Role"
          value="ADMIN"
          description="Tenant administration"
        />

        <StatCard
          title="Account"
          value={user.status}
          description="Current account status"
        />

        <StatCard
          title="Email"
          value={user.isEmailVerified ? "Verified" : "Unverified"}
          description={user.email}
        />

        <StatCard
          title="Session"
          value="Active"
          description="Current authentication"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <DashboardCard
          eyebrow="Workspace"
          title="Tenant management"
          description="Manage users and authentication activity for your tenant."
          items={["Users", "Sessions", "Security"]}
        />

        <DashboardCard
          eyebrow="Access control"
          title="Tenant authorization"
          description="Manage tenant-level roles and permissions."
          items={["Tenant roles", "Permissions"]}
        />
      </section>
    </div>
  );
}

/* =========================================================
   NORMAL USER DASHBOARD
   ========================================================= */

function UserDashboard({ user }: { user: DashboardUser }) {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <DashboardHero
        eyebrow="Identity"
        title="Welcome back"
        email={user.email}
        description="Manage your identity, authentication sessions and account security."
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Account"
          value={user.status}
          description="Current account status"
        />

        <StatCard
          title="Email"
          value={user.isEmailVerified ? "Verified" : "Unverified"}
          description={user.email}
        />

        <StatCard
          title="Identity"
          value={user.isVerified ? "Verified" : "Pending"}
          description="Identity verification"
        />

        <StatCard
          title="Session"
          value="Active"
          description="Current authentication"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div
          className="
            rounded-3xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
            p-6
            shadow-[var(--shadow-sm)]
            lg:col-span-2
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
            Identity
          </p>

          <h2 className="mt-2 text-xl font-semibold">Account overview</h2>

          <div className="mt-6">
            <InfoRow label="Email" value={user.email} />

            <InfoRow label="Account status" value={user.status} />

            <InfoRow
              label="Email verification"
              value={user.isEmailVerified ? "Verified" : "Not verified"}
            />

            <InfoRow
              label="Identity verification"
              value={user.isVerified ? "Verified" : "Not verified"}
            />
          </div>
        </div>

        <div
          className="
            rounded-3xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
            p-6
            shadow-[var(--shadow-sm)]
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
            Security
          </p>

          <h2 className="mt-2 text-xl font-semibold">Security status</h2>

          <div className="mt-6 space-y-3">
            <SecurityItem
              label="Account active"
              enabled={user.status === "ACTIVE"}
            />

            <SecurityItem
              label="Email verified"
              enabled={user.isEmailVerified}
            />

            <SecurityItem label="Authenticated" enabled />
          </div>
        </div>
      </section>
    </div>
  );
}

/* =========================================================
   HERO
   ========================================================= */

function DashboardHero({
  eyebrow,
  title,
  email,
  description,
}: {
  eyebrow: string;
  title: string;
  email: string;
  description: string;
}) {
  const name = email.split("@")[0]?.split(/[._-]/)[0] ?? "there";

  return (
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
          opacity-[0.07]
          blur-3xl
        "
      />

      <div className="relative">
        <p
          className="
            font-mono
            text-[10px]
            uppercase
            tracking-[0.2em]
            text-[var(--primary)]
          "
        >
          {eyebrow}
        </p>

        <div
          className="
            mb-5
            mt-5
            inline-flex
            items-center
            gap-2
            rounded-full
            border
            border-[var(--success)]
            bg-[var(--success-soft)]
            px-3
            py-1.5
          "
        >
          <span
            className="
              h-1.5
              w-1.5
              rounded-full
              bg-[var(--success)]
            "
          />

          <span
            className="
              font-mono
              text-[10px]
              uppercase
              tracking-widest
              text-[var(--success)]
            "
          >
            System operational
          </span>
        </div>

        <h1
          className="
            text-3xl
            font-semibold
            tracking-tight
            sm:text-4xl
          "
        >
          {title}, <span className="text-[var(--primary)]">{name}</span>
        </h1>

        <p
          className="
            mt-3
            max-w-2xl
            text-sm
            leading-6
            text-[var(--foreground-muted)]
          "
        >
          {description}
        </p>
      </div>
    </section>
  );
}

/* =========================================================
   STAT CARD
   ========================================================= */

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-[var(--border)]
        bg-[var(--surface)]
        p-5
        shadow-[var(--shadow-sm)]
        transition
        hover:-translate-y-0.5
        hover:border-[var(--primary)]
        hover:shadow-[var(--shadow-md)]
      "
    >
      <p
        className="
          font-mono
          text-[10px]
          uppercase
          tracking-widest
          text-[var(--foreground-subtle)]
        "
      >
        {title}
      </p>

      <p
        className="
          mt-5
          text-2xl
          font-semibold
          text-[var(--foreground)]
        "
      >
        {value}
      </p>

      <p
        className="
          mt-1
          truncate
          text-xs
          text-[var(--foreground-muted)]
        "
      >
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   DASHBOARD CARD
   ========================================================= */

function DashboardCard({
  eyebrow,
  title,
  description,
  items,
}: {
  eyebrow: string;
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <div
      className="
        rounded-3xl
        border
        border-[var(--border)]
        bg-[var(--surface)]
        p-6
        shadow-[var(--shadow-sm)]
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
        {eyebrow}
      </p>

      <h2 className="mt-2 text-xl font-semibold">{title}</h2>

      <p
        className="
          mt-2
          text-sm
          leading-6
          text-[var(--foreground-muted)]
        "
      >
        {description}
      </p>

      <div className="mt-6 space-y-2">
        {items.map((item) => (
          <div
            key={item}
            className="
              flex
              items-center
              gap-3
              rounded-xl
              border
              border-[var(--border)]
              bg-[var(--surface-muted)]
              px-4
              py-3
            "
          >
            <span
              className="
                h-1.5
                w-1.5
                rounded-full
                bg-[var(--primary)]
              "
            />

            <span className="text-sm">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================
   INFO ROW
   ========================================================= */

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        gap-4
        border-b
        border-[var(--border)]
        py-4
        last:border-0
      "
    >
      <span className="text-sm text-[var(--foreground-muted)]">{label}</span>

      <span
        className="
          truncate
          text-right
          text-sm
          font-medium
        "
      >
        {value ?? "—"}
      </span>
    </div>
  );
}

/* =========================================================
   SECURITY ITEM
   ========================================================= */

function SecurityItem({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        rounded-xl
        border
        border-[var(--border)]
        bg-[var(--surface-muted)]
        px-4
        py-3
      "
    >
      <span className="text-sm text-[var(--foreground-secondary)]">
        {label}
      </span>

      <span
        className={enabled ? "text-[var(--success)]" : "text-[var(--warning)]"}
      >
        {enabled ? "✓" : "!"}
      </span>
    </div>
  );
}

/* =========================================================
   LOADING
   ========================================================= */

function DashboardLoading() {
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
        <div className="animate-pulse">
          <div className="h-4 w-32 rounded bg-[var(--surface-muted)]" />

          <div className="mt-6 h-10 w-80 rounded bg-[var(--surface-muted)]" />

          <div className="mt-4 h-4 w-96 max-w-full rounded bg-[var(--surface-muted)]" />
        </div>
      </div>
    </div>
  );
}

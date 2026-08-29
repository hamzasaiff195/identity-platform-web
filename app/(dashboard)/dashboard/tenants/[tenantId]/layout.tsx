"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

type TenantNavItem = {
  name: string;
  href: string;
};

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams<{ tenantId: string }>();
  const pathname = usePathname();

  const tenantId = params.tenantId;

  const { isSuperAdmin, isAdmin, loading } = useAuth();

  const canManageTenant = !loading && (isSuperAdmin || isAdmin);

  const navigation: TenantNavItem[] = [
    {
      name: "Overview",
      href: `/dashboard/tenants/${tenantId}`,
    },
    {
      name: "Members",
      href: `/dashboard/tenants/${tenantId}/members`,
    },
    {
      name: "Roles",
      href: `/dashboard/tenants/${tenantId}/roles`,
    },
    {
      name: "Permissions",
      href: `/dashboard/tenants/${tenantId}/permissions`,
    },
  ];

  function isActive(href: string) {
    if (href === `/dashboard/tenants/${tenantId}`) {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  if (loading) {
    return (
      <main className="identity-page min-h-screen p-6">
        <div className="mx-auto max-w-7xl">
          <div className="identity-surface rounded-2xl p-8">
            <p className="identity-muted text-sm">Loading tenant...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!canManageTenant) {
    return (
      <main className="identity-page flex min-h-screen items-center justify-center p-6">
        <div className="identity-surface w-full max-w-md rounded-2xl p-8 text-center">
          <p className="identity-eyebrow">Tenant administration</p>

          <h1 className="mt-2 text-xl font-semibold">Access denied</h1>

          <p className="identity-muted mt-2 text-sm leading-6">
            You do not have permission to manage this tenant.
          </p>

          <Link
            href="/dashboard"
            className="identity-button-primary mt-6 inline-block rounded-xl px-4 py-3 text-sm font-medium"
          >
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <div className="identity-page min-h-screen">
      {/* ------------------------------------------------------------------ */}
      {/* TENANT HEADER                                                      */}
      {/* ------------------------------------------------------------------ */}

      <div className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex min-h-20 items-center justify-between gap-6">
            <div className="min-w-0">
              <Link
                href="/dashboard/tenants"
                className="identity-muted text-xs hover:text-[var(--foreground)]"
              >
                ← All tenants
              </Link>

              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-semibold">
                  Tenant Administration
                </span>

                <span className="text-[var(--foreground-subtle)]">/</span>

                <span className="truncate font-mono text-xs text-[var(--foreground-muted)]">
                  {tenantId}
                </span>
              </div>
            </div>
          </div>

          {/* ---------------------------------------------------------------- */}
          {/* TENANT NAVIGATION                                                */}
          {/* ---------------------------------------------------------------- */}

          <nav className="flex gap-1 overflow-x-auto pb-0">
            {navigation.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative
                    shrink-0
                    px-4
                    py-3
                    text-sm
                    font-medium
                    transition-colors

                    ${
                      active
                        ? "text-[var(--primary)]"
                        : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
                    }
                  `}
                >
                  {item.name}

                  {active && (
                    <span
                      className="
                        absolute
                        inset-x-2
                        bottom-0
                        h-0.5
                        rounded-full
                        bg-[var(--primary)]
                      "
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* TENANT CONTENT                                                     */}
      {/* ------------------------------------------------------------------ */}

      {children}
    </div>
  );
}

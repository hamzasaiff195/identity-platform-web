"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";

type SidebarItemType = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const navigation: SidebarItemType[] = [
  {
    name: "Overview",
    href: "/dashboard",
    icon: DashboardIcon,
  },
  {
    name: "Users",
    href: "/dashboard/users",
    icon: UsersIcon,
  },
  {
    name: "Sessions",
    href: "/dashboard/sessions",
    icon: SessionsIcon,
  },
  {
    name: "Security",
    href: "/dashboard/security",
    icon: SecurityIcon,
  },
  {
    name: "Audit Logs",
    href: "/dashboard/audit-logs",
    icon: AuditLogsIcon,
  },
  {
    name: "AI Search",
    href: "/dashboard/ai-search",
    icon: AiSearchIcon,
  },
];

const superAdminManagement: SidebarItemType[] = [
  {
    name: "Users",
    href: "/dashboard/users",
    icon: UsersIcon,
  },
  {
    name: "Tenants",
    href: "/dashboard/tenants",
    icon: TenantsIcon,
  },
  {
    name: "Roles",
    href: "/dashboard/roles",
    icon: RolesIcon,
  },
  {
    name: "Permissions",
    href: "/dashboard/permissions",
    icon: PermissionsIcon,
  },
];

const systemNavigation: SidebarItemType[] = [
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: SettingsIcon,
  },
];

type SidebarProps = {
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
};

export function Sidebar({
  collapsed,
  mobileOpen,
  onToggle,
  onCloseMobile,
}: SidebarProps) {
  const pathname = usePathname();

  const { isSuperAdmin, loading } = useAuth();

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const showSuperAdminManagement = !loading && isSuperAdmin;

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onCloseMobile}
          className="
            fixed
            inset-0
            z-40
            bg-black/40
            lg:hidden
          "
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed
          inset-y-0
          left-0
          z-50
          flex
          w-64
          flex-col
          border-r
          border-[var(--border)]
          bg-[var(--surface)]
          shadow-[var(--shadow-lg)]
          transition-[width,transform]
          duration-200
          ease-in-out

          ${collapsed ? "lg:w-[72px]" : "lg:w-64"}

          -translate-x-full
          lg:translate-x-0

          ${mobileOpen ? "translate-x-0" : ""}
        `}
      >
        {/* BRAND */}
        <div
          className={`
            flex
            h-16
            shrink-0
            items-center
            border-b
            border-[var(--border)]
            px-6

            ${collapsed ? "lg:justify-center lg:px-0" : ""}
          `}
        >
          <Link
            href="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-3"
            title={collapsed ? "Identity Platform" : undefined}
          >
            <div
              className="
                relative
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-2xl
                bg-[var(--primary)]
                shadow-lg
              "
            >
              <span
                className="
                  absolute
                  h-3
                  w-3
                  rotate-45
                  rounded-[3px]
                  border-2
                  border-white/80
                "
              />
            </div>

            <div
              className={`
                overflow-hidden
                whitespace-nowrap
                transition-all
                duration-200

                ${collapsed ? "lg:w-0 lg:opacity-0" : "w-auto opacity-100"}
              `}
            >
              <div
                className="
                  text-[15px]
                  font-bold
                  tracking-tight
                  text-[var(--foreground)]
                "
              >
                identity
              </div>

              <div
                className="
                  font-mono
                  text-[8px]
                  uppercase
                  tracking-[0.24em]
                  text-[var(--primary)]
                "
              >
                platform
              </div>
            </div>
          </Link>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          {/* Workspace */}
          <SidebarSectionLabel label="Workspace" collapsed={collapsed} first />

          <div className="space-y-1">
            {navigation.map((item) => (
              <SidebarItem
                key={item.href}
                item={item}
                active={isActive(item.href)}
                collapsed={collapsed}
                onCloseMobile={onCloseMobile}
              />
            ))}
          </div>

          {/* PLATFORM ADMINISTRATION */}
          {showSuperAdminManagement && (
            <>
              <SidebarSectionLabel
                label="Platform administration"
                collapsed={collapsed}
              />

              <div className="space-y-1">
                {superAdminManagement.map((item) => (
                  <SidebarItem
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    collapsed={collapsed}
                    onCloseMobile={onCloseMobile}
                  />
                ))}
              </div>
            </>
          )}

          {/* SYSTEM */}
          <SidebarSectionLabel label="System" collapsed={collapsed} />

          <div className="space-y-1">
            {systemNavigation.map((item) => (
              <SidebarItem
                key={item.href}
                item={item}
                active={isActive(item.href)}
                collapsed={collapsed}
                onCloseMobile={onCloseMobile}
              />
            ))}
          </div>
        </nav>

        {/* ENVIRONMENT */}
        <div
          className={`
            shrink-0
            border-t
            border-[var(--border)]
            p-4

            ${collapsed ? "lg:p-3" : ""}
          `}
        >
          <div
            className={`
              rounded-2xl
              border
              border-[var(--border)]
              bg-[var(--surface-muted)]
              p-4

              ${collapsed ? "lg:p-2" : ""}
            `}
          >
            <div
              className={`
                flex
                items-center
                justify-between

                ${collapsed ? "lg:justify-center" : ""}
              `}
            >
              <p
                className={`
                  font-mono
                  text-[9px]
                  uppercase
                  tracking-[0.18em]
                  text-[var(--foreground-subtle)]

                  ${collapsed ? "lg:hidden" : ""}
                `}
              >
                Environment
              </p>

              <span
                title="Development environment online"
                className="
                  h-1.5
                  w-1.5
                  shrink-0
                  rounded-full
                  bg-[var(--success)]
                "
              />
            </div>

            <div
              className={`
                mt-2
                flex
                items-center
                justify-between

                ${collapsed ? "lg:hidden" : ""}
              `}
            >
              <span
                className="
                  text-xs
                  font-medium
                  text-[var(--foreground-secondary)]
                "
              >
                Development
              </span>

              <span
                className="
                  rounded-md
                  bg-[var(--success-soft)]
                  px-2
                  py-1
                  font-mono
                  text-[8px]
                  uppercase
                  tracking-wider
                  text-[var(--success)]
                "
              >
                Online
              </span>
            </div>
          </div>

          {/* Collapse */}
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="
              mt-3
              hidden
              h-9
              w-full
              items-center
              justify-center
              rounded-lg
              text-[var(--foreground-muted)]
              transition
              hover:bg-[var(--surface-hover)]
              hover:text-[var(--foreground)]
              lg:flex
            "
          >
            <span className="text-lg leading-none">
              {collapsed ? "›" : "‹"}
            </span>

            {!collapsed && (
              <span className="ml-2 text-xs font-medium">Collapse sidebar</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

/* ========================================================================== */
/* SECTION LABEL                                                              */
/* ========================================================================== */

function SidebarSectionLabel({
  label,
  collapsed,
  first = false,
}: {
  label: string;
  collapsed: boolean;
  first?: boolean;
}) {
  return (
    <div
      className={`
        px-3
        font-mono
        text-[9px]
        uppercase
        tracking-[0.2em]
        text-[var(--foreground-subtle)]
        transition-all

        ${first ? "mb-3" : "mb-3 mt-8"}

        ${collapsed ? "lg:hidden" : ""}
      `}
    >
      {label}
    </div>
  );
}

/* ========================================================================== */
/* SIDEBAR ITEM                                                               */
/* ========================================================================== */

function SidebarItem({
  item,
  active,
  collapsed,
  onCloseMobile,
}: {
  item: SidebarItemType;
  active: boolean;
  collapsed: boolean;
  onCloseMobile: () => void;
}) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onCloseMobile}
      title={collapsed ? item.name : undefined}
      className={`
        group
        relative
        flex
        items-center
        gap-3
        rounded-xl
        px-3
        py-2.5
        text-sm
        transition-colors

        ${
          active
            ? "bg-[var(--primary-soft)] font-semibold text-[var(--primary)]"
            : "text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
        }

        ${collapsed ? "lg:justify-center lg:px-0" : ""}
      `}
    >
      {active && (
        <span
          className="
            absolute
            left-0
            h-5
            w-[3px]
            rounded-r-full
            bg-[var(--primary)]
          "
        />
      )}

      <span
        className={`
          flex
          h-8
          w-8
          shrink-0
          items-center
          justify-center
          rounded-lg
          text-xs
          transition-colors

          ${
            active
              ? "bg-[var(--surface)] text-[var(--primary)] shadow-sm"
              : "bg-[var(--surface-muted)] text-[var(--foreground-subtle)] group-hover:text-[var(--foreground-secondary)]"
          }
        `}
      >
        <Icon className="h-4 w-4" />
      </span>

      <span
        className={`
          overflow-hidden
          whitespace-nowrap
          transition-all
          duration-200

          ${collapsed ? "lg:hidden" : ""}
        `}
      >
        {item.name}
      </span>

      {active && (
        <span
          className={`
            ml-auto
            h-1.5
            w-1.5
            shrink-0
            rounded-full
            bg-[var(--primary)]

            ${collapsed ? "lg:hidden" : ""}
          `}
        />
      )}
    </Link>
  );
}

/* ========================================================================== */
/* ICON BASE                                                                  */
/* ========================================================================== */

function IconBase({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

/* ========================================================================== */
/* ICONS                                                                      */
/* ========================================================================== */

function DashboardIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </IconBase>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </IconBase>
  );
}

function SessionsIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 8h10" />
      <path d="M7 12h4" />
      <path d="M7 16h7" />
      <path d="M16 12h.01" />
    </IconBase>
  );
}

function SecurityIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </IconBase>
  );
}

function AuditLogsIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M4 4h16v16H4z" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </IconBase>
  );
}

function AiSearchIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
      <path d="M8.5 11h5" />
      <path d="M11 8.5v5" />
    </IconBase>
  );
}

function RolesIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M16 11h5" />
      <path d="M18.5 8.5v5" />
    </IconBase>
  );
}

function PermissionsIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <circle cx="8" cy="12" r="4" />
      <path d="M12 12h9" />
      <path d="M18 12v3" />
      <path d="M21 12v2" />
    </IconBase>
  );
}

function TenantsIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
      <path d="M16 9h2a2 2 0 0 1 2 2v10" />
      <path d="M8 7h4" />
      <path d="M8 11h4" />
      <path d="M8 15h4" />
      <path d="M10 21v-3h2v3" />
    </IconBase>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <IconBase className={className}>
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.1h-2.5v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H6.5v-2.5h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.1H15v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.1V14h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </IconBase>
  );
}

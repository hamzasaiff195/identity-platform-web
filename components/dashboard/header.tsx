"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/providers/auth-provider";

type DashboardHeaderProps = {
  collapsed: boolean;
  onToggleSidebar: () => void;
  onOpenMobileSidebar: () => void;
};

export function DashboardHeader({
  collapsed,
  onToggleSidebar,
  onOpenMobileSidebar,
}: DashboardHeaderProps) {
  const { user, logout } = useAuth();

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
      setDarkMode(true);
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      setDarkMode(false);
      document.documentElement.removeAttribute("data-theme");
    }
  }, []);

  function toggleTheme() {
    const nextDarkMode = !darkMode;

    setDarkMode(nextDarkMode);

    if (nextDarkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  }

  const initials = user?.email?.split("@")[0].slice(0, 2).toUpperCase() || "HA";

  return (
    <header
      className="
        sticky
        top-0
        z-30
        flex
        h-16
        items-center
        justify-between
        border-b
        border-[var(--border)]
        bg-[var(--surface)]
        px-4
        lg:px-6
      "
    >
      {/* Left */}
      <div className="flex min-w-0 items-center gap-2">
        {/* Mobile menu */}
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation"
          className="
            flex
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-lg
            text-xl
            text-[var(--foreground-muted)]
            transition
            hover:bg-[var(--background)]
            hover:text-[var(--foreground)]
            lg:hidden
          "
        >
          ☰
        </button>

        {/* Desktop collapse button */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="
            hidden
            h-10
            w-10
            shrink-0
            items-center
            justify-center
            rounded-lg
            text-lg
            text-[var(--foreground-muted)]
            transition
            hover:bg-[var(--background)]
            hover:text-[var(--foreground)]
            lg:flex
          "
        >
          {collapsed ? "›" : "‹"}
        </button>

        <div className="hidden min-w-0 sm:block">
          <p className="text-sm font-medium text-[var(--foreground)]">
            Identity Platform
          </p>

          <p className="text-xs text-[var(--foreground-muted)]">
            Administration
          </p>
        </div>
      </div>

      {/* Right */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Active status + email */}
        <div
          className="
            hidden
            items-center
            gap-3
            rounded-lg
            px-2
            py-1.5
            sm:flex
          "
        >
          {/* Active */}
          <div className="flex items-center gap-2">
            <span
              className="
                h-2
                w-2
                rounded-full
                bg-[var(--success)]
              "
            />

            <span className="text-xs text-[var(--foreground-muted)]">
              Active
            </span>
          </div>

          <span className="h-4 w-px bg-[var(--border)]" />

          {/* Email */}
          <span
            className="
              max-w-[220px]
              truncate
              text-xs
              font-medium
              text-[var(--foreground)]
              lg:max-w-[300px]
            "
            title={user?.email || ""}
          >
            {user?.email || "User"}
          </span>
        </div>

        {/* Theme toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={
            darkMode ? "Switch to light theme" : "Switch to dark theme"
          }
          title={darkMode ? "Light mode" : "Dark mode"}
          className="
            flex
            h-10
            w-10
            items-center
            justify-center
            rounded-lg
            text-base
            text-[var(--foreground-muted)]
            transition
            hover:bg-[var(--background)]
            hover:text-[var(--foreground)]
          "
        >
          {darkMode ? "☀" : "☾"}
        </button>

        {/* User avatar */}
        <div
          className="
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-full
            bg-[var(--background)]
            text-xs
            font-semibold
            text-[var(--foreground-muted)]
          "
          title={user?.email || "User"}
        >
          {initials}
        </div>

        {/* Sign out */}
        <button
          type="button"
          onClick={logout}
          className="
            hidden
            rounded-lg
            px-3
            py-2
            text-sm
            text-[var(--foreground-muted)]
            transition
            hover:bg-[var(--background)]
            hover:text-[var(--foreground)]
            sm:block
          "
        >
          Sign out
        </button>
      </div>
    </header>
  );
}

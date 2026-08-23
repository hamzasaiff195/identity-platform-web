"use client";

import { useEffect, useState } from "react";

import { Sidebar } from "./sidebar";
import { DashboardHeader } from "./header";

const SIDEBAR_STORAGE_KEY = "identity-platform-sidebar-collapsed";

export function Shell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);

    if (saved === "true") {
      setCollapsed(true);
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
  }, [collapsed, hydrated]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggle={() => setCollapsed((value) => !value)}
        onCloseMobile={() => setMobileOpen(false)}
      />

      {/* Main application area */}
      <div
        className={`
          min-h-screen
          transition-[padding-left]
          duration-200
          ease-in-out
          lg:pl-64
          ${collapsed ? "lg:pl-[72px]" : ""}
        `}
      >
        {/* Header */}
        <DashboardHeader
          collapsed={collapsed}
          onToggleSidebar={() => setCollapsed((value) => !value)}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />

        {/* Page content */}
        <main
          className="
            min-h-[calc(100vh-64px)]
            p-4
            sm:p-5
            lg:p-6
          "
        >
          {children}
        </main>
      </div>
    </div>
  );
}

"use client";

import { useTheme } from "@/providers/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        theme === "light" ? "Switch to dark mode" : "Switch to light mode"
      }
      aria-pressed={theme === "dark"}
      className="
        inline-flex
        h-10
        items-center
        gap-2
        rounded-xl
        border
        border-[var(--border)]
        bg-[var(--surface)]
        px-3
        text-[var(--foreground-secondary)]
        transition-all
        duration-200
        hover:border-[var(--primary)]
        hover:text-[var(--foreground)]
        hover:bg-[var(--surface-hover)]
      "
    >
      <span
        className="
          text-base
          transition-transform
          duration-200
        "
        aria-hidden="true"
      >
        {theme === "light" ? "☀" : "☾"}
      </span>

      <span className="hidden text-xs font-medium sm:inline">
        {theme === "light" ? "Light" : "Dark"}
      </span>
    </button>
  );
}

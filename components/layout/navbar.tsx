import Link from "next/link";
import { Logo } from "../branding/logo";

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto max-w-7xl px-6 pt-5">
        <nav
          className="
            identity-glass
            flex
            h-16
            items-center
            justify-between
            rounded-2xl
            border
            border-[var(--border)]
            bg-[var(--surface)]
            px-5
            shadow-2xl
            shadow-black/10
          "
        >
          <Logo />

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="
                text-sm
                text-[var(--foreground-muted)]
                transition
                hover:text-[var(--foreground)]
              "
            >
              Features
            </a>

            <a
              href="#security"
              className="
                text-sm
                text-[var(--foreground-muted)]
                transition
                hover:text-[var(--foreground)]
              "
            >
              Security
            </a>

            <a
              href="#architecture"
              className="
                text-sm
                text-[var(--foreground-muted)]
                transition
                hover:text-[var(--foreground)]
              "
            >
              Architecture
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="
                hidden
                rounded-xl
                px-4
                py-2.5
                text-sm
                font-medium
                text-[var(--foreground-secondary)]
                transition
                hover:text-[var(--foreground)]
                sm:block
              "
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="
                rounded-xl
                bg-[var(--primary)]
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-[var(--primary-hover)]
              "
            >
              Get started
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}

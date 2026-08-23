import { Logo } from "../branding/logo";

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-6 sm:flex-row sm:items-center">
        <Logo />

        <p className="text-xs text-slate-600">
          Identity infrastructure for modern applications.
        </p>
      </div>
    </footer>
  );
}

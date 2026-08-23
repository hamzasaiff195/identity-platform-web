import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <div className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-linear-to-br from-violet-500 to-cyan-400 shadow-lg shadow-violet-500/20">
        <span className="relative z-10 text-lg font-black text-white">◈</span>

        <div className="absolute inset-0 bg-white/10 opacity-0 transition group-hover:opacity-100" />
      </div>

      <div className="flex flex-col leading-none">
        <span className="text-sm font-semibold tracking-tight text-white">
          Identity
        </span>

        <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-500">
          Platform
        </span>
      </div>
    </Link>
  );
}

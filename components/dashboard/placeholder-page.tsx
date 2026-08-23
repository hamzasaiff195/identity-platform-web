interface PlaceholderPageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function PlaceholderPage({
  eyebrow,
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-violet-400">
          {eyebrow}
        </p>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>

        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      </div>

      <div className="flex min-h-[400px] items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015]">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-400">
            ◈
          </div>

          <h2 className="mt-5 text-sm font-medium text-slate-300">
            Module ready
          </h2>

          <p className="mt-2 text-xs text-slate-700">
            Backend integration will be connected here.
          </p>
        </div>
      </div>
    </div>
  );
}

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
      <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--foreground-subtle)]">
        {title}
      </p>

      <p className="mt-5 text-2xl font-semibold text-[var(--foreground)]">
        {value}
      </p>

      <p className="mt-1 truncate text-xs text-[var(--foreground-muted)]">
        {description}
      </p>
    </div>
  );
}

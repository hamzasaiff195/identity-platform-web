export default function SecurityPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <div
        className="
          rounded-3xl
          border
          border-[var(--border)]
          bg-[var(--surface)]
          p-8
          shadow-[var(--shadow-sm)]
        "
      >
        <p
          className="
            font-mono
            text-xs
            uppercase
            tracking-widest
            text-[var(--primary)]
          "
        >
          Protection
        </p>

        <h1
          className="
            mt-2
            text-3xl
            font-semibold
            text-[var(--foreground)]
          "
        >
          Security
        </h1>

        <p
          className="
            mt-3
            text-sm
            text-[var(--foreground-muted)]
          "
        >
          Security controls and authentication protection will be implemented
          here.
        </p>
      </div>
    </div>
  );
}

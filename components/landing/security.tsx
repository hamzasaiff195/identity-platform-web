export function Security() {
  return (
    <section
      id="security"
      className="relative overflow-hidden border-t border-white/5 py-28"
    >
      <div className="absolute right-0 top-1/2 h-96 w-96 -translate-y-1/2 rounded-full bg-cyan-500/10 blur-[140px]" />

      <div className="relative mx-auto grid max-w-7xl gap-16 px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-400">
            Security first
          </p>

          <h2 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
            Security isn't
            <br />
            an add-on.
          </h2>

          <p className="mt-6 max-w-xl leading-8 text-slate-500">
            Identity Platform treats authentication, sessions, verification and
            authorization as first-class infrastructure.
          </p>
        </div>

        <div className="identity-glass rounded-3xl p-6">
          {[
            ["Password hashing", "Argon2id"],
            ["Access tokens", "Short lived JWT"],
            ["Refresh tokens", "Rotatable sessions"],
            ["Verification", "Single-use tokens"],
            ["Authorization", "RBAC + ReBAC"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between border-b border-white/5 py-5 last:border-0"
            >
              <span className="text-sm text-slate-400">{label}</span>

              <span className="rounded-lg bg-white/5 px-3 py-1.5 font-mono text-xs text-cyan-300">
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";

export function Hero() {
  return (
    <section className="identity-grid relative overflow-hidden pt-40">
      <div className="absolute left-1/2 top-32 h-96 w-96 -translate-x-1/2 rounded-full bg-violet-600/20 blur-[140px]" />

      <div className="relative mx-auto max-w-7xl px-6 pb-28">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/5 px-4 py-2 text-xs font-medium text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400" />
            Identity infrastructure for modern applications
          </div>

          <h1 className="text-5xl font-bold tracking-[-0.04em] text-white sm:text-6xl lg:text-8xl">
            Identity should be
            <span className="block bg-linear-to-r from-violet-400 via-cyan-300 to-violet-400 bg-clip-text text-transparent">
              infrastructure.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-slate-400">
            Authentication, authorization, sessions and identity verification
            designed as a secure foundation for your applications.
          </p>

          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="group rounded-2xl bg-linear-to-r from-violet-500 to-indigo-500 px-7 py-4 text-sm font-semibold text-white shadow-xl shadow-violet-500/20 transition hover:-translate-y-0.5"
            >
              Create your identity
              <span className="ml-2 transition group-hover:translate-x-1">
                →
              </span>
            </Link>

            <Link
              href="/login"
              className="identity-glass rounded-2xl px-7 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>

        <div className="identity-glass identity-glow mx-auto mt-20 max-w-5xl overflow-hidden rounded-3xl">
          <div className="flex h-12 items-center border-b border-white/10 px-5">
            <div className="flex gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
            </div>

            <span className="ml-5 font-mono text-xs text-slate-600">
              identity-platform
            </span>
          </div>

          <div className="grid gap-8 p-8 md:grid-cols-[1fr_1.2fr] md:p-12">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-violet-400">
                Authentication
              </p>

              <h2 className="mt-4 text-3xl font-semibold">
                One identity layer.
                <br />
                Every application.
              </h2>

              <p className="mt-4 leading-7 text-slate-500">
                Build secure applications without reinventing identity
                infrastructure.
              </p>
            </div>

            <div className="space-y-3">
              {[
                "JWT authentication",
                "Session management",
                "Email verification",
                "Resource-based authorization",
                "Multi-tenant architecture",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3"
                >
                  <span className="text-sm text-slate-300">{item}</span>

                  <span className="font-mono text-xs text-slate-600">
                    0{index + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    number: "01",
    title: "Authentication",
    description:
      "Password authentication, JWT access tokens and refresh-token based sessions.",
  },
  {
    number: "02",
    title: "Authorization",
    description:
      "Build granular RBAC and resource-based permissions around your application's domain.",
  },
  {
    number: "03",
    title: "Identity verification",
    description:
      "Email verification and extensible verification challenges for future identity providers.",
  },
  {
    number: "04",
    title: "Multi-tenant",
    description:
      "A foundation for securely isolating users, roles, permissions and resources across tenants.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-t border-white/5 py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-400">
            Core capabilities
          </p>

          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Identity primitives,
            <br />
            built correctly.
          </h2>
        </div>

        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10 md:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.number}
              className="bg-[#090b18] p-8 transition hover:bg-[#0d1020] md:p-10"
            >
              <span className="font-mono text-xs text-violet-400">
                {feature.number}
              </span>

              <h3 className="mt-8 text-xl font-semibold">{feature.title}</h3>

              <p className="mt-3 max-w-md leading-7 text-slate-500">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

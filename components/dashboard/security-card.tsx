const metrics = [
  {
    label: "Email verification",
    value: 94,
  },
  {
    label: "Strong passwords",
    value: 88,
  },
  {
    label: "Active sessions",
    value: 76,
  },
];

export function SecurityCard() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0a0c18] p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium">Security health</p>

          <p className="mt-1 text-xs text-slate-600">
            Identity security overview
          </p>
        </div>

        <div className="rounded-xl bg-emerald-400/10 px-3 py-2 text-sm font-semibold text-emerald-400">
          91%
        </div>
      </div>

      <div className="mt-7 space-y-5">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="mb-2 flex justify-between text-xs">
              <span className="text-slate-500">{metric.label}</span>

              <span className="text-slate-400">{metric.value}%</span>
            </div>

            <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-linear-to-r from-violet-500 to-cyan-400"
                style={{
                  width: `${metric.value}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

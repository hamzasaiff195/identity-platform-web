const activities = [
  {
    initials: "HA",
    title: "New user registered",
    description: "hamza@example.com created an account",
    time: "2 min ago",
  },
  {
    initials: "AV",
    title: "Email verified",
    description: "alex@example.com verified their identity",
    time: "8 min ago",
  },
  {
    initials: "SR",
    title: "New session created",
    description: "Chrome · macOS · Karachi",
    time: "14 min ago",
  },
  {
    initials: "JD",
    title: "Role updated",
    description: "Administrator permissions modified",
    time: "32 min ago",
  },
];

export function Activity() {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#0a0c18]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5">
        <div>
          <h2 className="text-sm font-semibold">Recent activity</h2>

          <p className="mt-1 text-xs text-slate-600">Latest identity events</p>
        </div>

        <button className="text-xs font-medium text-violet-400 hover:text-violet-300">
          View all
        </button>
      </div>

      <div className="divide-y divide-white/[0.05]">
        {activities.map((activity) => (
          <div
            key={activity.title}
            className="flex items-center gap-4 px-6 py-4"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] text-[10px] font-semibold text-slate-400">
              {activity.initials}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-slate-300">
                {activity.title}
              </p>

              <p className="mt-1 truncate text-[11px] text-slate-600">
                {activity.description}
              </p>
            </div>

            <span className="shrink-0 text-[10px] text-slate-700">
              {activity.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

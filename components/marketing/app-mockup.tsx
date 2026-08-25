import Image from "next/image";
import {
  Dumbbell,
  Image as ImageIcon,
  LayoutDashboard,
  MessageSquare,
  Users,
} from "lucide-react";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Users, label: "Clients" },
  { icon: ImageIcon, label: "Content" },
  { icon: Dumbbell, label: "Programs" },
  { icon: MessageSquare, label: "Messages" },
];

const STATS = [
  { label: "Revenue", value: "$4,280", delta: "+12.4%" },
  { label: "Clients", value: "42", delta: "+3" },
  { label: "At risk", value: "5", delta: null },
];

const ROWS = [
  { name: "Elena Volkov", tier: "1:1", tone: "bg-tier-3", pct: 91, img: 47 },
  { name: "Priya Nair", tier: "Group", tone: "bg-tier-2", pct: 84, img: 32 },
  { name: "Daniel Osei", tier: "Content", tone: "bg-tier-1", pct: 34, img: 12 },
];

/**
 * A recreation of the coach dashboard inside a browser frame, built in
 * markup rather than shipped as a screenshot: it stays sharp at any DPI,
 * restyles itself with the design tokens, and weighs a fraction of a PNG.
 * Decorative, so the whole thing is aria-hidden.
 */
export function AppMockup() {
  return (
    <div
      aria-hidden
      className="surface-sheen overflow-hidden rounded-xl border border-border bg-card shadow-[0_40px_120px_-30px_rgba(0,0,0,0.75)]"
    >
      {/* browser chrome */}
      <div className="flex items-center gap-2 border-b border-border/70 bg-background/60 px-4 py-3">
        <span className="size-2.5 rounded-full bg-danger/70" />
        <span className="size-2.5 rounded-full bg-warning/70" />
        <span className="size-2.5 rounded-full bg-success/70" />
        <div className="ml-3 flex h-6 flex-1 items-center rounded-md border border-border/70 bg-card px-3 text-[10px] text-fg-muted">
          onlychamps.app/dashboard
        </div>
      </div>

      <div className="flex">
        {/* sidebar */}
        <div className="hidden w-40 shrink-0 border-r border-border/70 bg-sidebar/60 p-3 sm:block">
          <div className="px-2 pb-3 font-display text-[11px] font-bold tracking-[-0.01em] text-foreground">
            OnlyChamps
          </div>
          <div className="space-y-0.5">
            {NAV.map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-2 rounded px-2 py-1.5 text-[10px] font-medium ${
                  active
                    ? "bg-accent text-foreground"
                    : "text-fg-muted"
                }`}
              >
                <Icon className="size-3" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* content */}
        <div className="min-w-0 flex-1 space-y-3 p-4">
          <div className="grid grid-cols-3 gap-2">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-md border border-border/70 bg-background/40 p-2.5"
              >
                <div className="text-[8px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
                  {s.label}
                </div>
                <div className="mt-0.5 font-display text-base font-bold tracking-[-0.02em] tabular-nums text-foreground">
                  {s.value}
                </div>
                {s.delta && (
                  <div className="text-[8px] font-medium text-success">
                    ▲ {s.delta}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* revenue chart */}
          <div className="rounded-md border border-border/70 bg-background/40 p-3">
            <div className="mb-2 text-[8px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
              Revenue — last 6 months
            </div>
            <svg viewBox="0 0 320 74" className="h-[74px] w-full" role="presentation">
              <defs>
                <linearGradient id="ocMockFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--oc-volt-500)" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="var(--oc-volt-500)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[18, 37, 56].map((y) => (
                <line
                  key={y}
                  x1="0"
                  x2="320"
                  y1={y}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth="1"
                />
              ))}
              <path
                d="M0 66 C 40 64, 60 56, 90 52 S 150 44, 180 34 S 250 20, 320 8 L320 74 L0 74 Z"
                fill="url(#ocMockFill)"
              />
              <path
                d="M0 66 C 40 64, 60 56, 90 52 S 150 44, 180 34 S 250 20, 320 8"
                fill="none"
                stroke="var(--oc-volt-500)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <circle cx="320" cy="8" r="3" fill="var(--oc-volt-500)" />
            </svg>
          </div>

          {/* client rows */}
          <div className="space-y-1.5">
            {ROWS.map((r) => (
              <div
                key={r.name}
                className="flex items-center gap-2.5 rounded-md border border-border/70 bg-background/40 px-2.5 py-2"
              >
                <Image
                  src={`https://i.pravatar.cc/64?img=${r.img}`}
                  alt=""
                  width={20}
                  height={20}
                  className="size-5 shrink-0 rounded-full object-cover"
                  unoptimized
                />
                <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-foreground">
                  {r.name}
                </span>
                <span
                  className={`rounded-sm px-1.5 py-0.5 text-[8px] font-semibold text-volt-ink ${r.tone}`}
                >
                  {r.tier}
                </span>
                <div className="hidden w-14 sm:block">
                  <div className="h-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${
                        r.pct < 50 ? "bg-danger" : "bg-success"
                      }`}
                      style={{ width: `${r.pct}%` }}
                    />
                  </div>
                </div>
                <span className="w-7 shrink-0 text-right text-[9px] tabular-nums text-fg-muted">
                  {r.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

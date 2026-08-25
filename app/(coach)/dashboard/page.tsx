import { StatTile } from "@/components/shared/stat-tile";

/**
 * Static preview — see docs/04-FRONTEND.md "/dashboard" for the full spec
 * (revenue chart, tier distribution, at-risk panel, recent check-ins).
 * Wired to real data in Phase 9, once Phase 1's database exists.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-[30px] font-semibold leading-9 tracking-[-0.02em] text-foreground">
        Dashboard
      </h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Monthly revenue"
          value="$4,280"
          delta={{ value: "12.4% vs last month", direction: "up" }}
        />
        <StatTile
          label="Active clients"
          value="42"
          delta={{ value: "3 new this month", direction: "up" }}
        />
        <StatTile
          label="At risk"
          value="5"
          delta={{ value: "2 vs last week", direction: "up" }}
          invertPolarity
        />
        <StatTile label="Awaiting reply" value="3" />
      </div>
      <p className="max-w-[68ch] text-sm text-muted-foreground">
        Revenue chart, tier distribution, and the at-risk client panel land in
        Phase 9 once a Supabase project is connected — see
        docs/05-BUILD-ORDER.md.
      </p>
    </div>
  );
}

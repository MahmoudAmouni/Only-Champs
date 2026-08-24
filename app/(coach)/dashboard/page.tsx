import Link from "next/link";
import { requireCoach } from "@/lib/queries/auth";
import { getDashboardStats, getAtRiskClients, getRecentCheckIns } from "@/lib/queries/dashboard";
import { StatTile } from "@/components/shared/stat-tile";
import { RevenueChart } from "@/components/coach/revenue-chart";
import { TierDistribution } from "@/components/coach/tier-distribution";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { LayoutDashboard } from "lucide-react";

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default async function DashboardPage() {
  const coach = await requireCoach();
  const stats = await getDashboardStats(coach.id);

  if (stats.activeClientCount === 0) {
    return (
      <EmptyState
        icon={LayoutDashboard}
        title="Your dashboard fills up once you have clients"
        description="Share your storefront link to start getting subscribers."
        action={
          <Button render={<Link href={`/c/${coach.profile.coaches.handle}`} />} nativeButton={false}>
            View your storefront
          </Button>
        }
      />
    );
  }

  const [atRiskClients, recentCheckIns] = await Promise.all([
    getAtRiskClients(coach.id),
    getRecentCheckIns(coach.id),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-foreground">
        Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile
          label="Monthly revenue"
          value={formatCents(stats.mrrCents)}
          delta={{ value: `${stats.newThisMonth} new this month`, direction: "up" }}
        />
        <StatTile
          label="Active clients"
          value={String(stats.activeClientCount)}
          delta={{ value: `${stats.newThisMonth} new this month`, direction: "up" }}
        />
        <StatTile
          label="At risk"
          value={String(stats.atRiskCount)}
          invertPolarity
        />
        <StatTile label="Awaiting reply" value={String(stats.awaitingReplyCount)} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Revenue — last 6 months
          </p>
          <RevenueChart data={stats.revenueByMonth} />
        </Card>
        <Card>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tier distribution
          </p>
          <TierDistribution counts={stats.tierCounts} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Needs attention
          </p>
          {!atRiskClients.length ? (
            <p className="text-sm text-muted-foreground">Everyone&apos;s on track.</p>
          ) : (
            <div className="space-y-3">
              {atRiskClients.slice(0, 5).map((c) => (
                <div key={c.clientId} className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarImage src={c.avatarUrl ?? undefined} alt="" />
                    <AvatarFallback>{c.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-warning">
                      {c.daysSince === null ? "No workouts logged" : `${c.daysSince} days since last workout`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    render={<Link href={`/clients/${c.clientId}`} />}
                    nativeButton={false}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Recent check-ins
          </p>
          {!recentCheckIns.length ? (
            <p className="text-sm text-muted-foreground">No check-ins yet.</p>
          ) : (
            <div className="space-y-3">
              {recentCheckIns.map((c) => (
                <div key={c.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{c.profiles?.full_name}</span>
                  <div className="flex items-center gap-3">
                    {c.adherence_pct !== null && (
                      <span className="font-mono tabular-nums text-muted-foreground">
                        {c.adherence_pct}%
                      </span>
                    )}
                    {!c.coach_reply && <span className="text-xs text-warning">Reply</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

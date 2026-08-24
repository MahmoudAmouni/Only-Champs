import { notFound } from "next/navigation";
import { requireCoach } from "@/lib/queries/auth";
import { getClientDetail } from "@/lib/queries/clients";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TierBadge } from "@/components/shared/tier-badge";
import { StatTile } from "@/components/shared/stat-tile";
import { CheckInList } from "@/components/coach/check-in-list";

function formatCents(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coach = await requireCoach();
  const detail = await getClientDetail(coach.id, id);

  if (!detail) notFound();

  const { sub, checkIns, workoutLogs, program } = detail;
  const profile = sub.profiles!;
  const tier = sub.tiers!;

  const completedWorkouts = workoutLogs.filter((w) => w.completed_at).length;
  const latestCheckIn = checkIns[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-12">
            <AvatarImage src={profile.avatar_url ?? undefined} alt="" />
            <AvatarFallback>{profile.full_name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.01em] text-foreground">
              {profile.full_name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <TierBadge level={tier.level as 1 | 2 | 3} />
              <span className="text-sm text-muted-foreground">
                {formatCents(tier.price_cents)}/mo
              </span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="checkins">Check-ins</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatTile label="Total workouts" value={String(completedWorkouts)} />
            <StatTile
              label="Current weight"
              value={latestCheckIn?.weight_kg ? `${latestCheckIn.weight_kg} kg` : "—"}
            />
            <StatTile
              label="Adherence"
              value={latestCheckIn?.adherence_pct ? `${latestCheckIn.adherence_pct}%` : "—"}
            />
          </div>

          <div className="rounded-lg border border-border p-4">
            <h3 className="text-sm font-semibold text-foreground">Current program</h3>
            {program ? (
              <p className="mt-1 text-sm text-muted-foreground">
                {program.name} — {program.duration_weeks} weeks
              </p>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">No program assigned yet.</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="checkins" className="pt-6">
          <CheckInList checkIns={checkIns} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

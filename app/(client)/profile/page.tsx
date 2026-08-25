import Link from "next/link";
import { requireUser } from "@/lib/queries/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TierBadge } from "@/components/shared/tier-badge";
import { SubscriptionActions } from "@/components/client/subscription-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { CreditCard, Bookmark, Compass, ArrowRight } from "lucide-react";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.02em] text-foreground">
        {value}
      </p>
    </div>
  );
}

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createClient();

  const [
    { data: subscriptions },
    { count: workoutCount },
    { count: checkInCount },
    { data: saved },
  ] = await Promise.all([
    supabase
      .from("subscriptions")
      .select(
        "id, status, current_period_end, created_at, coach_id, coaches(display_name, handle, headline, profiles(avatar_url)), tiers(level, name, price_cents)",
      )
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("workout_logs")
      .select("id", { count: "exact", head: true })
      .eq("client_id", user.id)
      .not("completed_at", "is", null),
    supabase
      .from("check_ins")
      .select("id", { count: "exact", head: true })
      .eq("client_id", user.id),
    supabase
      .from("saved_posts")
      .select("post_id, created_at, posts(id, title, body, min_tier_level, media_type, thumbnail_path, coaches(display_name, handle))")
      .eq("client_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const subs = subscriptions ?? [];
  const activeSubs = subs.filter((s) => s.status === "active" || s.status === "trialing");
  const monthlySpend = activeSubs.reduce((sum, s) => sum + (s.tiers?.price_cents ?? 0), 0);

  return (
    <div className="space-y-8">
      {/* --------------------------------------------------------- identity */}
      <div className="flex flex-wrap items-center gap-4">
        <Avatar className="size-20">
          <AvatarImage src={user.profile.avatar_url ?? undefined} alt="" />
          <AvatarFallback className="text-xl">
            {user.profile.full_name[0]}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-foreground">
            {user.profile.full_name}
          </h1>
          <p className="truncate text-sm text-fg-secondary">{user.email}</p>
        </div>

        <Button
          variant="secondary"
          className="group ml-auto"
          render={<Link href="/discover" />}
          nativeButton={false}
        >
          <Compass />
          Find a coach
          <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Coaches" value={activeSubs.length} />
        <Stat label="Workouts" value={workoutCount ?? 0} />
        <Stat label="Check-ins" value={checkInCount ?? 0} />
        <Stat label="Per month" value={formatCents(monthlySpend)} />
      </div>

      <Tabs defaultValue="subscriptions">
        <TabsList>
          <TabsTrigger value="subscriptions">Memberships</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>

        {/* ---------------------------------------------------- memberships */}
        <TabsContent value="subscriptions" className="space-y-3 pt-5">
          {!subs.length ? (
            <EmptyState
              icon={CreditCard}
              title="No memberships yet"
              description="Subscribe to a coach and their content, programming and chat show up here."
              action={
                <Button render={<Link href="/discover" />} nativeButton={false}>
                  Browse coaches
                </Button>
              }
            />
          ) : (
            <div className="grid items-start gap-3 lg:grid-cols-2">
              {subs.map((sub) => (
                <Card key={sub.id} className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar className="size-11">
                        <AvatarImage
                          src={sub.coaches?.profiles?.avatar_url ?? undefined}
                          alt=""
                        />
                        <AvatarFallback>
                          {sub.coaches?.display_name?.[0] ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-foreground">
                          {sub.coaches?.display_name}
                        </p>
                        {sub.coaches?.headline && (
                          <p className="truncate text-xs text-fg-muted">
                            {sub.coaches.headline}
                          </p>
                        )}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-medium ${
                        sub.status === "active" ? "text-success" : "text-fg-muted"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {sub.tiers && <TierBadge level={sub.tiers.level as 1 | 2 | 3} />}
                    <span className="text-sm text-fg-secondary">
                      {sub.tiers && `${formatCents(sub.tiers.price_cents)}/mo`}
                    </span>
                    {sub.current_period_end && (
                      <span className="ml-auto text-xs text-fg-muted">
                        Renews{" "}
                        {new Date(sub.current_period_end).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  <SubscriptionActions
                    coachId={sub.coach_id}
                    handle={sub.coaches?.handle ?? null}
                  />
                  <p className="text-xs text-fg-muted">
                    Demo mode — no payment is taken and none is required.
                  </p>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* --------------------------------------------------------- saved */}
        <TabsContent value="saved" className="pt-5">
          {!saved?.length ? (
            <EmptyState
              icon={Bookmark}
              title="Nothing saved yet"
              description="Tap Save on any post in your feed to keep it here."
            />
          ) : (
            <div className="grid items-start gap-3 lg:grid-cols-2">
              {saved.map((row) =>
                row.posts ? (
                  <Card key={row.post_id} className="flex gap-4 overflow-hidden p-4">
                    {row.posts.thumbnail_path && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={row.posts.thumbnail_path}
                        alt=""
                        className="size-20 shrink-0 rounded-lg object-cover"
                      />
                    )}
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <TierBadge level={row.posts.min_tier_level as 1 | 2 | 3} />
                        <span className="truncate text-xs text-fg-muted">
                          {row.posts.coaches?.display_name}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                        {row.posts.title}
                      </p>
                      {row.posts.body && (
                        <p className="line-clamp-2 text-xs leading-relaxed text-fg-secondary">
                          {row.posts.body}
                        </p>
                      )}
                    </div>
                  </Card>
                ) : null,
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

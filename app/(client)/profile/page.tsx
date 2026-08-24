import { requireUser } from "@/lib/queries/auth";
import { createClient } from "@/lib/supabase/server";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/shared/tier-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CreditCard } from "lucide-react";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(0)}`;
}

export default async function ProfilePage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: subscriptions } = await supabase
    .from("subscriptions")
    .select("id, status, current_period_end, coaches(display_name, handle), tiers(level, name, price_cents)")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarImage src={user.profile.avatar_url ?? undefined} alt="" />
          <AvatarFallback className="text-lg">{user.profile.full_name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-xl font-semibold tracking-[-0.01em] text-foreground">
            {user.profile.full_name}
          </h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Subscriptions
        </h2>

        {!subscriptions?.length ? (
          <EmptyState
            icon={CreditCard}
            title="No subscriptions"
            description="You're not subscribed to any coaches yet."
          />
        ) : (
          subscriptions.map((sub) => (
            <Card key={sub.id} className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">{sub.coaches?.display_name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    {sub.tiers && <TierBadge level={sub.tiers.level as 1 | 2 | 3} />}
                    <span className="text-sm text-muted-foreground">
                      {sub.tiers && `${formatCents(sub.tiers.price_cents)}/mo`}
                    </span>
                  </div>
                </div>
                <span
                  className={`text-xs font-medium ${
                    sub.status === "active" ? "text-success" : "text-muted-foreground"
                  }`}
                >
                  {sub.status}
                </span>
              </div>

              {sub.current_period_end && (
                <p className="text-xs text-muted-foreground">
                  Renews{" "}
                  {new Date(sub.current_period_end).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}

              <div className="flex gap-2">
                <Button size="sm" variant="secondary" disabled>
                  Change tier
                </Button>
                <Button size="sm" variant="ghost" disabled>
                  Cancel
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Billing management isn&apos;t connected yet.
              </p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

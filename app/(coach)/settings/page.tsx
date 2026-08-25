import { requireCoach } from "@/lib/queries/auth";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettingsForm } from "@/components/coach/profile-settings-form";
import { TiersSettings } from "@/components/coach/tiers-settings";

export default async function SettingsPage() {
  const user = await requireCoach();
  const supabase = await createClient();

  const { data: tiers } = await supabase
    .from("tiers")
    .select("*")
    .eq("coach_id", user.id)
    .order("level");

  return (
    <div className="space-y-6">
      <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-foreground">
        Settings
      </h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="tiers">Tiers</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="max-w-lg pt-6">
          <ProfileSettingsForm
            userId={user.id}
            displayName={user.profile.coaches.display_name}
            headline={user.profile.coaches.headline}
            bio={user.profile.coaches.bio}
            avatarUrl={user.profile.avatar_url}
            coverImageUrl={user.profile.coaches.cover_image_url}
          />
        </TabsContent>

        <TabsContent value="tiers" className="max-w-lg space-y-4 pt-6">
          <TiersSettings tiers={tiers ?? []} />
        </TabsContent>

        <TabsContent value="payments" className="max-w-lg pt-6">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">
              Running in demo mode
            </p>
            <p className="mt-1 text-sm text-fg-secondary">
              This build ships without a payment processor on purpose. Visitors
              can subscribe to any tier instantly and free, so the tier-gating
              is fully explorable — no card, no checkout, no real money.
            </p>
            <p className="mt-2 text-sm text-fg-muted">
              Wiring Stripe Connect here would replace the demo grant with a
              checkout session and a webhook; the subscriptions table already
              has the shape for it.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

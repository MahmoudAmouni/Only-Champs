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
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
            <p className="text-sm font-medium text-foreground">
              Payments aren&apos;t connected yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Stripe Connect onboarding lands in a later phase of this build. Your
              storefront and tiers are visible now, but checkout isn&apos;t live.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

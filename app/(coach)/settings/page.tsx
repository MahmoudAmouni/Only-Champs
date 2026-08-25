import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { requireCoach } from "@/lib/queries/auth";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProfileSettingsForm } from "@/components/coach/profile-settings-form";
import { TiersSettings } from "@/components/coach/tiers-settings";
import { StorefrontSettings } from "@/components/coach/storefront-settings";

export default async function SettingsPage() {
  const user = await requireCoach();
  const supabase = await createClient();

  const coach = user.profile.coaches;

  const [{ data: tiers }, { count: activeClients }] = await Promise.all([
    supabase.from("tiers").select("*").eq("coach_id", user.id).order("level"),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("coach_id", user.id)
      .in("status", ["active", "trialing"]),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[30px] font-semibold tracking-[-0.025em] text-foreground">
            Settings
          </h1>
          <p className="mt-1.5 text-sm text-fg-secondary">
            Your public storefront, your pricing, and how clients find you.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
              coach.is_published
                ? "border-success/40 bg-success/10 text-success"
                : "border-warning/40 bg-warning/10 text-warning"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                coach.is_published ? "bg-success" : "bg-warning"
              }`}
            />
            {coach.is_published ? "Live" : "Not published"}
          </span>

          <Button
            variant="secondary"
            size="sm"
            className="group"
            render={<Link href={`/c/${coach.handle}`} target="_blank" />}
            nativeButton={false}
          >
            View storefront
            <ExternalLink className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="tiers">Pricing</TabsTrigger>
          <TabsTrigger value="storefront">Storefront</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="pt-6">
          <ProfileSettingsForm
            userId={user.id}
            displayName={coach.display_name}
            headline={coach.headline}
            bio={coach.bio}
            avatarUrl={user.profile.avatar_url}
            coverImageUrl={coach.cover_image_url}
            specialties={coach.specialties ?? []}
          />
        </TabsContent>

        <TabsContent value="tiers" className="pt-6">
          <TiersSettings tiers={tiers ?? []} activeClients={activeClients ?? 0} />
        </TabsContent>

        <TabsContent value="storefront" className="pt-6">
          <StorefrontSettings
            handle={coach.handle}
            isPublished={coach.is_published}
            hasTiers={(tiers ?? []).some((t) => t.is_active)}
          />
        </TabsContent>

        <TabsContent value="payments" className="max-w-2xl pt-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <p className="text-base font-medium text-foreground">
              Running in demo mode
            </p>
            <p className="mt-2 text-sm leading-relaxed text-fg-secondary">
              This build ships without a payment processor on purpose. Visitors
              can subscribe to any tier instantly and free, so the tier gating
              is fully explorable — no card, no checkout, no real money.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-fg-muted">
              Wiring Stripe Connect here would replace the demo grant with a
              checkout session and a webhook; the subscriptions table already
              has the columns for it.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

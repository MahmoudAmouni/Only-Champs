import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Users } from "lucide-react";
import { getStorefront } from "@/lib/queries/storefront";
import { getCurrentUser } from "@/lib/queries/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TierCard } from "@/components/client/tier-card";
import { LockedOverlay } from "@/components/shared/locked-overlay";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const storefront = await getStorefront(handle);
  if (!storefront) return { title: "OnlyChamps" };

  return {
    title: `${storefront.coach.display_name} — OnlyChamps`,
    description: storefront.coach.headline ?? undefined,
    openGraph: {
      images: storefront.coach.cover_image_url
        ? [storefront.coach.cover_image_url]
        : [],
    },
  };
}

export default async function StorefrontPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const storefront = await getStorefront(handle);
  if (!storefront) notFound();

  const { coach, tiers, previews, activeClientCount, currentSubscription } =
    storefront;

  // Signed-out visitors get routed through signup first; signed-in ones
  // subscribe in place.
  const isSignedIn = !!(await getCurrentUser());

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ------------------------------------------------------------- hero */}
      <div className="relative h-[340px] overflow-hidden sm:h-[400px]">
        {coach.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coach.cover_image_url}
            alt=""
            aria-hidden
            className="h-full w-full scale-105 object-cover"
          />
        )}
        {/* Layered scrims: darken for text legibility over any photo, then
            fade cleanly into the page background. */}
        <div className="absolute inset-0 bg-background/35" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="relative mx-auto max-w-3xl px-6">
        <div className="animate-fade-up -mt-20">
          <Avatar className="size-28 shadow-2xl ring-4 ring-background">
            <AvatarImage src={coach.profiles?.avatar_url ?? undefined} alt="" />
            <AvatarFallback className="text-2xl">
              {coach.display_name[0]}
            </AvatarFallback>
          </Avatar>

          <h1 className="mt-5 font-display text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-foreground sm:text-[48px]">
            {coach.display_name}
          </h1>

          {coach.headline && (
            <p className="mt-2.5 max-w-[60ch] text-lg leading-relaxed text-fg-secondary">
              {coach.headline}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {coach.specialties?.map((s) => (
              <Badge key={s} variant="secondary" className="rounded-full">
                {s}
              </Badge>
            ))}
            {activeClientCount >= 5 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-0.5 text-xs text-fg-secondary">
                <Users className="size-3 text-volt-500" />
                <span className="font-semibold tabular-nums text-foreground">
                  {activeClientCount}
                </span>
                active clients
              </span>
            )}
          </div>
        </div>

        {currentSubscription && (
          <div className="animate-scale-in mt-8 flex items-center justify-between gap-4 rounded-lg border border-success/30 bg-success/[0.08] p-4">
            <p className="text-sm text-foreground">
              You&apos;re subscribed at level {currentSubscription.tierLevel}.
            </p>
            <Button
              size="sm"
              variant="secondary"
              render={<Link href="/feed" />}
              nativeButton={false}
              className="group shrink-0"
            >
              Go to feed
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Button>
          </div>
        )}

        {/* ---------------------------------------------------------- pricing */}
        {!currentSubscription && tiers.length > 0 && (
          <section id="pricing" className="mt-14 scroll-mt-24">
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
                Membership
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.025em] text-foreground">
                Choose your level
              </h2>
            </div>
            <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-3">
              {tiers.map((tier) => (
                <TierCard
                  key={tier.id}
                  id={tier.id}
                  level={tier.level as 1 | 2 | 3}
                  name={tier.name}
                  priceCents={tier.price_cents}
                  description={tier.description}
                  features={tier.features}
                  recommended={tier.level === 2}
                  isCurrentTier={false}
                  handle={coach.handle}
                  isSignedIn={isSignedIn}
                />
              ))}
            </div>
          </section>
        )}

        {/* ----------------------------------------------------------- posts */}
        {previews.length > 0 && (
          <section className="mt-14">
            <div className="mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
                Inside the membership
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.025em] text-foreground">
                Recent posts
              </h2>
            </div>
            <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-2">
              {previews.map((post) => (
                <LockedOverlay
                  key={post.id}
                  title={post.title}
                  mediaType={post.media_type}
                  durationSeconds={post.duration_seconds}
                  thumbnailUrl={post.thumbnail_path}
                  requiredTier={post.min_tier_level as 1 | 2 | 3}
                  requiredTierPriceCents={
                    tiers.find((t) => t.level === post.min_tier_level)
                      ?.price_cents ?? 0
                  }
                  storefrontHandle={coach.handle}
                />
              ))}
            </div>
          </section>
        )}

        {/* ----------------------------------------------------------- about */}
        {coach.bio && (
          <section className="mt-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
              About
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-[-0.025em] text-foreground">
              Meet {coach.display_name.split(" ")[0]}
            </h2>
            <p className="mt-4 max-w-[68ch] text-base leading-[1.75] text-fg-secondary">
              {coach.bio}
            </p>
          </section>
        )}
      </div>

      {/* Sticky mobile CTA — the storefront gets pasted into Instagram bios,
          so the phone path to checkout has to be one tap from anywhere. */}
      {!currentSubscription && tiers.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/85 p-4 backdrop-blur-xl sm:hidden">
          <Button
            size="lg"
            className="glow-volt w-full"
            render={<Link href="#pricing" />}
            nativeButton={false}
          >
            Subscribe from ${(tiers[0].price_cents / 100).toFixed(0)}/mo
          </Button>
        </div>
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getStorefront } from "@/lib/queries/storefront";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
      images: storefront.coach.cover_image_url ? [storefront.coach.cover_image_url] : [],
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

  const { coach, tiers, previews, activeClientCount, currentSubscription } = storefront;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative h-80 overflow-hidden">
        {coach.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coach.cover_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="mx-auto max-w-3xl px-6">
        <Avatar className="-mt-12 size-24 border-4 border-background">
          <AvatarImage src={coach.profiles?.avatar_url ?? undefined} alt="" />
          <AvatarFallback className="text-xl">{coach.display_name[0]}</AvatarFallback>
        </Avatar>

        <h1 className="mt-4 font-display text-[36px] font-bold tracking-[-0.02em] text-foreground">
          {coach.display_name}
        </h1>
        {coach.headline && (
          <p className="mt-1 max-w-[68ch] text-lg text-muted-foreground">{coach.headline}</p>
        )}

        {coach.specialties?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {coach.specialties.map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        )}

        {activeClientCount >= 5 && (
          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{activeClientCount}</span> active
            clients
          </p>
        )}

        {currentSubscription && (
          <div className="mt-6 rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-foreground">
            You&apos;re subscribed at level {currentSubscription.tierLevel}.{" "}
            <a href="/feed" className="font-medium underline underline-offset-4">
              Go to your feed
            </a>
          </div>
        )}

        {!currentSubscription && tiers.length > 0 && (
          <section id="pricing" className="mt-10 scroll-mt-24">
            <h2 className="text-2xl font-semibold tracking-[-0.01em] text-foreground">Pricing</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {tiers.map((tier) => (
                <TierCard
                  key={tier.id}
                  level={tier.level as 1 | 2 | 3}
                  name={tier.name}
                  priceCents={tier.price_cents}
                  description={tier.description}
                  features={tier.features}
                  recommended={tier.level === 2}
                  isCurrentTier={false}
                  handle={coach.handle}
                />
              ))}
            </div>
          </section>
        )}

        {previews.length > 0 && (
          <section className="mt-10">
            <h2 className="text-2xl font-semibold tracking-[-0.01em] text-foreground">
              Recent posts
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {previews.map((post) => (
                <LockedOverlay
                  key={post.id}
                  title={post.title}
                  mediaType={post.media_type}
                  durationSeconds={post.duration_seconds}
                  thumbnailUrl={post.thumbnail_path}
                  requiredTier={post.min_tier_level as 1 | 2 | 3}
                  requiredTierPriceCents={
                    tiers.find((t) => t.level === post.min_tier_level)?.price_cents ?? 0
                  }
                  storefrontHandle={coach.handle}
                />
              ))}
            </div>
          </section>
        )}

        {coach.bio && (
          <section className="mt-10">
            <h2 className="text-2xl font-semibold tracking-[-0.01em] text-foreground">About</h2>
            <p className="mt-4 max-w-[68ch] text-base leading-6 text-muted-foreground">
              {coach.bio}
            </p>
          </section>
        )}
      </div>

      {!currentSubscription && tiers.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background p-4 sm:hidden">
          <a
            href="#pricing"
            className="flex h-11 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground"
          >
            Subscribe from ${(tiers[0].price_cents / 100).toFixed(0)}
          </a>
        </div>
      )}
    </div>
  );
}

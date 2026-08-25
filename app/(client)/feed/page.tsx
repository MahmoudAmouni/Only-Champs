import Link from "next/link";
import { requireUser } from "@/lib/queries/auth";
import { getMySubscribedCoaches, getFeedForCoach } from "@/lib/queries/feed";
import { UnlockedPostCard } from "@/components/client/unlocked-post-card";
import { LockedOverlay } from "@/components/shared/locked-overlay";
import { EmptyState } from "@/components/shared/empty-state";
import { Rss } from "lucide-react";

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ coach?: string }>;
}) {
  const user = await requireUser();
  const { coach: coachParam } = await searchParams;

  const subscribedCoaches = await getMySubscribedCoaches(user.id);

  if (!subscribedCoaches.length) {
    return (
      <EmptyState
        icon={Rss}
        title="No subscriptions yet"
        description="Once you subscribe to a coach, their content shows up here."
      />
    );
  }

  const activeCoach =
    subscribedCoaches.find((c) => c.id === coachParam) ?? subscribedCoaches[0];
  const posts = await getFeedForCoach(activeCoach.id);

  return (
    <div className="space-y-4">
      {subscribedCoaches.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {subscribedCoaches.map((c) => (
            <Link
              key={c.id}
              href={`/feed?coach=${c.id}`}
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
                c.id === activeCoach.id
                  ? "border-primary bg-accent text-foreground"
                  : "border-border text-muted-foreground"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {!posts.length ? (
        <EmptyState
          icon={Rss}
          title="No posts yet"
          description={`${activeCoach.name} hasn't published anything yet.`}
        />
      ) : (
        <div className="space-y-4">
          {posts.map((post) =>
            post.full ? (
              <UnlockedPostCard
                key={post.id}
                title={post.title}
                body={post.full.body}
                mediaType={post.media_type}
                mediaUrl={post.full.media_path}
                thumbnailUrl={post.thumbnail_path}
                durationSeconds={post.duration_seconds}
                tierLevel={post.min_tier_level as 1 | 2 | 3}
                publishedAt={post.published_at}
              />
            ) : (
              <LockedOverlay
                key={post.id}
                title={post.title}
                mediaType={post.media_type}
                durationSeconds={post.duration_seconds}
                thumbnailUrl={post.thumbnail_path}
                requiredTier={post.min_tier_level as 1 | 2 | 3}
                requiredTierPriceCents={post.requiredTierPriceCents}
                storefrontHandle={activeCoach.handle}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}

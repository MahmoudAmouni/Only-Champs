import Link from "next/link";
import { requireCoach } from "@/lib/queries/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TierBadge } from "@/components/shared/tier-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PostActions } from "@/components/coach/post-actions";
import { ImageIcon } from "lucide-react";

export default async function ContentPage() {
  const coach = await requireCoach();
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, media_type, min_tier_level, thumbnail_path, published_at, created_at")
    .eq("coach_id", coach.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-foreground">
          Content
        </h1>
        <Button render={<Link href="/content/new" />} nativeButton={false}>
          New post
        </Button>
      </div>

      {!posts?.length ? (
        <EmptyState
          icon={ImageIcon}
          title="No posts yet"
          description="Publish your first post to start filling your clients' feed."
          action={<Button render={<Link href="/content/new" />} nativeButton={false}>
          New post
        </Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden p-0">
              <div className="flex h-32 items-center justify-center bg-muted">
                {post.thumbnail_path ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={post.thumbnail_path} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="size-6 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between">
                  <TierBadge level={post.min_tier_level as 1 | 2 | 3} />
                  {!post.published_at && (
                    <span className="text-xs font-medium text-muted-foreground">Draft</span>
                  )}
                </div>
                <p className="line-clamp-2 text-sm font-medium text-foreground">{post.title}</p>
                <PostActions postId={post.id} isDraft={!post.published_at} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";

export async function getMySubscribedCoaches(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("coach_id, coaches(handle, display_name)")
    .eq("client_id", userId)
    .in("status", ["active", "trialing"]);

  return (data ?? [])
    .filter((s) => s.coaches)
    .map((s) => ({ id: s.coach_id, handle: s.coaches!.handle, name: s.coaches!.display_name }));
}

/**
 * The core tier-gate demonstration. Fetches locked-safe metadata for
 * every published post (post_previews, no tier filter) and the full rows
 * RLS actually allows (posts, tier-filtered by Postgres itself). A post
 * renders unlocked only if it made it into the second query — the body
 * of a locked post never leaves the database. See docs/01-DATABASE.md §7.
 */
export async function getFeedForCoach(coachId: string, viewerId: string) {
  const supabase = await createClient();

  const { data: previews } = await supabase
    .from("post_previews")
    .select("*")
    .eq("coach_id", coachId)
    .order("published_at", { ascending: false });

  const { data: fullPosts } = await supabase
    .from("posts")
    .select("id, body, media_path")
    .eq("coach_id", coachId)
    .not("published_at", "is", null);

  const { data: tiers } = await supabase
    .from("tiers")
    .select("level, price_cents")
    .eq("coach_id", coachId);

  // Engagement for this viewer. Likes come from the aggregate view rather
  // than counting rows here, and the viewer's own like/save state is two
  // narrow lookups keyed on the posts already fetched.
  const postIds = (previews ?? []).map((p) => p.id);

  const [{ data: likeCounts }, { data: myLikes }, { data: mySaves }] =
    await Promise.all([
      supabase.from("post_like_counts").select("post_id, like_count").in("post_id", postIds),
      supabase.from("post_likes").select("post_id").eq("client_id", viewerId).in("post_id", postIds),
      supabase.from("saved_posts").select("post_id").eq("client_id", viewerId).in("post_id", postIds),
    ]);

  const fullById = new Map((fullPosts ?? []).map((p) => [p.id, p]));
  const priceByLevel = new Map((tiers ?? []).map((t) => [t.level, t.price_cents]));
  const countById = new Map((likeCounts ?? []).map((c) => [c.post_id, c.like_count]));
  const likedIds = new Set((myLikes ?? []).map((l) => l.post_id));
  const savedIds = new Set((mySaves ?? []).map((sv) => sv.post_id));

  return (previews ?? []).map((preview) => ({
    ...preview,
    full: fullById.get(preview.id) ?? null,
    requiredTierPriceCents: priceByLevel.get(preview.min_tier_level) ?? 0,
    likeCount: countById.get(preview.id) ?? 0,
    liked: likedIds.has(preview.id),
    saved: savedIds.has(preview.id),
  }));
}

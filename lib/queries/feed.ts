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
export async function getFeedForCoach(coachId: string) {
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

  const fullById = new Map((fullPosts ?? []).map((p) => [p.id, p]));
  const priceByLevel = new Map((tiers ?? []).map((t) => [t.level, t.price_cents]));

  return (previews ?? []).map((preview) => ({
    ...preview,
    full: fullById.get(preview.id) ?? null,
    requiredTierPriceCents: priceByLevel.get(preview.min_tier_level) ?? 0,
  }));
}

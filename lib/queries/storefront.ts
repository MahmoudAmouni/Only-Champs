import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/queries/auth";

export async function getStorefront(handle: string) {
  const supabase = await createClient();

  const { data: coach } = await supabase
    .from("coaches")
    .select("*, tiers(*), profiles(avatar_url)")
    .eq("handle", handle)
    .eq("is_published", true)
    .maybeSingle();

  if (!coach) return null;

  const activeTiers = coach.tiers
    .filter((t) => t.is_active)
    .sort((a, b) => a.level - b.level);

  const { data: previews } = await supabase
    .from("post_previews")
    .select("*")
    .eq("coach_id", coach.id)
    .order("published_at", { ascending: false })
    .limit(6);

  // Counted through coach_stats rather than subscriptions: a signed-out
  // visitor cannot read subscriptions (nor should they), so counting there
  // returned 0 and the social-proof badge never rendered for the audience
  // the storefront exists to convert. See 01-DATABASE.md §7.
  const { data: stats } = await supabase
    .from("coach_stats")
    .select("active_client_count")
    .eq("coach_id", coach.id)
    .maybeSingle();
  const activeClientCount = stats?.active_client_count ?? 0;

  const user = await getCurrentUser();
  let currentSubscription: { tierLevel: number } | null = null;
  if (user) {
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("tiers(level)")
      .eq("coach_id", coach.id)
      .eq("client_id", user.id)
      .in("status", ["active", "trialing"])
      .maybeSingle();
    if (sub?.tiers) currentSubscription = { tierLevel: sub.tiers.level };
  }

  return {
    coach,
    tiers: activeTiers,
    previews: previews ?? [],
    activeClientCount: activeClientCount ?? 0,
    currentSubscription,
  };
}

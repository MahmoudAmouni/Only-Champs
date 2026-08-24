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

  const { count: activeClientCount } = await supabase
    .from("subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("coach_id", coach.id)
    .in("status", ["active", "trialing"]);

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

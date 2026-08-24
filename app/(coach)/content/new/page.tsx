import { requireCoach } from "@/lib/queries/auth";
import { createClient } from "@/lib/supabase/server";
import { PostComposer } from "@/components/coach/post-composer";

export default async function NewPostPage() {
  const coach = await requireCoach();
  const supabase = await createClient();

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("tier_id, tiers(level)")
    .eq("coach_id", coach.id)
    .in("status", ["active", "trialing"]);

  const levels = (subs ?? []).map((s) => s.tiers?.level).filter((l): l is number => !!l);

  // A post at min_tier_level N is visible to every subscriber whose tier
  // is N or higher.
  const visibleCount = (minLevel: number) => levels.filter((l) => l >= minLevel).length;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-foreground">
        New post
      </h1>
      <PostComposer userId={coach.id} visibleCounts={{ 1: visibleCount(1), 2: visibleCount(2), 3: visibleCount(3) }} />
    </div>
  );
}

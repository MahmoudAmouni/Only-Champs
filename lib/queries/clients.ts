import { createClient } from "@/lib/supabase/server";

export async function getClientsForCoach(coachId: string) {
  const supabase = await createClient();

  const { data: subs } = await supabase
    .from("subscriptions")
    .select(
      "id, status, created_at, client_id, profiles(id, full_name, avatar_url), tiers(level, price_cents)"
    )
    .eq("coach_id", coachId)
    .order("created_at", { ascending: false });

  if (!subs?.length) return [];

  const clientIds = subs.map((s) => s.client_id);

  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("client_id, week_of, adherence_pct")
    .in("client_id", clientIds)
    .order("week_of", { ascending: false });

  const { data: lastWorkouts } = await supabase
    .from("workout_logs")
    .select("client_id, started_at")
    .in("client_id", clientIds)
    .order("started_at", { ascending: false });

  const latestCheckIn = new Map<string, { adherence_pct: number | null }>();
  for (const c of checkIns ?? []) {
    if (!latestCheckIn.has(c.client_id)) latestCheckIn.set(c.client_id, c);
  }

  const latestWorkout = new Map<string, string>();
  for (const w of lastWorkouts ?? []) {
    if (!latestWorkout.has(w.client_id)) latestWorkout.set(w.client_id, w.started_at);
  }

  return subs
    .filter((s) => s.profiles && s.tiers)
    .map((s) => {
      const lastActive = latestWorkout.get(s.client_id);
      const daysSinceActive = lastActive
        ? Math.floor((Date.now() - new Date(lastActive).getTime()) / 86_400_000)
        : null;

      return {
        subscriptionId: s.id,
        clientId: s.client_id,
        name: s.profiles!.full_name,
        avatarUrl: s.profiles!.avatar_url,
        tierLevel: s.tiers!.level as 1 | 2 | 3,
        mrrCents: s.tiers!.price_cents,
        status: s.status,
        joinedAt: s.created_at,
        adherencePct: latestCheckIn.get(s.client_id)?.adherence_pct ?? null,
        daysSinceActive,
        atRisk: daysSinceActive === null || daysSinceActive >= 7,
      };
    });
}

export async function getClientDetail(coachId: string, clientId: string) {
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("id, status, created_at, tiers(level, name, price_cents), profiles(id, full_name, avatar_url, bio)")
    .eq("coach_id", coachId)
    .eq("client_id", clientId)
    .maybeSingle();

  if (!sub) return null;

  const { data: checkIns } = await supabase
    .from("check_ins")
    .select("*")
    .eq("client_id", clientId)
    .eq("coach_id", coachId)
    .order("week_of", { ascending: false });

  const { data: workoutLogs } = await supabase
    .from("workout_logs")
    .select("id, started_at, completed_at")
    .eq("client_id", clientId)
    .order("started_at", { ascending: false })
    .limit(20);

  const { data: program } = await supabase
    .from("programs")
    .select("id, name, duration_weeks")
    .eq("coach_id", coachId)
    .eq("client_id", clientId)
    .maybeSingle();

  return { sub, checkIns: checkIns ?? [], workoutLogs: workoutLogs ?? [], program };
}

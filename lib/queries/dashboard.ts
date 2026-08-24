import { createClient } from "@/lib/supabase/server";

export async function getDashboardStats(coachId: string) {
  const supabase = await createClient();

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("client_id, status, created_at, tiers(level, price_cents)")
    .eq("coach_id", coachId)
    .in("status", ["active", "trialing"]);

  const activeSubs = (subs ?? []).filter((s) => s.tiers);
  const mrrCents = activeSubs.reduce((sum, s) => sum + s.tiers!.price_cents, 0);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 86_400_000);
  const newThisMonth = activeSubs.filter((s) => new Date(s.created_at) >= thirtyDaysAgo).length;

  const clientIds = activeSubs.map((s) => s.client_id);

  const { data: lastWorkouts } = await supabase
    .from("workout_logs")
    .select("client_id, started_at")
    .in("client_id", clientIds.length ? clientIds : [""])
    .order("started_at", { ascending: false });

  const latestByClient = new Map<string, string>();
  for (const w of lastWorkouts ?? []) {
    if (!latestByClient.has(w.client_id)) latestByClient.set(w.client_id, w.started_at);
  }
  const atRiskCount = activeSubs.filter((s) => {
    const last = latestByClient.get(s.client_id);
    if (!last) return true;
    return Date.now() - new Date(last).getTime() >= 7 * 86_400_000;
  }).length;

  const { count: awaitingReplyCount } = await supabase
    .from("check_ins")
    .select("id", { count: "exact", head: true })
    .eq("coach_id", coachId)
    .is("coach_reply", null);

  // Cumulative MRR at the end of each of the last 6 months — a real
  // computation from actual subscription start dates (backdated in
  // supabase/seed.ts specifically so this has a genuine trend to plot,
  // not a flat line from everyone joining in the same instant).
  const revenueByMonth: { month: string; mrr: number }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
    const centsAtMonthEnd = activeSubs
      .filter((s) => new Date(s.created_at) <= monthEnd)
      .reduce((sum, s) => sum + s.tiers!.price_cents, 0);
    revenueByMonth.push({
      month: monthEnd.toLocaleDateString(undefined, { month: "short" }),
      mrr: centsAtMonthEnd / 100,
    });
  }

  const tierCounts = { 1: 0, 2: 0, 3: 0 };
  for (const s of activeSubs) tierCounts[s.tiers!.level as 1 | 2 | 3]++;

  return {
    mrrCents,
    activeClientCount: activeSubs.length,
    newThisMonth,
    atRiskCount,
    awaitingReplyCount: awaitingReplyCount ?? 0,
    revenueByMonth,
    tierCounts,
  };
}

export async function getAtRiskClients(coachId: string) {
  const supabase = await createClient();

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("client_id, profiles(full_name, avatar_url)")
    .eq("coach_id", coachId)
    .in("status", ["active", "trialing"]);

  const clientIds = (subs ?? []).map((s) => s.client_id);
  if (!clientIds.length) return [];

  const { data: lastWorkouts } = await supabase
    .from("workout_logs")
    .select("client_id, started_at")
    .in("client_id", clientIds)
    .order("started_at", { ascending: false });

  const latestByClient = new Map<string, string>();
  for (const w of lastWorkouts ?? []) {
    if (!latestByClient.has(w.client_id)) latestByClient.set(w.client_id, w.started_at);
  }

  return (subs ?? [])
    .filter((s) => s.profiles)
    .map((s) => {
      const last = latestByClient.get(s.client_id);
      const daysSince = last ? Math.floor((Date.now() - new Date(last).getTime()) / 86_400_000) : null;
      return { clientId: s.client_id, name: s.profiles!.full_name, avatarUrl: s.profiles!.avatar_url, daysSince };
    })
    .filter((c) => c.daysSince === null || c.daysSince >= 7)
    .sort((a, b) => (b.daysSince ?? 999) - (a.daysSince ?? 999));
}

export async function getRecentCheckIns(coachId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("check_ins")
    .select("id, week_of, weight_kg, adherence_pct, coach_reply, profiles(full_name)")
    .eq("coach_id", coachId)
    .order("created_at", { ascending: false })
    .limit(5);
  return data ?? [];
}

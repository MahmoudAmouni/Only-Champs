import { createClient } from "@/lib/supabase/server";

export async function getConversationsForCoach(coachId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("conversations")
    .select("id, type, title, last_message_at, client_id, profiles(full_name, avatar_url)")
    .eq("coach_id", coachId)
    .order("last_message_at", { ascending: false, nullsFirst: false });
  return data ?? [];
}

export async function getConversationMessages(conversationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("id, sender_id, body, created_at, profiles(full_name)")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

/**
 * Client's own thread with their coach — direct if they hold level 3,
 * group if level 2. Returns null (not an error) for level 1, so the
 * page can render the upsell card instead of a dead end.
 *
 * A client can subscribe to more than one coach (the feed has a switcher
 * for exactly that), so this deliberately does not assume a single row —
 * maybeSingle() here would throw for anyone with two subscriptions. Chat
 * has no coach switcher yet, so it resolves to the highest tier held,
 * which is the thread with the most access behind it.
 */
export async function getClientConversation(clientId: string) {
  const supabase = await createClient();

  const { data: subs } = await supabase
    .from("subscriptions")
    .select("coach_id, tiers(level)")
    .eq("client_id", clientId)
    .in("status", ["active", "trialing"]);

  const sub = (subs ?? [])
    .filter((s) => s.tiers)
    .sort((a, b) => b.tiers!.level - a.tiers!.level)[0];

  if (!sub?.tiers) return { conversation: null, tierLevel: 0 as const, coachId: null };
  const tierLevel = sub.tiers.level;

  if (tierLevel === 1) return { conversation: null, tierLevel, coachId: sub.coach_id };

  if (tierLevel === 3) {
    const { data: convo } = await supabase
      .from("conversations")
      .select("id")
      .eq("coach_id", sub.coach_id)
      .eq("client_id", clientId)
      .eq("type", "direct")
      .maybeSingle();
    return { conversation: convo, tierLevel, coachId: sub.coach_id };
  }

  // level 2 — the shared group thread for this coach
  const { data: group } = await supabase
    .from("conversations")
    .select("id")
    .eq("coach_id", sub.coach_id)
    .eq("type", "group")
    .maybeSingle();
  return { conversation: group, tierLevel, coachId: sub.coach_id };
}

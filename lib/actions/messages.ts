"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCoach, requireUser } from "@/lib/queries/auth";

export async function sendMessage(conversationId: string, body: string) {
  const user = await requireUser();
  if (!body.trim()) throw new Error("Message can't be empty.");

  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: body.trim(),
  });
  if (error) throw new Error("Could not send message.");

  revalidatePath("/messages");
  revalidatePath("/chat");
}

/** Direct threads require level 3 — the client-side upsell card is what
 * actually prevents lower tiers from reaching this, but the coach-only
 * conversations INSERT policy is the real enforcement. */
export async function ensureDirectConversation(clientId: string) {
  const coach = await requireCoach();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("coach_id", coach.id)
    .eq("client_id", clientId)
    .eq("type", "direct")
    .maybeSingle();
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ coach_id: coach.id, type: "direct", client_id: clientId })
    .select("id")
    .single();
  if (error || !data) throw new Error("Could not start conversation.");
  return data.id;
}

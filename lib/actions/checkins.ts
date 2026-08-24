"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/queries/auth";

export async function replyToCheckIn(checkInId: string, reply: string) {
  const coach = await requireCoach();
  if (!reply.trim()) throw new Error("Reply can't be empty.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("check_ins")
    .update({ coach_reply: reply.trim(), replied_at: new Date().toISOString() })
    .eq("id", checkInId)
    .eq("coach_id", coach.id);

  if (error) throw new Error("Could not save reply.");
  revalidatePath("/clients");
}

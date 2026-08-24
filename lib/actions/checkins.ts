"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCoach, requireUser } from "@/lib/queries/auth";

function mondayOf(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().slice(0, 10);
}

const CheckInSchema = z.object({
  weightKg: z.coerce.number().min(20).max(400).optional(),
  sleepHours: z.coerce.number().min(0).max(24).optional(),
  adherencePct: z.coerce.number().int().min(0).max(100).optional(),
  energyScore: z.coerce.number().int().min(1).max(10).optional(),
  notes: z.string().max(2000).optional(),
});

export async function submitCheckIn(_prev: { error?: string } | null, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("coach_id")
    .eq("client_id", user.id)
    .in("status", ["active", "trialing"])
    .maybeSingle();
  if (!sub) return { error: "You need an active subscription to check in." };

  const parsed = CheckInSchema.safeParse({
    weightKg: formData.get("weightKg") || undefined,
    sleepHours: formData.get("sleepHours") || undefined,
    adherencePct: formData.get("adherencePct") || undefined,
    energyScore: formData.get("energyScore") || undefined,
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { error } = await supabase.from("check_ins").insert({
    client_id: user.id,
    coach_id: sub.coach_id,
    week_of: mondayOf(new Date()),
    weight_kg: parsed.data.weightKg ?? null,
    sleep_hours: parsed.data.sleepHours ?? null,
    adherence_pct: parsed.data.adherencePct ?? null,
    energy_score: parsed.data.energyScore ?? null,
    notes: parsed.data.notes || null,
  });

  if (error) {
    if (error.code === "23505") return { error: "You already checked in this week." };
    return { error: "Could not submit check-in." };
  }

  revalidatePath("/progress");
  return { error: undefined, ok: true };
}

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

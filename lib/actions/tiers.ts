"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireCoach, requireUser } from "@/lib/queries/auth";

const TierSchema = z.object({
  level: z.coerce.number().int().min(1).max(3),
  name: z.string().min(1).max(60),
  description: z.string().max(500).optional(),
  // Collected in dollars (whole-dollar pricing keeps the form simple);
  // converted to the cents the database stores below.
  priceDollars: z.coerce.number().min(1),
  features: z.string().optional(), // newline-separated
});

/** Creates the tier for this level if it doesn't exist yet, else updates it. */
export async function upsertTier(_prev: { error?: string } | null, formData: FormData) {
  const user = await requireUser();
  const parsed = TierSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { level, name, description, priceDollars, features } = parsed.data;
  const priceCents = Math.round(priceDollars * 100);
  const featureList = (features ?? "")
    .split("\n")
    .map((f) => f.trim())
    .filter(Boolean);

  const supabase = await createClient();
  const { error } = await supabase.from("tiers").upsert(
    {
      coach_id: user.id,
      level,
      name,
      description: description || null,
      price_cents: priceCents,
      features: featureList,
      is_active: true,
    },
    { onConflict: "coach_id,level" }
  );
  if (error) return { error: "Could not save tier." };

  revalidatePath("/onboarding/coach");
  revalidatePath("/settings");
  return { error: undefined, ok: true };
}

export async function deactivateTier(tierId: string) {
  const coach = await requireCoach();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tiers")
    .update({ is_active: false })
    .eq("id", tierId)
    .eq("coach_id", coach.id);
  if (error) throw new Error("Could not deactivate tier.");

  revalidatePath("/settings");
}

export async function reactivateTier(tierId: string) {
  const coach = await requireCoach();
  const supabase = await createClient();
  const { error } = await supabase
    .from("tiers")
    .update({ is_active: true })
    .eq("id", tierId)
    .eq("coach_id", coach.id);
  if (error) throw new Error("Could not reactivate tier.");

  revalidatePath("/settings");
}

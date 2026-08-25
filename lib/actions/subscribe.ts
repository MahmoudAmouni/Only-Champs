"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/queries/auth";

/**
 * Demo-mode subscribe. Grants a tier immediately, with no payment.
 *
 * This project deliberately ships without Stripe (see docs/05-BUILD-ORDER.md
 * — Phase 6 was dropped, not deferred), so something has to write the
 * subscriptions row. In production that job belongs to the Stripe webhook:
 * `subscriptions` has no client INSERT policy precisely so a client can't
 * grant themselves access, which means the write must come from the
 * service role either way. This action plays the webhook's part.
 *
 * The trade-off is explicit: anyone can grant themselves any tier for
 * free. That's intended for a portfolio demo — it's what lets a visitor
 * actually watch locked content unlock — and it is the single reason this
 * app must not be pointed at real customer data.
 */
export async function subscribeDemo(tierId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  // Read the tier through the user's own client so RLS still decides
  // whether this tier is visible to them at all.
  const { data: tier } = await supabase
    .from("tiers")
    .select("id, coach_id, is_active")
    .eq("id", tierId)
    .maybeSingle();

  if (!tier || !tier.is_active) {
    return { error: "That tier isn't available." };
  }

  if (tier.coach_id === user.id) {
    return { error: "You can't subscribe to your own storefront." };
  }

  // Upsert on (client_id, coach_id) so picking a different tier upgrades
  // the existing row rather than creating a second subscription — the
  // same unique constraint the webhook would have relied on.
  const { error } = await supabaseAdmin.from("subscriptions").upsert(
    {
      client_id: user.id,
      coach_id: tier.coach_id,
      tier_id: tier.id,
      status: "active",
      current_period_end: new Date(Date.now() + 30 * 86_400_000).toISOString(),
    },
    { onConflict: "client_id,coach_id" }
  );

  if (error) return { error: "Could not start your subscription." };

  revalidatePath("/feed");
  revalidatePath("/profile");
  revalidatePath("/chat");
  return { ok: true };
}

export async function cancelDemoSubscription(coachId: string) {
  const user = await requireUser();

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .delete()
    .eq("client_id", user.id)
    .eq("coach_id", coachId);

  if (error) return { error: "Could not cancel." };

  revalidatePath("/feed");
  revalidatePath("/profile");
  return { ok: true };
}

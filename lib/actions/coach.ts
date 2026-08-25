"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/queries/auth";

const HANDLE_RE = /^[a-z0-9][a-z0-9_-]{2,29}$/;

export async function checkHandleAvailable(handle: string) {
  if (!HANDLE_RE.test(handle)) {
    return { available: false, reason: "3-30 chars, lowercase letters, numbers, - or _" };
  }
  const supabase = await createClient();
  const { data } = await supabase.from("coaches").select("id").eq("handle", handle).maybeSingle();
  return { available: !data, reason: data ? "That handle is taken" : undefined };
}

/** Step 1 of onboarding: creates the coaches row if it doesn't exist yet. */
export async function saveHandle(_prev: { error?: string } | null, formData: FormData) {
  const user = await requireUser();
  const handle = String(formData.get("handle") ?? "").trim();

  const check = await checkHandleAvailable(handle);
  if (!check.available) return { error: check.reason };

  const supabase = await createClient();
  const { error } = await supabase.from("coaches").upsert(
    {
      id: user.id,
      handle,
      display_name: user.profile.full_name || "New coach",
    },
    { onConflict: "id" }
  );
  if (error) return { error: "Could not save handle. Try another one." };

  revalidatePath("/onboarding/coach");
  return { error: undefined, ok: true };
}

const ProfileSchema = z.object({
  displayName: z.string().min(1, "Enter a display name"),
  headline: z.string().max(140).optional(),
  bio: z.string().max(2000).optional(),
  avatarUrl: z.string().optional(),
  coverImageUrl: z.string().optional(),
});

export async function updateCoachProfile(_prev: { error?: string } | null, formData: FormData) {
  const user = await requireUser();
  const parsed = ProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    headline: formData.get("headline") || undefined,
    bio: formData.get("bio") || undefined,
    avatarUrl: formData.get("avatarUrl") || undefined,
    coverImageUrl: formData.get("coverImageUrl") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { displayName, headline, bio, avatarUrl, coverImageUrl } = parsed.data;

  const { error } = await supabase
    .from("coaches")
    .update({
      display_name: displayName,
      headline: headline ?? null,
      bio: bio ?? null,
      ...(coverImageUrl ? { cover_image_url: coverImageUrl } : {}),
    })
    .eq("id", user.id);
  if (error) return { error: "Could not save profile." };

  if (avatarUrl) {
    await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", user.id);
  }

  revalidatePath("/onboarding/coach");
  revalidatePath("/settings");
  return { error: undefined, ok: true };
}

export async function publishStorefront() {
  const user = await requireUser();
  const supabase = await createClient();
  const { error } = await supabase.from("coaches").update({ is_published: true }).eq("id", user.id);
  if (error) return { error: "Could not publish storefront." };

  revalidatePath("/onboarding/coach");
  revalidatePath("/dashboard");
  return { error: undefined, ok: true };
}

"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireCoach } from "@/lib/queries/auth";

const PostSchema = z.object({
  title: z.string().min(1, "Title is required").max(140),
  body: z.string().max(10_000).optional(),
  minTierLevel: z.coerce.number().int().min(1).max(3),
  mediaPath: z.string().optional(),
  mediaType: z.enum(["text", "image", "video"]),
  publish: z.enum(["true", "false"]),
});

export async function savePost(_prev: { error?: string } | null, formData: FormData) {
  const coach = await requireCoach();
  const parsed = PostSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { title, body, minTierLevel, mediaPath, mediaType, publish } = parsed.data;

  const supabase = await createClient();
  const { error } = await supabase.from("posts").insert({
    coach_id: coach.id,
    title,
    body: body || null,
    min_tier_level: minTierLevel,
    media_path: mediaPath || null,
    thumbnail_path: mediaPath || null,
    media_type: mediaType,
    published_at: publish === "true" ? new Date().toISOString() : null,
  });

  if (error) return { error: "Could not save post." };

  revalidatePath("/content");
  revalidatePath("/feed");
  redirect("/content");
}

export async function deletePost(postId: string) {
  const coach = await requireCoach();
  const supabase = await createClient();
  const { error } = await supabase.from("posts").delete().eq("id", postId).eq("coach_id", coach.id);
  if (error) throw new Error("Could not delete post.");

  revalidatePath("/content");
  revalidatePath("/feed");
}

export async function publishDraft(postId: string) {
  const coach = await requireCoach();
  const supabase = await createClient();
  const { error } = await supabase
    .from("posts")
    .update({ published_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("coach_id", coach.id);
  if (error) throw new Error("Could not publish post.");

  revalidatePath("/content");
  revalidatePath("/feed");
}

/**
 * The only correct way to hand a client gated media. If media_path is
 * already a full URL (seed data — see supabase/seed.ts), pass it straight
 * through; real uploads get a short-lived signed URL instead. See
 * docs/02-BACKEND.md §4.
 */
export async function getSignedMediaUrl(postId: string) {
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("media_path")
    .eq("id", postId)
    .single();

  if (!post?.media_path) return { error: "Not available" };
  if (post.media_path.startsWith("http")) return { url: post.media_path };

  const { data, error } = await supabase.storage
    .from("post-media")
    .createSignedUrl(post.media_path, 60 * 60);

  if (error || !data) return { error: "Could not load media." };
  return { url: data.signedUrl };
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/queries/auth";

/**
 * Likes and saves. Both are plain inserts/deletes under RLS — a client can
 * only act on a post the `posts` policy already lets them read, so there is
 * no entitlement check here to drift out of sync with the one in the
 * database. See supabase/migrations/00012_engagement.sql.
 */

export async function toggleLike(postId: string, liked: boolean) {
  const user = await requireUser();
  const supabase = await createClient();

  if (liked) {
    const { error } = await supabase
      .from("post_likes")
      .delete()
      .eq("post_id", postId)
      .eq("client_id", user.id);
    if (error) return { error: "Could not remove your like." };
  } else {
    const { error } = await supabase
      .from("post_likes")
      .insert({ post_id: postId, client_id: user.id });
    // A duplicate means it was already liked — the desired end state either
    // way, so it is not worth surfacing as a failure.
    if (error && error.code !== "23505") {
      return { error: "Could not save your like." };
    }
  }

  revalidatePath("/feed");
  return { ok: true };
}

export async function toggleSave(postId: string, saved: boolean) {
  const user = await requireUser();
  const supabase = await createClient();

  if (saved) {
    const { error } = await supabase
      .from("saved_posts")
      .delete()
      .eq("post_id", postId)
      .eq("client_id", user.id);
    if (error) return { error: "Could not remove that from saved." };
  } else {
    const { error } = await supabase
      .from("saved_posts")
      .insert({ post_id: postId, client_id: user.id });
    if (error && error.code !== "23505") {
      return { error: "Could not save that post." };
    }
  }

  revalidatePath("/feed");
  revalidatePath("/profile");
  return { ok: true };
}

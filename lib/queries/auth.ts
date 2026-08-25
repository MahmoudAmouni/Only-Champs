import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Cached per-request so calling this from a layout and again from a page
 * costs one query, not several. See docs/02-BACKEND.md §3.
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, coaches(*)")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return { ...user, profile };
});

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireCoach() {
  const user = await requireUser();
  if (!user.profile.coaches) redirect("/onboarding/coach");
  return user as typeof user & {
    profile: typeof user.profile & {
      coaches: NonNullable<typeof user.profile.coaches>;
    };
  };
}

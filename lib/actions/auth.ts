"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const SignUpSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "At least 8 characters"),
  fullName: z.string().min(2, "Enter your name"),
  role: z.enum(["coach", "client"]),
});

export type ActionState = { error?: string } | null;

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = SignUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { email, password, fullName, role } = parsed.data;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect(role === "coach" ? "/onboarding/coach" : "/discover");
}

const SignInSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = SignInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { data: auth, error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) return { error: "Incorrect email or password." };

  revalidatePath("/", "layout");

  // An explicit ?next= wins — it's where the route guard bounced them from.
  const next = formData.get("next");
  if (typeof next === "string" && next.startsWith("/")) redirect(next);

  // Otherwise route by role. Sending everyone to /feed put coaches in the
  // client shell, looking at an empty subscription list — every coach signing
  // in landed on "No subscriptions yet" instead of their own dashboard.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, coaches(id)")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profile?.role === "coach") {
    redirect(profile.coaches ? "/dashboard" : "/onboarding/coach");
  }

  redirect("/feed");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}

export async function signInWithGoogle(next?: string) {
  const supabase = await createClient();
  const redirectTo = new URL("/auth/callback", process.env.NEXT_PUBLIC_APP_URL);
  if (next) redirectTo.searchParams.set("next", next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectTo.toString() },
  });

  if (error || !data.url) redirect("/login?error=oauth");
  redirect(data.url);
}

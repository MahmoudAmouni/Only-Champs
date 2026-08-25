import { redirect } from "next/navigation";
import { requireUser } from "@/lib/queries/auth";
import { createClient } from "@/lib/supabase/server";
import { OnboardingWizard } from "@/components/coach/onboarding-wizard";

export default async function CoachOnboardingPage() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: coach } = await supabase
    .from("coaches")
    .select("*, tiers(*)")
    .eq("id", user.id)
    .maybeSingle();

  if (coach?.is_published) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <OnboardingWizard
        userId={user.id}
        initialFullName={user.profile.full_name}
        initialAvatarUrl={user.profile.avatar_url}
        coach={coach}
      />
    </div>
  );
}

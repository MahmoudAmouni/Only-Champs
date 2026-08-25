import { requireUser } from "@/lib/queries/auth";

/**
 * Placeholder — coach signup redirects here. The real four-step wizard
 * (handle, profile, tiers, payments) is Phase 4 work; see
 * docs/04-FRONTEND.md "/onboarding/coach". This just confirms auth landed.
 */
export default async function CoachOnboardingPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-lg space-y-2 px-6 py-16 text-center">
      <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-foreground">
        Welcome, {user.profile.full_name || user.email}
      </h1>
      <p className="text-muted-foreground">
        The coach onboarding wizard lands in Phase 4 — see
        docs/05-BUILD-ORDER.md.
      </p>
    </div>
  );
}

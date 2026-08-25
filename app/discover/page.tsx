import { requireUser } from "@/lib/queries/auth";

/**
 * Placeholder — signup redirects clients here. A real coach-discovery
 * browse page isn't in the phased plan yet (docs/05-BUILD-ORDER.md notes
 * discovery as a deliberately later feature, once there's real supply of
 * coaches). This just confirms auth landed correctly.
 */
export default async function DiscoverPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-lg space-y-2 px-6 py-16 text-center">
      <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-foreground">
        Welcome, {user.profile.full_name || user.email}
      </h1>
      <p className="text-muted-foreground">
        Coach discovery isn&apos;t built yet. If a coach shared their link with
        you, visit their storefront directly at{" "}
        <code className="text-sm">/c/their-handle</code>.
      </p>
    </div>
  );
}

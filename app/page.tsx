import Link from "next/link";
import { Button } from "@/components/ui/button";

/**
 * Placeholder. The real marketing/landing page is built in Phase 5 per
 * docs/05-BUILD-ORDER.md — this just confirms the app boots and links to
 * the one real page that exists so far.
 */
export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-background px-8 text-center">
      <h1 className="font-display text-[36px] font-bold tracking-[-0.02em] text-foreground">
        OnlyChamps
      </h1>
      <p className="max-w-[48ch] text-muted-foreground">
        A subscription platform for online fitness coaches. Under construction —
        see <code className="text-sm">docs/</code> for the full build plan.
      </p>
      <Button render={<Link href="/styleguide" />} nativeButton={false}>
        View styleguide
      </Button>
    </div>
  );
}

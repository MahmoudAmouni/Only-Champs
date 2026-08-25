import Link from "next/link";
import { Lock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/shared/tier-badge";

const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: "Content members only",
  2: "Group members only",
  3: "1:1 members only",
};

const TIER_BORDER: Record<1 | 2 | 3, string> = {
  1: "hover:border-tier-1/60",
  2: "hover:border-tier-2/60",
  3: "hover:border-tier-3/60",
};

// Tailwind's scanner needs literal class strings, not `text-tier-${n}` —
// an interpolated class never gets generated. See docs/03-DESIGN-SYSTEM.md.
const TIER_TEXT: Record<1 | 2 | 3, string> = {
  1: "text-tier-1",
  2: "text-tier-2",
  3: "text-tier-3",
};

/**
 * The signature component — see docs/03-DESIGN-SYSTEM.md §6. Only the
 * thumbnail is blurred, never the body: the body was never fetched in the
 * first place (RLS drops it before it leaves the database). This is
 * decoration over data the client is already allowed to see, not a
 * security boundary — that boundary is Postgres, not this component.
 */
export function LockedOverlay({
  title,
  mediaType,
  durationSeconds,
  thumbnailUrl,
  requiredTier,
  requiredTierPriceCents,
  storefrontHandle,
}: {
  title: string;
  mediaType: "text" | "image" | "video";
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  requiredTier: 1 | 2 | 3;
  requiredTierPriceCents: number;
  storefrontHandle: string;
}) {
  const price = `$${(requiredTierPriceCents / 100).toFixed(0)}/mo`;

  return (
    <div
      className={`group overflow-hidden rounded-lg border border-border bg-card transition-all hover:-translate-y-0.5 ${TIER_BORDER[requiredTier]}`}
    >
      <div className="relative h-44 overflow-hidden bg-muted">
        {thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt=""
            className="h-full w-full object-cover blur-md brightness-[0.4]"
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
          <Lock className={`size-6 ${TIER_TEXT[requiredTier]}`} />
          <p className="text-sm font-semibold text-foreground">
            {TIER_LABEL[requiredTier]}
          </p>
          <p className="text-xs text-muted-foreground">
            Upgrade to unlock this {mediaType === "video" ? "video" : "post"}
          </p>
          <Button
            size="sm"
            render={<Link href={`/c/${storefrontHandle}#pricing`} />}
            nativeButton={false}
            className="mt-1"
          >
            Upgrade — {price}
          </Button>
        </div>
      </div>

      <div className="space-y-1 p-3">
        <div className="flex items-center gap-2">
          <TierBadge level={requiredTier} />
          {mediaType === "video" && durationSeconds && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Play className="size-3" />
              {Math.floor(durationSeconds / 60)}:{String(durationSeconds % 60).padStart(2, "0")}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-foreground">{title}</p>
      </div>
    </div>
  );
}

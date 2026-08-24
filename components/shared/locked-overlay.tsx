import Link from "next/link";
import { Lock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/shared/tier-badge";

const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: "Content members only",
  2: "Group members only",
  3: "1:1 members only",
};

// Tailwind's scanner needs literal class strings — `text-tier-${n}` never
// gets generated. See docs/03-DESIGN-SYSTEM.md.
const TIER_TEXT: Record<1 | 2 | 3, string> = {
  1: "text-tier-1",
  2: "text-tier-2",
  3: "text-tier-3",
};
const TIER_RING: Record<1 | 2 | 3, string> = {
  1: "ring-tier-1/20 group-hover:ring-tier-1/45",
  2: "ring-tier-2/20 group-hover:ring-tier-2/45",
  3: "ring-tier-3/25 group-hover:ring-tier-3/55",
};
const TIER_GLOW: Record<1 | 2 | 3, string> = {
  1: "from-tier-1/10",
  2: "from-tier-2/10",
  3: "from-tier-3/12",
};

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

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
      className={`lift surface-sheen group relative overflow-hidden rounded-lg border border-border bg-card ring-1 transition-colors ${TIER_RING[requiredTier]}`}
    >
      <div className="relative h-48 overflow-hidden bg-muted">
        {thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={thumbnailUrl}
            alt=""
            aria-hidden
            className="h-full w-full scale-105 object-cover blur-lg brightness-[0.32] saturate-[0.6] transition-all duration-500 group-hover:scale-110 group-hover:brightness-[0.38]"
          />
        )}

        {/* Tier-tinted wash so each level reads distinctly at a glance. */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${TIER_GLOW[requiredTier]} to-transparent`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-5 text-center">
          <span
            className={`flex size-11 items-center justify-center rounded-full bg-background/60 ring-1 backdrop-blur-sm transition-transform duration-300 group-hover:scale-105 ${TIER_RING[requiredTier]}`}
          >
            <Lock className={`size-[18px] ${TIER_TEXT[requiredTier]}`} />
          </span>

          <div>
            <p className="text-sm font-semibold text-foreground">
              {TIER_LABEL[requiredTier]}
            </p>
            <p className="mt-0.5 text-xs text-fg-secondary">
              Upgrade to unlock this {mediaType === "video" ? "video" : "post"}
            </p>
          </div>

          <Button
            size="sm"
            render={<Link href={`/c/${storefrontHandle}#pricing`} />}
            nativeButton={false}
            className="mt-1 transition-transform duration-200 group-hover:scale-[1.03]"
          >
            Upgrade — {price}
          </Button>
        </div>
      </div>

      {/* Title and duration stay sharp: the client should know exactly what
          they're missing — that's what drives the upgrade. */}
      <div className="space-y-1.5 p-3.5">
        <div className="flex items-center gap-2">
          <TierBadge level={requiredTier} />
          {mediaType === "video" && durationSeconds && (
            <span className="flex items-center gap-1 text-xs tabular-nums text-fg-muted">
              <Play className="size-3" />
              {formatDuration(durationSeconds)}
            </span>
          )}
        </div>
        <p className="text-sm font-medium leading-snug text-foreground">
          {title}
        </p>
      </div>
    </div>
  );
}

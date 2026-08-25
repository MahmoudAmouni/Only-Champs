import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Static class strings — Tailwind's scanner can't see interpolated ones.
const BORDER: Record<1 | 2 | 3, string> = {
  1: "border-tier-1/30",
  2: "border-tier-2/30",
  3: "border-tier-3/30",
};
const BORDER_FULL: Record<1 | 2 | 3, string> = {
  1: "border-tier-1",
  2: "border-tier-2",
  3: "border-tier-3",
};
const TEXT: Record<1 | 2 | 3, string> = {
  1: "text-tier-1",
  2: "text-tier-2",
  3: "text-tier-3",
};
const BG: Record<1 | 2 | 3, string> = {
  1: "bg-tier-1",
  2: "bg-tier-2",
  3: "bg-tier-3",
};

export function TierCard({
  level,
  name,
  priceCents,
  description,
  features,
  recommended,
  isCurrentTier,
  handle,
}: {
  level: 1 | 2 | 3;
  name: string;
  priceCents: number;
  description: string | null;
  features: string[];
  recommended: boolean;
  isCurrentTier: boolean;
  handle: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-lg border p-6 transition-transform",
        recommended ? cn(BORDER_FULL[level], "scale-[1.03] bg-elevated") : cn(BORDER[level], "bg-card")
      )}
    >
      {recommended && (
        <span
          className={cn(
            "w-fit rounded-sm px-2 py-0.5 text-xs font-semibold text-primary-foreground",
            BG[level]
          )}
        >
          RECOMMENDED
        </span>
      )}

      <div>
        <p className={cn("text-xs font-semibold uppercase tracking-wider", TEXT[level])}>
          {name}
        </p>
        <p className="mt-1 font-display text-[36px] font-bold leading-[40px] tracking-[-0.02em] text-foreground">
          ${(priceCents / 100).toFixed(0)}
          <span className="text-base font-normal text-muted-foreground"> /month</span>
        </p>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      </div>

      <ul className="flex-1 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-foreground">
            <Check className={cn("mt-0.5 size-4 shrink-0", TEXT[level])} />
            {f}
          </li>
        ))}
      </ul>

      {isCurrentTier ? (
        <Button variant="secondary" disabled className="w-full">
          Your current tier
        </Button>
      ) : (
        <Button
          render={<Link href={`/signup?next=${encodeURIComponent(`/c/${handle}`)}`} />}
          nativeButton={false}
          variant={recommended ? "default" : "secondary"}
          className="w-full"
        >
          Subscribe
        </Button>
      )}
    </div>
  );
}

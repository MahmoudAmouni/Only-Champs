import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Static class strings — Tailwind's scanner can't see interpolated ones.
const BORDER: Record<1 | 2 | 3, string> = {
  1: "border-tier-1/25",
  2: "border-tier-2/25",
  3: "border-tier-3/25",
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
const CHECK_BG: Record<1 | 2 | 3, string> = {
  1: "bg-tier-1/12",
  2: "bg-tier-2/12",
  3: "bg-tier-3/12",
};
const GLOW: Record<1 | 2 | 3, string> = {
  1: "from-tier-1/[0.07]",
  2: "from-tier-2/[0.09]",
  3: "from-tier-3/[0.09]",
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
        "lift surface-sheen relative flex flex-col gap-5 overflow-hidden rounded-lg border bg-card p-6",
        // The featured card is raised by making it physically taller, not by
        // scaling it — a fractional scale on a text-heavy card causes
        // subpixel blur on non-retina displays.
        recommended
          ? "glow-volt border-volt-500/70 lg:-my-3 lg:py-9"
          : cn(BORDER[level], "hover:border-border-strong")
      )}
    >
      {/* Tier-tinted corner wash — gives each card its own identity without
          a heavy coloured background. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent",
          GLOW[level]
        )}
      />

      <div className="relative">
        <div className="flex items-center justify-between">
          <p
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.08em]",
              TEXT[level]
            )}
          >
            {name}
          </p>
          {recommended && (
            <span className="rounded-sm bg-volt-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-volt-ink">
              Popular
            </span>
          )}
        </div>

        <p className="mt-3 font-display text-[40px] font-bold leading-none tracking-[-0.03em] tabular-nums text-foreground">
          ${(priceCents / 100).toFixed(0)}
          <span className="ml-1.5 text-sm font-normal tracking-normal text-fg-muted">
            /month
          </span>
        </p>

        {description && (
          <p className="mt-3 text-sm leading-relaxed text-fg-secondary">
            {description}
          </p>
        )}
      </div>

      <ul className="relative flex-1 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
            <span
              className={cn(
                "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
                CHECK_BG[level]
              )}
            >
              <Check className={cn("size-2.5", TEXT[level])} strokeWidth={3} />
            </span>
            <span className="leading-snug">{f}</span>
          </li>
        ))}
      </ul>

      <div className="relative">
        {isCurrentTier ? (
          <Button variant="secondary" disabled className="w-full">
            <Check className="size-3.5" />
            Your current tier
          </Button>
        ) : (
          <Button
            render={
              <Link href={`/signup?next=${encodeURIComponent(`/c/${handle}`)}`} />
            }
            nativeButton={false}
            variant={recommended ? "default" : "secondary"}
            className={cn(
              "w-full transition-transform duration-200 active:scale-[0.99]",
              recommended && "glow-volt"
            )}
          >
            Subscribe
          </Button>
        )}
      </div>

      {/* Accent rail at the base, keyed to the tier colour. */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-60",
          BG[level]
        )}
      />
    </div>
  );
}

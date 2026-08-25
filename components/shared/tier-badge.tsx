import { cn } from "@/lib/utils";

const TIER_LABEL: Record<1 | 2 | 3, string> = {
  1: "Content",
  2: "Group",
  3: "1:1",
};

const TIER_CLASS: Record<1 | 2 | 3, string> = {
  1: "bg-tier-1/12 text-tier-1 border-tier-1/25",
  2: "bg-tier-2/12 text-tier-2 border-tier-2/25",
  3: "bg-tier-3/12 text-tier-3 border-tier-3/25",
};

/**
 * The single source of truth for tier colour. Every place in the app that
 * displays a tier — badges, locks, pricing cards, charts — goes through
 * this map. See docs/03-DESIGN-SYSTEM.md §2.1 and §6.
 */
export function TierBadge({
  level,
  className,
}: {
  level: 1 | 2 | 3;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center rounded-sm border px-2 text-xs font-medium",
        TIER_CLASS[level],
        className
      )}
    >
      {TIER_LABEL[level]}
    </span>
  );
}

export function tierColorVar(level: 1 | 2 | 3) {
  return `var(--color-tier-${level})`;
}

import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * The dashboard's primary unit — see docs/03-DESIGN-SYSTEM.md §6 and
 * docs/04-FRONTEND.md "/dashboard".
 *
 * `invertPolarity` flips which direction of `delta` counts as good. Use it
 * for metrics where "up" is bad — churn, at-risk count. Getting this wrong
 * (a green rising churn number) is a real bug, not a style nit — check it
 * on every metric you wire up.
 */
export function StatTile({
  label,
  value,
  delta,
  invertPolarity = false,
  accent = false,
  className,
}: {
  label: string;
  value: string;
  delta?: { value: string; direction: "up" | "down" };
  invertPolarity?: boolean;
  accent?: boolean;
  className?: string;
}) {
  const isGood = delta
    ? invertPolarity
      ? delta.direction === "down"
      : delta.direction === "up"
    : null;

  const TrendIcon = delta?.direction === "up" ? TrendingUp : TrendingDown;

  return (
    <div
      className={cn(
        "lift surface-sheen group relative overflow-hidden rounded-lg border border-border bg-card p-5 hover:border-border-strong",
        className
      )}
    >
      {accent && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-volt-500/[0.07] to-transparent"
        />
      )}

      <div className="relative">
        <div className="card-meta text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted opacity-90">
          {label}
        </div>

        <div className="mt-1.5 font-display text-[34px] font-bold leading-[1.1] tracking-[-0.03em] tabular-nums text-foreground">
          {value}
        </div>

        {delta && (
          <div
            className={cn(
              "mt-1.5 flex items-center gap-1 text-xs font-medium",
              isGood ? "text-success" : "text-danger"
            )}
          >
            <TrendIcon className="size-3" />
            <span className="tabular-nums">{delta.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}

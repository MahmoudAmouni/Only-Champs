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
  className,
}: {
  label: string;
  value: string;
  delta?: { value: string; direction: "up" | "down" };
  invertPolarity?: boolean;
  className?: string;
}) {
  const isGood = delta
    ? invertPolarity
      ? delta.direction === "down"
      : delta.direction === "up"
    : null;

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-5",
        className
      )}
    >
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-display text-[36px] font-bold leading-[40px] tracking-[-0.02em] tabular-nums text-foreground">
        {value}
      </div>
      {delta && (
        <div
          className={cn(
            "mt-1 text-xs",
            isGood ? "text-success" : "text-danger"
          )}
        >
          {delta.direction === "up" ? "▲" : "▼"} {delta.value}
        </div>
      )}
    </div>
  );
}

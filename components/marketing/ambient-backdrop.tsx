import { cn } from "@/lib/utils";

/**
 * Ambient hero backdrop: masked grid + drifting colour orbs + film grain.
 * Purely decorative, so it's aria-hidden and pointer-events-none. The grain
 * layer matters more than it sounds — large soft gradients band badly on
 * 8-bit displays and a few percent of noise hides it completely.
 */
export function AmbientBackdrop({
  className,
  variant = "volt",
}: {
  className?: string;
  variant?: "volt" | "cool";
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden grain",
        className
      )}
    >
      <div className="absolute inset-0 bg-grid" />

      {variant === "volt" ? (
        <>
          <div
            className="orb animate-drift"
            style={{
              width: 620,
              height: 620,
              top: "-18%",
              left: "8%",
              background:
                "radial-gradient(circle, var(--oc-volt-500) 0%, transparent 70%)",
              opacity: 0.16,
            }}
          />
          <div
            className="orb animate-drift"
            style={{
              width: 520,
              height: 520,
              top: "6%",
              right: "2%",
              background:
                "radial-gradient(circle, var(--oc-tier-2) 0%, transparent 70%)",
              opacity: 0.14,
              animationDelay: "-8s",
            }}
          />
        </>
      ) : (
        <>
          <div
            className="orb animate-drift"
            style={{
              width: 560,
              height: 560,
              top: "-10%",
              right: "-6%",
              background:
                "radial-gradient(circle, var(--oc-tier-2) 0%, transparent 70%)",
              opacity: 0.18,
            }}
          />
          <div
            className="orb animate-drift"
            style={{
              width: 460,
              height: 460,
              bottom: "-14%",
              left: "-4%",
              background:
                "radial-gradient(circle, var(--oc-volt-500) 0%, transparent 70%)",
              opacity: 0.12,
              animationDelay: "-11s",
            }}
          />
        </>
      )}

      {/* Fade the whole backdrop into the page background at the bottom. */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-background" />
    </div>
  );
}

import { cn } from "@/lib/utils";

/**
 * The OnlyChamps mark: three stacked chevrons.
 *
 * Chevrons are rank insignia, which is what "Champs" means, and they stack
 * the way the tier ladder does — so one shape carries both ideas. The top
 * chevron is volt and the two beneath it recede, reading as the level you
 * are climbing toward.
 *
 * The lower two use currentColor rather than a fixed off-white so the mark
 * survives the light theme, where #F0F4F8 would be invisible. Set the text
 * colour on the parent (text-foreground) and it follows.
 *
 * Geometry is on a 64 grid: rise 11, half-width 16, spacing 15, stroke 8.
 * Equal spacing everywhere means the gap between strokes is constant at any
 * point along them, which is what keeps it clean when it scales down.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden
      className={cn("size-8 text-foreground", className)}
    >
      <path
        d="M16 22 L32 11 L48 22"
        stroke="var(--oc-volt-500)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 37 L32 26 L48 37"
        stroke="currentColor"
        strokeOpacity="0.65"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 52 L32 41 L48 52"
        stroke="currentColor"
        strokeOpacity="0.3"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Mark plus wordmark. The word is real text, not outlines, so it stays
 * crisp at any size and picks up Inter Tight from the theme. */
export function Logo({
  className,
  markClassName,
}: {
  className?: string;
  markClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className={cn("size-7", markClassName)} />
      <span className="font-display text-lg font-bold tracking-[-0.02em] text-foreground">
        OnlyChamps
      </span>
    </span>
  );
}

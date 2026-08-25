import type { LucideIcon } from "lucide-react";

/**
 * Every list needs one of these — see docs/03-DESIGN-SYSTEM.md §6.
 * Never show a blank container.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="animate-scale-in flex flex-col items-center gap-3 rounded-lg border border-dashed border-border py-16 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-muted/60">
        <Icon className="size-6 text-fg-muted" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="max-w-[36ch] text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

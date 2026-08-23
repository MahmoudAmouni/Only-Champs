/** Stand-in for a screen not yet built — see docs/05-BUILD-ORDER.md for the phase. */
export function PlaceholderPage({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <div className="space-y-2">
      <h1 className="text-[30px] font-semibold leading-9 tracking-[-0.02em] text-foreground">
        {title}
      </h1>
      <p className="max-w-[68ch] text-muted-foreground">{description}</p>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {phase}
      </p>
    </div>
  );
}

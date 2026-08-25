const BG: Record<1 | 2 | 3, string> = {
  1: "bg-tier-1",
  2: "bg-tier-2",
  3: "bg-tier-3",
};
const TEXT: Record<1 | 2 | 3, string> = {
  1: "text-tier-1",
  2: "text-tier-2",
  3: "text-tier-3",
};
const LABEL: Record<1 | 2 | 3, string> = {
  1: "Content",
  2: "Group",
  3: "1:1",
};

export function TierDistribution({ counts }: { counts: { 1: number; 2: number; 3: number } }) {
  const total = counts[1] + counts[2] + counts[3];

  if (!total) {
    return <p className="text-sm text-muted-foreground">No active clients yet.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex h-3 overflow-hidden rounded-full">
        {([1, 2, 3] as const).map(
          (level) =>
            counts[level] > 0 && (
              <div
                key={level}
                className={BG[level]}
                style={{ width: `${(counts[level] / total) * 100}%` }}
              />
            )
        )}
      </div>
      <div className="space-y-1.5">
        {([1, 2, 3] as const).map((level) => (
          <div key={level} className="flex items-center justify-between text-sm">
            <span className={`flex items-center gap-1.5 ${TEXT[level]}`}>
              <span className={`size-2 rounded-full ${BG[level]}`} />
              <span className="text-foreground">{LABEL[level]}</span>
            </span>
            <span className="font-mono tabular-nums text-muted-foreground">{counts[level]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

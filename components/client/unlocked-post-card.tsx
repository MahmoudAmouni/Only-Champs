import { TierBadge } from "@/components/shared/tier-badge";
import { Play } from "lucide-react";

export function UnlockedPostCard({
  title,
  body,
  mediaType,
  mediaUrl,
  thumbnailUrl,
  durationSeconds,
  tierLevel,
  publishedAt,
}: {
  title: string;
  body: string | null;
  mediaType: "text" | "image" | "video";
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  tierLevel: 1 | 2 | 3;
  publishedAt: string | null;
}) {
  return (
    <article className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <TierBadge level={tierLevel} />
        {publishedAt && (
          <span className="text-xs text-muted-foreground">
            {new Date(publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </span>
        )}
      </div>

      <h3 className="text-base font-semibold text-foreground">{title}</h3>

      {mediaType !== "text" && (mediaUrl || thumbnailUrl) && (
        <div className="relative h-56 overflow-hidden rounded-md bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mediaUrl ?? thumbnailUrl ?? ""} alt="" className="h-full w-full object-cover" />
          {mediaType === "video" && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/20">
              <div className="flex size-12 items-center justify-center rounded-full bg-background/80">
                <Play className="size-5 text-foreground" />
              </div>
              {durationSeconds && (
                <span className="absolute bottom-2 right-2 rounded bg-background/80 px-1.5 py-0.5 text-xs font-mono tabular-nums text-foreground">
                  {Math.floor(durationSeconds / 60)}:{String(durationSeconds % 60).padStart(2, "0")}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {body && <p className="text-sm leading-6 text-muted-foreground">{body}</p>}
    </article>
  );
}

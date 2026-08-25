import { Play } from "lucide-react";
import { TierBadge } from "@/components/shared/tier-badge";

function formatDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

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
  const src = mediaUrl ?? thumbnailUrl;

  return (
    <article className="lift surface-sheen group overflow-hidden rounded-lg border border-border bg-card hover:border-border-strong">
      {mediaType !== "text" && src && (
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />

          {mediaType === "video" && (
            <>
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-background/70 ring-1 ring-border backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                  <Play className="ml-0.5 size-5 fill-foreground text-foreground" />
                </span>
              </div>
              {durationSeconds && (
                <span className="absolute bottom-2.5 right-2.5 rounded bg-background/80 px-1.5 py-0.5 text-[11px] font-medium tabular-nums text-foreground backdrop-blur-sm">
                  {formatDuration(durationSeconds)}
                </span>
              )}
            </>
          )}
        </div>
      )}

      <div className="space-y-2.5 p-4">
        <div className="flex items-center justify-between gap-3">
          <TierBadge level={tierLevel} />
          {publishedAt && (
            <time className="text-xs text-fg-muted">
              {new Date(publishedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </time>
          )}
        </div>

        <h3 className="card-title text-base font-semibold leading-snug tracking-[-0.01em] text-foreground">
          {title}
        </h3>

        {body && (
          <p className="card-body text-sm leading-relaxed text-fg-secondary">{body}</p>
        )}
      </div>
    </article>
  );
}

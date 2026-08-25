"use client";

import { useActionState, useState } from "react";
import { savePost } from "@/lib/actions/posts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaUploader } from "@/components/shared/media-uploader";
import { TierBadge } from "@/components/shared/tier-badge";
import { cn } from "@/lib/utils";

const TIERS = [1, 2, 3] as const;
const MEDIA_TYPES = ["text", "image", "video"] as const;

export function PostComposer({
  userId,
  visibleCounts,
}: {
  userId: string;
  visibleCounts: Record<1 | 2 | 3, number>;
}) {
  const [state, formAction, isPending] = useActionState(savePost, null);
  const [tier, setTier] = useState<1 | 2 | 3>(1);
  const [mediaType, setMediaType] = useState<(typeof MEDIA_TYPES)[number]>("text");
  const [mediaPath, setMediaPath] = useState("");

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="minTierLevel" value={tier} />
      <input type="hidden" name="mediaType" value={mediaType} />
      <input type="hidden" name="mediaPath" value={mediaPath} />

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" maxLength={140} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="body">Body</Label>
        <Textarea id="body" name="body" rows={5} maxLength={10_000} />
      </div>

      <div className="space-y-1.5">
        <Label>Media type</Label>
        <div className="flex gap-2">
          {MEDIA_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setMediaType(t)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-sm capitalize transition-colors",
                mediaType === t
                  ? "border-primary bg-accent text-foreground"
                  : "border-border text-muted-foreground hover:border-border-strong"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {mediaType !== "text" && (
        <div className="space-y-1.5">
          <Label>Media</Label>
          <MediaUploader
            bucket="post-media"
            userId={userId}
            accept={mediaType === "video" ? "video/*" : "image/*"}
            onUploaded={(path) => setMediaPath(path)}
            label="Upload"
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Who can see this</Label>
        <div className="grid grid-cols-3 gap-2">
          {TIERS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setTier(level)}
              className={cn(
                "space-y-1 rounded-lg border p-3 text-left transition-colors",
                tier === level ? "border-primary bg-accent" : "border-border hover:border-border-strong"
              )}
            >
              <TierBadge level={level} />
              <p className="text-xs text-muted-foreground">
                Visible to {visibleCounts[level]} client{visibleCounts[level] === 1 ? "" : "s"}
              </p>
            </button>
          ))}
        </div>
      </div>

      {state?.error && <p className="text-xs text-danger">{state.error}</p>}

      <div className="flex gap-3">
        <Button
          type="submit"
          name="publish"
          value="false"
          variant="secondary"
          disabled={isPending}
        >
          Save draft
        </Button>
        <Button type="submit" name="publish" value="true" disabled={isPending}>
          {isPending ? "Publishing…" : "Publish"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useOptimistic, useTransition } from "react";
import { Heart, Bookmark } from "lucide-react";
import { toggleLike, toggleSave } from "@/lib/actions/engagement";
import { cn } from "@/lib/utils";

/**
 * Like and save controls. Both flip optimistically — a heart that waits for
 * a round trip before filling feels broken, and the failure mode (the count
 * snapping back on the next render) is milder than the delay.
 */
export function PostActions({
  postId,
  likeCount,
  liked,
  saved,
}: {
  postId: string;
  likeCount: number;
  liked: boolean;
  saved: boolean;
}) {
  const [, startTransition] = useTransition();

  const [optimisticLike, setOptimisticLike] = useOptimistic(
    { liked, count: likeCount },
    (_state, next: { liked: boolean; count: number }) => next,
  );
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(
    saved,
    (_state, next: boolean) => next,
  );

  return (
    <div className="flex items-center gap-1 pt-1">
      <button
        type="button"
        aria-pressed={optimisticLike.liked}
        aria-label={optimisticLike.liked ? "Remove like" : "Like this post"}
        onClick={() =>
          startTransition(async () => {
            const wasLiked = optimisticLike.liked;
            setOptimisticLike({
              liked: !wasLiked,
              count: optimisticLike.count + (wasLiked ? -1 : 1),
            });
            await toggleLike(postId, wasLiked);
          })
        }
        className={cn(
          "group/like flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
          optimisticLike.liked
            ? "text-danger"
            : "text-fg-muted hover:bg-accent hover:text-fg-secondary",
        )}
      >
        <Heart
          className={cn(
            "size-4 transition-transform duration-200 group-active/like:scale-90",
            optimisticLike.liked && "fill-current",
          )}
        />
        {optimisticLike.count > 0 && (
          <span className="tabular-nums">{optimisticLike.count}</span>
        )}
      </button>

      <button
        type="button"
        aria-pressed={optimisticSaved}
        aria-label={optimisticSaved ? "Remove from saved" : "Save this post"}
        onClick={() =>
          startTransition(async () => {
            const wasSaved = optimisticSaved;
            setOptimisticSaved(!wasSaved);
            await toggleSave(postId, wasSaved);
          })
        }
        className={cn(
          "group/save flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
          optimisticSaved
            ? "text-volt-500"
            : "text-fg-muted hover:bg-accent hover:text-fg-secondary",
        )}
      >
        <Bookmark
          className={cn(
            "size-4 transition-transform duration-200 group-active/save:scale-90",
            optimisticSaved && "fill-current",
          )}
        />
        {optimisticSaved ? "Saved" : "Save"}
      </button>
    </div>
  );
}

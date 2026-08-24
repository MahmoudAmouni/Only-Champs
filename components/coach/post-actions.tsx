"use client";

import { useTransition } from "react";
import { deletePost, publishDraft } from "@/lib/actions/posts";
import { Button } from "@/components/ui/button";

export function PostActions({ postId, isDraft }: { postId: string; isDraft: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      {isDraft && (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={isPending}
          onClick={() => startTransition(() => publishDraft(postId))}
        >
          Publish
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={isPending}
        onClick={() => {
          if (confirm("Delete this post? This can't be undone.")) {
            startTransition(() => deletePost(postId));
          }
        }}
      >
        Delete
      </Button>
    </div>
  );
}

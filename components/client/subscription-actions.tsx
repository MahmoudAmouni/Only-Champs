"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { cancelDemoSubscription } from "@/lib/actions/subscribe";
import { Button } from "@/components/ui/button";

export function SubscriptionActions({
  coachId,
  handle,
}: {
  coachId: string;
  handle: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {handle && (
          <Button
            size="sm"
            variant="secondary"
            render={<Link href={`/c/${handle}#pricing`} />}
            nativeButton={false}
          >
            Change tier
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={isPending}
          onClick={() => {
            if (!confirm("Cancel this subscription? You'll lose access to gated content.")) {
              return;
            }
            setError(null);
            startTransition(async () => {
              const result = await cancelDemoSubscription(coachId);
              if (result?.error) {
                setError(result.error);
                return;
              }
              router.refresh();
            });
          }}
        >
          {isPending ? <Loader2 className="animate-spin" /> : null}
          Cancel
        </Button>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

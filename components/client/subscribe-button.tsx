"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { subscribeDemo } from "@/lib/actions/subscribe";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SubscribeButton({
  tierId,
  handle,
  isSignedIn,
  recommended,
}: {
  tierId: string;
  handle: string;
  isSignedIn: boolean;
  recommended: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function onClick() {
    setError(null);

    // Signed-out visitors sign up first, then come back to this storefront
    // so the tier they picked is still one tap away.
    if (!isSignedIn) {
      router.push(`/signup?next=${encodeURIComponent(`/c/${handle}`)}`);
      return;
    }

    startTransition(async () => {
      const result = await subscribeDemo(tierId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setDone(true);
      router.push("/feed");
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        onClick={onClick}
        disabled={isPending || done}
        variant={recommended ? "default" : "secondary"}
        className={cn(
          "w-full transition-transform duration-200 active:scale-[0.99]",
          recommended && "glow-volt"
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="animate-spin" />
            Starting…
          </>
        ) : done ? (
          <>
            <Check className="size-3.5" />
            Subscribed
          </>
        ) : (
          "Subscribe"
        )}
      </Button>

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

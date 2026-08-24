"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ensureDirectConversation } from "@/lib/actions/messages";
import { Button } from "@/components/ui/button";

export function MessageClientButton({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="secondary"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const id = await ensureDirectConversation(clientId);
          router.push(`/messages/${id}`);
        })
      }
    >
      {isPending ? "Opening…" : "Message"}
    </Button>
  );
}

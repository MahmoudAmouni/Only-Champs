"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { sendMessage } from "@/lib/actions/messages";
import { useMessages, type ChatMessage } from "@/components/shared/use-messages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function ChatThread({
  conversationId,
  initialMessages,
  currentUserId,
  showSenderNames = false,
  senderNames = {},
}: {
  conversationId: string;
  initialMessages: ChatMessage[];
  currentUserId: string;
  showSenderNames?: boolean;
  senderNames?: Record<string, string>;
}) {
  const messages = useMessages(conversationId, initialMessages);
  const [text, setText] = useState("");
  const [optimistic, setOptimistic] = useState<ChatMessage[]>([]);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Entries whose real row hasn't arrived via realtime yet — derived at
  // render time rather than synced into its own state via an effect, so
  // there's nothing to reset once the confirmed message shows up.
  const pendingOptimistic = optimistic.filter(
    (o) => !messages.some((m) => m.body === o.body && m.sender_id === o.sender_id)
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, pendingOptimistic.length]);

  function submit() {
    const body = text.trim();
    if (!body) return;
    setText("");

    const tempId = `optimistic-${Date.now()}`;
    setOptimistic((prev) => [
      ...prev,
      { id: tempId, sender_id: currentUserId, body, created_at: new Date().toISOString() },
    ]);

    startTransition(async () => {
      await sendMessage(conversationId, body);
    });
  }

  const allMessages = [...messages, ...pendingOptimistic];

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto px-1 py-4">
        {allMessages.map((m) => {
          const isMine = m.sender_id === currentUserId;
          const isOptimistic = m.id.startsWith("optimistic-");
          return (
            <div key={m.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[75%] px-3 py-2 text-sm",
                  isMine
                    ? "rounded-lg rounded-tr-sm bg-primary text-primary-foreground"
                    : "rounded-lg rounded-tl-sm bg-accent text-foreground",
                  isOptimistic && "opacity-60"
                )}
              >
                {showSenderNames && !isMine && (
                  <p className="mb-0.5 text-xs font-medium opacity-70">
                    {senderNames[m.sender_id] ?? "Member"}
                  </p>
                )}
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2 border-t border-border pt-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Message…"
          rows={1}
          className="max-h-32 min-h-10 flex-1 resize-none"
        />
        <Button type="button" onClick={submit} disabled={isPending || !text.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}

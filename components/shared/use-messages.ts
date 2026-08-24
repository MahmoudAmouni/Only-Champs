"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type ChatMessage = {
  id: string;
  sender_id: string;
  body: string | null;
  created_at: string;
};

/**
 * Inserts happen through sendMessage() (a Server Action, so RLS applies);
 * this only subscribes for live updates. Realtime respects RLS too — a
 * client without access to a conversation receives nothing from this
 * channel even if they know the ID. See docs/02-BACKEND.md §6.
 */
export function useMessages(conversationId: string, initial: ChatMessage[]) {
  const [messages, setMessages] = useState(initial);

  // Reset when switching threads. Adjusted during render (React's documented
  // pattern for "reset state when a prop changes") rather than in an effect,
  // which would cost an extra render and trip the set-state-in-effect rule.
  const [renderedFor, setRenderedFor] = useState(conversationId);
  if (conversationId !== renderedFor) {
    setRenderedFor(conversationId);
    setMessages(initial);
  }

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        ({ new: row }) => {
          const msg = row as ChatMessage;
          setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  return messages;
}

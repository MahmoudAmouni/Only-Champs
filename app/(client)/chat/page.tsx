import Link from "next/link";
import { requireUser } from "@/lib/queries/auth";
import { getClientConversation, getConversationMessages } from "@/lib/queries/messages";
import { createClient } from "@/lib/supabase/server";
import { ChatThread } from "@/components/shared/chat-thread";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageCircle, Lock } from "lucide-react";

export default async function ChatPage() {
  const user = await requireUser();
  const { conversation, tierLevel, coachId } = await getClientConversation(user.id);

  if (tierLevel === 0) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No active subscription"
        description="Subscribe to a coach to start chatting."
      />
    );
  }

  if (tierLevel === 1) {
    const supabase = await createClient();
    const { data: coach } = await supabase
      .from("coaches")
      .select("handle, display_name")
      .eq("id", coachId!)
      .single();
    const { data: groupTier } = await supabase
      .from("tiers")
      .select("price_cents")
      .eq("coach_id", coachId!)
      .eq("level", 2)
      .maybeSingle();

    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-border p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-tier-2/15">
          <Lock className="size-6 text-tier-2" />
        </div>
        <div>
          <p className="font-medium text-foreground">Chat is included from the Group tier</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upgrade to message {coach?.display_name} directly.
          </p>
        </div>
        <Button render={<Link href={`/c/${coach?.handle}#pricing`} />} nativeButton={false}>
          Upgrade{groupTier ? ` — $${(groupTier.price_cents / 100).toFixed(0)}/mo` : ""}
        </Button>
      </div>
    );
  }

  if (!conversation) {
    return (
      <EmptyState
        icon={MessageCircle}
        title="No conversation yet"
        description="Your coach hasn't started this thread yet."
      />
    );
  }

  const messages = await getConversationMessages(conversation.id);

  let senderNames: Record<string, string> = {};
  if (tierLevel === 2) {
    const supabase = await createClient();
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", [...new Set(messages.map((m) => m.sender_id))]);
    senderNames = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <ChatThread
        conversationId={conversation.id}
        initialMessages={messages}
        currentUserId={user.id}
        showSenderNames={tierLevel === 2}
        senderNames={senderNames}
      />
    </div>
  );
}

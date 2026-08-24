import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireCoach } from "@/lib/queries/auth";
import { createClient } from "@/lib/supabase/server";
import { getConversationMessages } from "@/lib/queries/messages";
import { ChatThread } from "@/components/shared/chat-thread";
import { TierBadge } from "@/components/shared/tier-badge";

export default async function CoachThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coach = await requireCoach();
  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, type, title, min_tier_level, profiles(full_name)")
    .eq("id", id)
    .eq("coach_id", coach.id)
    .maybeSingle();
  if (!conversation) notFound();

  const messages = await getConversationMessages(id);

  let senderNames: Record<string, string> = {};
  if (conversation.type === "group") {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", [...new Set(messages.map((m) => m.sender_id))]);
    senderNames = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]));
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <Link href="/messages" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="font-medium text-foreground">
          {conversation.type === "group" ? conversation.title ?? "Group Chat" : conversation.profiles?.full_name}
        </h1>
        {conversation.type === "group" && conversation.min_tier_level && (
          <TierBadge level={conversation.min_tier_level as 1 | 2 | 3} />
        )}
      </div>

      <ChatThread
        conversationId={id}
        initialMessages={messages}
        currentUserId={coach.id}
        showSenderNames={conversation.type === "group"}
        senderNames={senderNames}
      />
    </div>
  );
}

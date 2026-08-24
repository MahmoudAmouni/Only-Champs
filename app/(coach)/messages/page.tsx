import Link from "next/link";
import { requireCoach } from "@/lib/queries/auth";
import { getConversationsForCoach } from "@/lib/queries/messages";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageSquare, Users } from "lucide-react";

function relativeTime(iso: string | null) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default async function MessagesPage() {
  const coach = await requireCoach();
  const conversations = await getConversationsForCoach(coach.id);

  if (!conversations.length) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No conversations yet"
        description="Direct threads open automatically once a 1:1 client messages you."
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-[30px] font-semibold tracking-[-0.02em] text-foreground">
        Messages
      </h1>

      <div className="divide-y divide-border rounded-lg border border-border">
        {conversations.map((c) => (
          <Link
            key={c.id}
            href={`/messages/${c.id}`}
            className="flex items-center gap-3 p-4 transition-colors hover:bg-hover"
          >
            {c.type === "group" ? (
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent">
                <Users className="size-4 text-muted-foreground" />
              </div>
            ) : (
              <Avatar className="size-10 shrink-0">
                <AvatarImage src={c.profiles?.avatar_url ?? undefined} alt="" />
                <AvatarFallback>{c.profiles?.full_name?.[0] ?? "?"}</AvatarFallback>
              </Avatar>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-foreground">
                {c.type === "group" ? c.title ?? "Group Chat" : c.profiles?.full_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {c.type === "group" ? "Group thread" : "Direct message"}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {relativeTime(c.last_message_at)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

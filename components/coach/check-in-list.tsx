"use client";

import { useState, useTransition } from "react";
import { replyToCheckIn } from "@/lib/actions/checkins";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/shared/empty-state";
import { MessageSquare } from "lucide-react";

type CheckIn = {
  id: string;
  week_of: string;
  weight_kg: number | null;
  sleep_hours: number | null;
  adherence_pct: number | null;
  energy_score: number | null;
  notes: string | null;
  coach_reply: string | null;
};

export function CheckInList({ checkIns }: { checkIns: CheckIn[] }) {
  if (!checkIns.length) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="No check-ins yet"
        description="Weekly check-ins from this client will show up here."
      />
    );
  }

  return (
    <div className="space-y-4">
      {checkIns.map((c) => (
        <CheckInRow key={c.id} checkIn={c} />
      ))}
    </div>
  );
}

function CheckInRow({ checkIn }: { checkIn: CheckIn }) {
  const [replying, setReplying] = useState(false);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  const weekLabel = new Date(checkIn.week_of).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="font-medium text-foreground">Week of {weekLabel}</span>
        {checkIn.weight_kg && (
          <span className="font-mono tabular-nums text-muted-foreground">{checkIn.weight_kg} kg</span>
        )}
        {checkIn.adherence_pct !== null && (
          <span className="font-mono tabular-nums text-muted-foreground">
            {checkIn.adherence_pct}% adherence
          </span>
        )}
        {checkIn.sleep_hours && (
          <span className="text-muted-foreground">{checkIn.sleep_hours}h sleep</span>
        )}
        {checkIn.energy_score && (
          <span className="text-muted-foreground">Energy {checkIn.energy_score}/10</span>
        )}
      </div>

      {checkIn.notes && <p className="text-sm text-muted-foreground">{checkIn.notes}</p>}

      {checkIn.coach_reply ? (
        <div className="rounded-md bg-accent p-3 text-sm text-foreground">
          {checkIn.coach_reply}
        </div>
      ) : replying ? (
        <div className="space-y-2">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            placeholder="Write a reply…"
          />
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={isPending || !text.trim()}
              onClick={() =>
                startTransition(async () => {
                  await replyToCheckIn(checkIn.id, text);
                  setReplying(false);
                  setText("");
                })
              }
            >
              Send
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setReplying(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button type="button" size="sm" variant="secondary" onClick={() => setReplying(true)}>
          Reply
        </Button>
      )}
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { submitCheckIn } from "@/lib/actions/checkins";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CheckInComposer({ alreadySubmitted }: { alreadySubmitted: boolean }) {
  const [state, formAction, isPending] = useActionState(submitCheckIn, null);

  if (alreadySubmitted || state?.ok) {
    return (
      <div className="rounded-lg border border-success/30 bg-success/10 p-4 text-sm text-foreground">
        You&apos;ve already checked in this week. See you next Monday.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 rounded-lg border border-border p-4">
      <p className="text-sm font-medium text-foreground">This week&apos;s check-in</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="weightKg">Weight (kg)</Label>
          <Input id="weightKg" name="weightKg" type="number" step="0.1" inputMode="decimal" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sleepHours">Sleep (avg hrs)</Label>
          <Input id="sleepHours" name="sleepHours" type="number" step="0.1" inputMode="decimal" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="adherencePct">Adherence %</Label>
          <Input id="adherencePct" name="adherencePct" type="number" min={0} max={100} inputMode="numeric" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="energyScore">Energy (1–10)</Label>
          <Input id="energyScore" name="energyScore" type="number" min={1} max={10} inputMode="numeric" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" name="notes" rows={3} maxLength={2000} />
      </div>

      {state?.error && <p className="text-xs text-danger">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Submitting…" : "Submit check-in"}
      </Button>
    </form>
  );
}

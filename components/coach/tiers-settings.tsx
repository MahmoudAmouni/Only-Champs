"use client";

import { useActionState, useState, useTransition } from "react";
import { upsertTier, deactivateTier, reactivateTier } from "@/lib/actions/tiers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TierBadge } from "@/components/shared/tier-badge";
import { cn } from "@/lib/utils";

type Tier = {
  id: string;
  level: number;
  name: string;
  description: string | null;
  price_cents: number;
  features: string[];
  is_active: boolean;
};

const LEVELS = [1, 2, 3] as const;

export function TiersSettings({ tiers }: { tiers: Tier[] }) {
  return (
    <div className="space-y-4">
      {LEVELS.map((level) => (
        <TierEditor key={level} level={level} existing={tiers.find((t) => t.level === level)} />
      ))}
    </div>
  );
}

function TierEditor({ level, existing }: { level: 1 | 2 | 3; existing?: Tier }) {
  const [state, formAction, isPending] = useActionState(upsertTier, null);
  const [isToggling, startToggle] = useTransition();
  const [priceChanged, setPriceChanged] = useState(false);

  const isActive = existing?.is_active ?? false;

  return (
    <div
      className={cn(
        "space-y-3 rounded-lg border p-4",
        isActive ? "border-border" : "border-border/50 opacity-60"
      )}
    >
      <div className="flex items-center justify-between">
        <TierBadge level={level} />
        {existing && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isToggling}
            onClick={() =>
              startToggle(async () => {
                if (isActive) await deactivateTier(existing.id);
                else await reactivateTier(existing.id);
              })
            }
          >
            {isActive ? "Deactivate" : "Reactivate"}
          </Button>
        )}
      </div>

      <form action={formAction} className="space-y-3">
        <input type="hidden" name="level" value={level} />

        <div className="grid grid-cols-[1fr_auto] gap-3">
          <div className="space-y-1.5">
            <Label htmlFor={`name-${level}`}>Name</Label>
            <Input id={`name-${level}`} name="name" defaultValue={existing?.name} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`price-${level}`}>Price / mo</Label>
            <Input
              id={`price-${level}`}
              name="priceDollars"
              type="number"
              min={1}
              className="w-24"
              defaultValue={existing ? existing.price_cents / 100 : undefined}
              onChange={() => setPriceChanged(true)}
              required
            />
          </div>
        </div>

        {priceChanged && (
          <p className="text-xs text-warning">
            Existing subscribers keep their current price until they change tiers.
          </p>
        )}

        <div className="space-y-1.5">
          <Label htmlFor={`description-${level}`}>Description</Label>
          <Input id={`description-${level}`} name="description" defaultValue={existing?.description ?? ""} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`features-${level}`}>Features (one per line)</Label>
          <Textarea
            id={`features-${level}`}
            name="features"
            rows={3}
            defaultValue={existing?.features.join("\n") ?? ""}
          />
        </div>

        {state?.error && <p className="text-xs text-danger">{state.error}</p>}
        {state?.ok && <p className="text-xs text-success">Saved.</p>}

        <Button type="submit" size="sm" variant="secondary" disabled={isPending}>
          {isPending ? "Saving…" : existing ? "Update tier" : "Create tier"}
        </Button>
      </form>
    </div>
  );
}

"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
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

/** What each level actually unlocks. These are enforced in the database, not
 * chosen per coach, so stating them next to the price stops a coach pricing a
 * tier without knowing what they just promised. */
const LEVEL_GRANTS: Record<1 | 2 | 3, string> = {
  1: "Content feed access",
  2: "Content + group chat",
  3: "Everything + direct 1:1 chat",
};

export function TiersSettings({
  tiers,
  activeClients,
}: {
  tiers: Tier[];
  activeClients: number;
}) {
  const mrr = tiers
    .filter((t) => t.is_active)
    .reduce((sum, t) => sum + t.price_cents, 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border bg-card px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
            Active tiers
          </p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
            {tiers.filter((t) => t.is_active).length} of 3
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
            Ladder spread
          </p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
            ${(mrr / 100).toFixed(0)}
          </p>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
            Subscribers
          </p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
            {activeClients}
          </p>
        </div>
        <p className="ml-auto max-w-[38ch] text-xs leading-relaxed text-fg-muted">
          Access is granted by level, never by name. Call level 3 whatever you
          like — it still unlocks everything.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {LEVELS.map((level) => (
          <TierEditor
            key={level}
            level={level}
            existing={tiers.find((t) => t.level === level)}
          />
        ))}
      </div>
    </div>
  );
}

function TierEditor({ level, existing }: { level: 1 | 2 | 3; existing?: Tier }) {
  const [state, formAction, isPending] = useActionState(upsertTier, null);
  const [isToggling, startToggle] = useTransition();
  const [priceChanged, setPriceChanged] = useState(false);
  const [price, setPrice] = useState(
    existing ? String(existing.price_cents / 100) : "",
  );

  const isActive = existing?.is_active ?? false;

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border bg-card transition-opacity",
        isActive ? "border-border" : "border-dashed border-border/60 opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2 border-b border-border/60 p-5">
        <div>
          <TierBadge level={level} />
          <p className="mt-2 text-xs text-fg-muted">{LEVEL_GRANTS[level]}</p>
        </div>
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
            {isToggling ? <Loader2 className="animate-spin" /> : null}
            {isActive ? "Deactivate" : "Reactivate"}
          </Button>
        )}
      </div>

      <form action={formAction} className="flex flex-1 flex-col gap-4 p-5">
        <input type="hidden" name="level" value={level} />

        <div className="space-y-1.5">
          <Label htmlFor={`name-${level}`}>Tier name</Label>
          <Input
            id={`name-${level}`}
            name="name"
            defaultValue={existing?.name}
            placeholder={["Content", "Group", "1:1 Coaching"][level - 1]}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`price-${level}`}>Price per month</Label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-fg-muted">
              $
            </span>
            <Input
              id={`price-${level}`}
              name="priceDollars"
              type="number"
              min={1}
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setPriceChanged(true);
              }}
              className="pl-7 tabular-nums"
              required
            />
          </div>
          {priceChanged && existing && (
            <p className="text-xs text-warning">
              Existing subscribers keep their current price until they change
              tiers.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`description-${level}`}>Short description</Label>
          <Input
            id={`description-${level}`}
            name="description"
            defaultValue={existing?.description ?? ""}
            placeholder="One line, shown under the price"
          />
        </div>

        <div className="flex-1 space-y-1.5">
          <Label htmlFor={`features-${level}`}>Features</Label>
          <Textarea
            id={`features-${level}`}
            name="features"
            rows={5}
            defaultValue={existing?.features.join("\n") ?? ""}
            placeholder={"One per line\nShown as a checklist"}
            className="resize-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" variant="secondary" disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Saving…
              </>
            ) : existing ? (
              "Update tier"
            ) : (
              "Create tier"
            )}
          </Button>
          {state?.error && <p className="text-xs text-danger">{state.error}</p>}
          {state?.ok && (
            <span className="animate-scale-in flex items-center gap-1 text-xs text-success">
              <Check className="size-3.5" />
              Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

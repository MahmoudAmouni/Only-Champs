"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import {
  checkHandleAvailable,
  publishStorefront,
  saveHandle,
  updateCoachProfile,
} from "@/lib/actions/coach";
import { upsertTier } from "@/lib/actions/tiers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MediaUploader } from "@/components/shared/media-uploader";
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

type Coach = {
  id: string;
  handle: string;
  display_name: string;
  headline: string | null;
  bio: string | null;
  cover_image_url: string | null;
  tiers: Tier[];
} | null;

const STEPS = ["Handle", "Profile", "Tiers", "Payments"];

const DEFAULT_TIERS = [
  { level: 1, name: "Content", price: 19, description: "Video library and weekly training content." },
  { level: 2, name: "Group", price: 59, description: "Everything in Content, plus group coaching." },
  { level: 3, name: "1:1 Coaching", price: 249, description: "Fully custom programming and direct access." },
];

export function OnboardingWizard({
  userId,
  initialFullName,
  initialAvatarUrl,
  coach,
}: {
  userId: string;
  initialFullName: string;
  initialAvatarUrl: string | null;
  coach: Coach;
}) {
  // Resume at the right step: no coach row -> handle; coach but no tiers
  // saved yet is still fine to revisit any step, so just start wherever
  // makes sense and let the user move freely once a coach row exists.
  const [step, setStep] = useState(coach ? 1 : 0);

  return (
    <div className="space-y-8">
      <div>
        <div className="mb-2 flex justify-between text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {STEPS.map((label, i) => (
            <span key={label} className={i === step ? "text-foreground" : undefined}>
              {label}
            </span>
          ))}
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {step === 0 && (
        <StepHandle initialHandle={coach?.handle} onDone={() => setStep(1)} />
      )}
      {step === 1 && (
        <StepProfile
          userId={userId}
          initialFullName={coach?.display_name || initialFullName}
          initialHeadline={coach?.headline}
          initialBio={coach?.bio}
          initialAvatarUrl={initialAvatarUrl}
          initialCoverUrl={coach?.cover_image_url}
          onDone={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <StepTiers existingTiers={coach?.tiers ?? []} onDone={() => setStep(3)} />
      )}
      {step === 3 && <StepPayments />}
    </div>
  );
}

function StepHandle({
  initialHandle,
  onDone,
}: {
  initialHandle?: string;
  onDone: () => void;
}) {
  const [handle, setHandle] = useState(initialHandle ?? "");
  const [status, setStatus] = useState<"idle" | "checking" | "available" | "taken">(
    initialHandle ? "available" : "idle"
  );
  const [reason, setReason] = useState<string | undefined>();
  const [state, formAction, isPending] = useActionState(saveHandle, null);

  useEffect(() => {
    if (!handle || handle === initialHandle) return;

    const t = setTimeout(async () => {
      const result = await checkHandleAvailable(handle);
      setStatus(result.available ? "available" : "taken");
      setReason(result.reason);
    }, 400);
    return () => clearTimeout(t);
  }, [handle, initialHandle]);

  // Derived rather than set from the effect above (which would trigger the
  // synchronous-setState-in-effect lint rule): the moment the field matches
  // the already-saved handle, it's available by definition — no debounced
  // check needed.
  const effectiveStatus =
    handle && handle === initialHandle ? "available" : handle ? status : "idle";

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.01em] text-foreground">
          Choose your handle
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This becomes your public storefront URL.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="handle">Handle</Label>
        <Input
          id="handle"
          name="handle"
          value={handle}
          onChange={(e) => {
            const next = e.target.value.toLowerCase();
            setHandle(next);
            if (next && next !== initialHandle) setStatus("checking");
          }}
          placeholder="marcus"
          aria-invalid={effectiveStatus === "taken"}
          autoComplete="off"
        />
        <p className="text-xs text-muted-foreground">
          onlychamps.app/c/<span className="text-foreground">{handle || "your-handle"}</span>
        </p>
        {effectiveStatus === "checking" && (
          <p className="text-xs text-muted-foreground">Checking availability…</p>
        )}
        {effectiveStatus === "available" && (
          <p className="flex items-center gap-1 text-xs text-success">
            <Check className="size-3" /> Available
          </p>
        )}
        {effectiveStatus === "taken" && <p className="text-xs text-danger">{reason}</p>}
        {state?.error && <p className="text-xs text-danger">{state.error}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={effectiveStatus !== "available" || isPending}>
        {isPending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}

function StepProfile({
  userId,
  initialFullName,
  initialHeadline,
  initialBio,
  initialAvatarUrl,
  initialCoverUrl,
  onDone,
}: {
  userId: string;
  initialFullName: string;
  initialHeadline?: string | null;
  initialBio?: string | null;
  initialAvatarUrl: string | null;
  initialCoverUrl?: string | null;
  onDone: () => void;
}) {
  const [state, formAction, isPending] = useActionState(updateCoachProfile, null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl ?? "");
  const [coverUrl, setCoverUrl] = useState(initialCoverUrl ?? "");

  useEffect(() => {
    if (state?.ok) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.01em] text-foreground">
          Your profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          What clients see on your storefront.
        </p>
      </div>

      <input type="hidden" name="avatarUrl" value={avatarUrl} />
      <input type="hidden" name="coverImageUrl" value={coverUrl} />

      <div className="flex gap-6">
        <div className="space-y-1.5">
          <Label>Avatar</Label>
          <MediaUploader
            bucket="avatars"
            userId={userId}
            previewUrl={avatarUrl || undefined}
            onUploaded={(_, url) => setAvatarUrl(url)}
            label="Upload"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Cover image</Label>
          <MediaUploader
            bucket="avatars"
            userId={userId}
            previewUrl={coverUrl || undefined}
            onUploaded={(_, url) => setCoverUrl(url)}
            label="Upload"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" name="displayName" defaultValue={initialFullName} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          name="headline"
          defaultValue={initialHeadline ?? ""}
          placeholder="Strength coaching for people who lift late and eat early"
          maxLength={140}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={initialBio ?? ""} rows={4} maxLength={2000} />
      </div>

      {state?.error && <p className="text-xs text-danger">{state.error}</p>}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}

function StepTiers({
  existingTiers,
  onDone,
}: {
  existingTiers: Tier[];
  onDone: () => void;
}) {
  const [savedLevels, setSavedLevels] = useState(
    new Set(existingTiers.filter((t) => t.is_active).map((t) => t.level))
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.01em] text-foreground">
          Set your pricing
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Save each tier you want to offer. You can change these anytime in Settings.
        </p>
      </div>

      {DEFAULT_TIERS.map((def) => {
        const existing = existingTiers.find((t) => t.level === def.level);
        return (
          <TierCard
            key={def.level}
            def={def}
            existing={existing}
            saved={savedLevels.has(def.level)}
            onSaved={() => setSavedLevels((prev) => new Set(prev).add(def.level))}
          />
        );
      })}

      <Button className="w-full" disabled={savedLevels.size === 0} onClick={onDone}>
        Continue
      </Button>
    </div>
  );
}

function TierCard({
  def,
  existing,
  saved,
  onSaved,
}: {
  def: (typeof DEFAULT_TIERS)[number];
  existing?: Tier;
  saved: boolean;
  onSaved: () => void;
}) {
  const [state, formAction, isPending] = useActionState(upsertTier, null);

  useEffect(() => {
    if (state?.ok) onSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className={cn(
        "space-y-3 rounded-lg border p-4",
        saved ? "border-primary/40 bg-accent/40" : "border-border"
      )}
    >
      <input type="hidden" name="level" value={def.level} />
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Level {def.level}
        </span>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-success">
            <Check className="size-3" /> Saved
          </span>
        )}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`name-${def.level}`}>Name</Label>
          <Input id={`name-${def.level}`} name="name" defaultValue={existing?.name ?? def.name} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`price-${def.level}`}>Price / mo</Label>
          <Input
            id={`price-${def.level}`}
            name="priceDollars"
            type="number"
            defaultValue={existing ? existing.price_cents / 100 : def.price}
            className="w-24"
            min={1}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`description-${def.level}`}>Description</Label>
        <Input
          id={`description-${def.level}`}
          name="description"
          defaultValue={existing?.description ?? def.description}
        />
      </div>

      {state?.error && <p className="text-xs text-danger">{state.error}</p>}

      <Button type="submit" size="sm" variant="secondary" disabled={isPending}>
        {isPending ? "Saving…" : saved ? "Update" : "Save tier"}
      </Button>
    </form>
  );
}

function StepPayments() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function finish() {
    setIsPending(true);
    const result = await publishStorefront();
    setIsPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold tracking-[-0.01em] text-foreground">
          Payments
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Stripe Connect handles payouts — coming in a later phase of this build. You can
          publish your storefront now and connect Stripe once it&apos;s available.
        </p>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <Button className="w-full" onClick={finish} disabled={isPending}>
        {isPending ? "Publishing…" : "Publish storefront"}
      </Button>
    </div>
  );
}

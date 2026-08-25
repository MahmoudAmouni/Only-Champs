"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Loader2 } from "lucide-react";
import { setStorefrontPublished } from "@/lib/actions/coach";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StorefrontSettings({
  handle,
  isPublished,
  hasTiers,
}: {
  handle: string;
  isPublished: boolean;
  hasTiers: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Built in the browser so it shows the real origin the visitor is on,
  // rather than a build-time env var that is wrong on every preview URL.
  const url =
    typeof window === "undefined"
      ? `/c/${handle}`
      : `${window.location.origin}/c/${handle}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy — select the link and copy it manually.");
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold text-foreground">Your public link</h2>
        <p className="mt-1 text-xs text-fg-muted">
          This is what goes in your bio. It works for anyone, signed in or not.
        </p>

        <div className="mt-4 space-y-1.5">
          <Label htmlFor="storefront-url">Storefront URL</Label>
          <div className="flex gap-2">
            <Input
              id="storefront-url"
              readOnly
              value={url}
              onFocus={(e) => e.currentTarget.select()}
              className="font-mono text-sm"
            />
            <Button type="button" variant="secondary" onClick={copy} className="shrink-0">
              {copied ? <Check className="text-success" /> : <Copy />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-fg-muted">
            Your handle is <span className="font-mono text-fg-secondary">{handle}</span> and
            is set during onboarding.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {isPublished ? "Storefront is live" : "Storefront is hidden"}
            </h2>
            <p className="mt-1 max-w-[52ch] text-xs leading-relaxed text-fg-muted">
              {isPublished
                ? "It's listed on Discover and anyone with the link can subscribe. Unpublishing takes it off Discover and hides the page — your tiers, posts and existing clients are untouched."
                : "Nobody can reach the page and it isn't listed on Discover. Publishing makes it visible immediately."}
            </p>
          </div>

          <Button
            type="button"
            variant={isPublished ? "secondary" : "default"}
            disabled={isPending || (!isPublished && !hasTiers)}
            onClick={() => {
              setError(null);
              startTransition(async () => {
                const result = await setStorefrontPublished(!isPublished);
                if (result?.error) setError(result.error);
              });
            }}
          >
            {isPending && <Loader2 className="animate-spin" />}
            {isPublished ? "Unpublish" : "Publish storefront"}
          </Button>
        </div>

        {!isPublished && !hasTiers && (
          <p className="mt-3 text-xs text-warning">
            Add at least one active tier before publishing — a storefront with
            nothing to buy converts nobody.
          </p>
        )}
        {error && <p className="mt-3 text-xs text-danger">{error}</p>}
      </section>
    </div>
  );
}

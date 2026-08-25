"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Loader2, Check } from "lucide-react";
import { signIn } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Demo accounts, filled into the form on click rather than signed in
 * silently. Every second between someone opening the link and seeing the
 * product costs you half the audience, and a login wall costs nearly all of
 * it — but showing the credentials rather than hiding them behind a
 * magic button means a visitor can also sign back in later, and can see
 * they are looking at seeded data rather than someone's real account.
 *
 * The client holds three memberships at three different levels — 3, 2 and 1
 * with different coaches — so one account demonstrates the whole ladder:
 * everything unlocked and a direct chat with one coach, group chat with
 * another, and a mostly locked feed with the third. A single-membership
 * account shows either the gate or the full access, never both.
 */
const DEMO_PASSWORD = "OnlyChamps2026!";

const DEMO_ACCOUNTS = [
  {
    role: "Coach",
    email: "marcus.chen@onlychamps.demo",
    blurb: "8 clients, live revenue dashboard",
  },
  {
    role: "Client",
    email: "sofia.martins@onlychamps.demo",
    blurb: "3 memberships, chat, mixed access",
  },
] as const;

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(signIn, null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [filled, setFilled] = useState<string | null>(null);

  function fillDemoAccount(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setFilled(demoEmail);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-medium text-foreground">
          Explore with a demo account
        </p>
        <p className="mt-1 text-xs text-fg-muted">
          Fills the form below with a seeded account. No signup needed.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((account) => {
            const isFilled = filled === account.email;
            return (
              <button
                key={account.email}
                type="button"
                onClick={() => fillDemoAccount(account.email)}
                aria-label={`Fill the form with the demo ${account.role.toLowerCase()} account`}
                className={`group rounded-md border px-3 py-2.5 text-left transition-colors ${
                  isFilled
                    ? "border-volt-500/60 bg-volt-500/10"
                    : "border-border hover:border-volt-500/50 hover:bg-accent"
                }`}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                  {account.role}
                  {isFilled && <Check className="size-3.5 text-volt-500" />}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-fg-muted">
                  {account.blurb}
                </span>
              </button>
            );
          })}
        </div>

        {filled && (
          <p role="status" className="animate-scale-in mt-3 text-xs text-fg-secondary">
            Filled in. Press <span className="font-medium text-foreground">Sign in</span> to continue.
          </p>
        )}
      </div>

      <form action={formAction} className="space-y-4">
        {next && <input type="hidden" name="next" value={next} />}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-invalid={!!state?.error}
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!state?.error}
            className="h-11"
          />
        </div>

        {state?.error && (
          <p role="alert" className="text-xs text-danger">
            {state.error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full transition-transform duration-200 active:scale-[0.99]"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        <p className="pt-1 text-center text-sm text-fg-secondary">
          Don&apos;t have an account?{" "}
          <Link
            href="/signup"
            className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-volt-500"
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

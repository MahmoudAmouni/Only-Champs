"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Check, Dumbbell, Loader2, Users } from "lucide-react";
import { signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Role = "coach" | "client";

export function SignupForm() {
  const [state, formAction, isPending] = useActionState(signUp, null);
  const [role, setRole] = useState<Role>("client");

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="role" value={role} />

      <div className="space-y-2">
        <Label>I&apos;m signing up as</Label>
        <div className="grid grid-cols-2 gap-2.5">
          <RoleCard
            icon={Users}
            label="A client"
            description="Train with a coach"
            selected={role === "client"}
            onSelect={() => setRole("client")}
          />
          <RoleCard
            icon={Dumbbell}
            label="A coach"
            description="Sell subscriptions"
            selected={role === "coach"}
            onSelect={() => setRole("coach")}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          autoComplete="name"
          placeholder="Alex Rivera"
          required
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          className="h-11"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          required
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
            Creating account…
          </>
        ) : (
          "Create account"
        )}
      </Button>

      <p className="text-center text-sm text-fg-secondary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-volt-500"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

function RoleCard({
  icon: Icon,
  label,
  description,
  selected,
  onSelect,
}: {
  icon: typeof Users;
  label: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "group relative overflow-hidden rounded-lg border p-3.5 text-left transition-all duration-250",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        selected
          ? "border-volt-500/60 bg-volt-500/[0.07] shadow-[0_0_0_1px_var(--oc-volt-500)_inset]"
          : "border-border bg-card hover:border-border-strong hover:bg-hover"
      )}
    >
      <div className="flex items-center justify-between">
        <Icon
          className={cn(
            "size-4 transition-colors duration-250",
            selected ? "text-volt-500" : "text-fg-muted"
          )}
        />
        <span
          className={cn(
            "flex size-4 items-center justify-center rounded-full transition-all duration-250",
            selected
              ? "scale-100 bg-volt-500 opacity-100"
              : "scale-75 opacity-0"
          )}
        >
          <Check className="size-2.5 text-volt-ink" strokeWidth={3.5} />
        </span>
      </div>
      <div className="mt-2.5 text-sm font-medium text-foreground">{label}</div>
      <div className="mt-0.5 text-xs text-fg-muted">{description}</div>
    </button>
  );
}

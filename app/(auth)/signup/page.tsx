import { SignupForm } from "@/components/auth/signup-form";
import { GoogleButton } from "@/components/auth/google-button";

export default function SignupPage() {
  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-[28px] font-bold tracking-[-0.025em] text-foreground">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-fg-secondary">
          Free to start. No card required.
        </p>
      </div>

      <SignupForm />

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-muted">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton />
    </div>
  );
}

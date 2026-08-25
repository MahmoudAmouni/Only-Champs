import { LoginForm } from "@/components/auth/login-form";
import { GoogleButton } from "@/components/auth/google-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-[28px] font-bold tracking-[-0.025em] text-foreground">
          Welcome back
        </h1>
        <p className="mt-1.5 text-sm text-fg-secondary">
          Sign in to pick up where you left off.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="animate-scale-in rounded-md border border-danger/30 bg-danger/10 px-3 py-2.5 text-sm text-danger"
        >
          Something went wrong signing in. Please try again.
        </div>
      )}

      <LoginForm next={next} />

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fg-muted">
          or
        </span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton next={next} />
    </div>
  );
}

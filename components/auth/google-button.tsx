import { signInWithGoogle } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

/**
 * Functional, but actual sign-in won't complete until a Google OAuth
 * provider is configured in Supabase (Authentication → Providers →
 * Google, with a Client ID/Secret from Google Cloud Console) — that's
 * an external credential this project can't set up on its own.
 */
export function GoogleButton({ next }: { next?: string }) {
  const action = signInWithGoogle.bind(null, next);

  return (
    <form action={action}>
      <Button type="submit" variant="secondary" className="w-full">
        Continue with Google
      </Button>
    </form>
  );
}

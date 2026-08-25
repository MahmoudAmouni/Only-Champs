import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * For client components. Carries the anon key plus the signed-in user's
 * session — every query still goes through row-level security. See
 * docs/00-ARCHITECTURE.md §5.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

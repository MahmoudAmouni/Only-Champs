import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * BYPASSES ROW-LEVEL SECURITY.
 *
 * Permitted callers, and only these:
 *   - lib/actions/subscribe.ts  (grants a tier in demo mode — stands in
 *                                for the Stripe webhook, which this
 *                                project ships without on purpose)
 *   - supabase/seed.ts          (dev/demo data)
 *
 * Anywhere else is a bug. If you find yourself importing this to make a
 * query work, an RLS policy is wrong — fix the policy instead. See
 * docs/00-ARCHITECTURE.md §5.
 */
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

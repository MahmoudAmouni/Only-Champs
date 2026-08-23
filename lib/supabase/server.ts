import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * For Server Components, Server Actions, and Route Handlers. Same anon
 * key + user JWT as the browser client, so RLS still applies — server
 * code gets exactly the rows the signed-in user is allowed to see. See
 * docs/00-ARCHITECTURE.md §5.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // proxy.ts refreshes the session on every request, so this is
            // safe to swallow here.
          }
        },
      },
    }
  );
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie on every request (access tokens
 * expire hourly) and gate-keeps the authenticated route groups. This file
 * is named `proxy.ts`, not `middleware.ts` — Next.js 16 renamed the
 * convention (same mechanism). See docs/02-BACKEND.md §2.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Must be getUser(), not getSession(). getSession() reads the cookie
  // without verifying it, so a forged cookie would pass. getUser()
  // validates against the auth server.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isProtected = [
    "/dashboard",
    "/clients",
    "/content",
    "/programs",
    "/messages",
    "/settings",
    "/feed",
    "/today",
    "/progress",
    "/chat",
    "/profile",
    "/onboarding",
    "/discover",
  ].some((p) => path.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp)$).*)",
  ],
};

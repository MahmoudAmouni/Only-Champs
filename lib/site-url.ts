/**
 * The app's own public origin, used to build auth redirect URLs.
 *
 * Reading NEXT_PUBLIC_APP_URL alone is a well-worn way to break a deploy:
 * forget to set it and it is `undefined`, so the confirmation email and the
 * OAuth callback point at `undefined/auth/callback` — or, if it is left at
 * the committed default, at the developer's own localhost. Both fail only
 * in production, and only for people trying to sign in.
 *
 * The fallbacks are ordered by how stable the value is:
 *
 *   NEXT_PUBLIC_APP_URL             an explicit custom domain, always wins
 *   VERCEL_PROJECT_PRODUCTION_URL   the project's stable production domain
 *   VERCEL_URL                      this deployment's unique URL
 *   localhost                       development
 *
 * VERCEL_URL is last among the Vercel values on purpose: it changes with
 * every deployment, so it can never be added to Supabase's redirect
 * allowlist. It is here so preview deployments do something sensible, not
 * as a production answer.
 *
 * Server-side only — VERCEL_* are not exposed to the browser.
 */
export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL;
  if (explicit) return stripTrailingSlash(withProtocol(explicit));

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (production) return stripTrailingSlash(withProtocol(production));

  const deployment = process.env.VERCEL_URL;
  if (deployment) return stripTrailingSlash(withProtocol(deployment));

  return "http://localhost:3000";
}

/** Vercel supplies bare hostnames, with no scheme. */
function withProtocol(value: string) {
  return /^https?:\/\//.test(value) ? value : `https://${value}`;
}

function stripTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

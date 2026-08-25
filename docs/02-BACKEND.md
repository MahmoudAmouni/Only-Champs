# 02 — Backend

There is no separate backend service. "Backend" means the server half of the Next.js
app: Server Components, Server Actions, Route Handlers, and middleware.

This document gives you every file you need to write, in the order to write them.

---

## 1. Project setup

```bash
npx create-next-app@latest only-champs --typescript --tailwind --eslint --app --src-dir=false --import-alias "@/*"
cd only-champs
npm install @supabase/supabase-js @supabase/ssr stripe zod date-fns recharts lucide-react
npm install -D supabase
npx shadcn@latest init
npx shadcn@latest add button card input label textarea select dialog sheet dropdown-menu avatar badge tabs table skeleton sonner separator switch form
```

Then link the database:

```bash
npx supabase init
npx supabase link --project-ref <your-ref>
npx supabase db push
```

## 2. The four Supabase clients

Four files, four purposes. Using the wrong one is the most common bug in this stack,
so read the table before writing any of them.

| File | Runs in | Key | RLS |
|---|---|---|---|
| `lib/supabase/client.ts` | Browser | anon + user JWT | Enforced |
| `lib/supabase/server.ts` | Server components, actions | anon + user JWT | Enforced |
| `proxy.ts` (repo root) | Proxy — runs on every request | anon + user JWT | Enforced |
| `lib/supabase/admin.ts` | Webhook + seed **only** | service role | **Bypassed** |

### `lib/supabase/client.ts`

```ts
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `lib/supabase/server.ts`

```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // Middleware refreshes the session, so this is safe to swallow.
          }
        },
      },
    }
  )
}
```

### `lib/supabase/admin.ts`

```ts
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

/**
 * BYPASSES ROW-LEVEL SECURITY.
 * Permitted callers: app/api/webhooks/stripe/route.ts, supabase/seed.ts
 * Anywhere else is a bug. If you need this to make a query work, an RLS
 * policy is wrong — fix the policy.
 */
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
)
```

Keep that comment. It is the guard rail.

### `proxy.ts` (repo root)

> **Naming note.** This project runs on Next.js 16, which renamed `middleware.ts` to
> `proxy.ts` (same mechanism, same execution model — file and export name only). If
> you're on Next 15 or earlier, name this file `middleware.ts` and export
> `middleware` instead of `proxy`. Check `node_modules/next/package.json` if unsure
> which convention your installed version expects.

Supabase access tokens expire in one hour. Proxy refreshes them on every request;
without it, users are silently logged out mid-session.

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options))
        },
      },
    }
  )

  // Must be getUser(), not getSession(). getSession() reads the cookie without
  // verifying it, so a forged cookie would pass. getUser() validates against
  // the auth server.
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname
  const isProtected = ['/dashboard', '/clients', '/content', '/programs',
                       '/messages', '/settings', '/feed', '/today',
                       '/progress', '/chat'].some(p => path.startsWith(p))

  if (!user && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp)$).*)'],
}
```

> **`getUser()` vs `getSession()`.** `getSession()` decodes the cookie and trusts it.
> `getUser()` verifies it with Supabase. On the server, always use `getUser()`.
> Treating `getSession()` as an auth check is a real authentication bypass.

---

## 3. Auth

Email-and-password plus Google OAuth. Three routes.

### Sign up — `lib/actions/auth.ts`

```ts
'use server'

import { z } from 'zod'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const SignUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'At least 8 characters'),
  fullName: z.string().min(2),
  role: z.enum(['coach', 'client']),
})

export async function signUp(_prev: unknown, formData: FormData) {
  const parsed = SignUpSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { email, password, fullName, role } = parsed.data

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },   // consumed by handle_new_user()
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  })

  if (error) return { error: error.message }

  revalidatePath('/', 'layout')
  redirect(role === 'coach' ? '/onboarding/coach' : '/discover')
}
```

The `options.data` payload lands in `raw_user_meta_data`, which the
`handle_new_user()` trigger reads to populate the profile. That is the link between
the signup form and the database trigger from `01-DATABASE.md`.

### OAuth callback — `app/auth/callback/route.ts`

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
```

### A helper every protected page uses

`lib/queries/auth.ts`:

```ts
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles').select('*, coaches(*)').eq('id', user.id).single()

  return profile ? { ...user, profile } : null
})

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

export async function requireCoach() {
  const user = await requireUser()
  if (!user.profile.coaches) redirect('/onboarding/coach')
  return user
}
```

`cache()` deduplicates within a single render pass, so calling `getCurrentUser()` in a
layout and again in three components costs one query, not four.

---

## 4. Server Actions

Every mutation is a Server Action. They follow one shape, without exception:

```
1. Authenticate      — requireUser() / requireCoach()
2. Validate          — zod parse of the FormData
3. Authorize         — confirm ownership where RLS alone is not enough
4. Mutate            — supabase call, RLS enforces the rest
5. Revalidate        — revalidatePath for affected routes
6. Return            — { error } on failure, redirect or { ok: true } on success
```

> **Never trust a hidden form field.** `coach_id` comes from `auth.uid()`, never from
> the request. A form field is attacker-controlled; the session is not.

### Full catalogue

| Domain | File | Actions |
|---|---|---|
| Auth | `lib/actions/auth.ts` | `signUp`, `signIn`, `signOut`, `signInWithGoogle` |
| Coach profile | `lib/actions/coach.ts` | `createCoachProfile`, `updateCoachProfile`, `publishStorefront`, `checkHandleAvailable` |
| Tiers | `lib/actions/tiers.ts` | `createTier`, `updateTier`, `deactivateTier` |
| Billing | `lib/actions/billing.ts` | `startConnectOnboarding`, `createCheckoutSession`, `openBillingPortal`, `cancelSubscription` |
| Content | `lib/actions/posts.ts` | `createPost`, `updatePost`, `publishPost`, `deletePost`, `getSignedMediaUrl` |
| Programs | `lib/actions/programs.ts` | `createProgram`, `assignProgram`, `addProgramDay`, `addExerciseToDay`, `reorderExercises`, `deleteProgramDay` |
| Logging | `lib/actions/workouts.ts` | `startWorkout`, `logSet`, `completeWorkout` |
| Check-ins | `lib/actions/checkins.ts` | `submitCheckIn`, `replyToCheckIn` |
| Messaging | `lib/actions/messages.ts` | `sendMessage`, `ensureDirectConversation`, `markRead` |

### Reference implementation

```ts
// lib/actions/posts.ts
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/queries/auth'

const PostSchema = z.object({
  title: z.string().min(1).max(140),
  body: z.string().max(10_000).optional(),
  minTierLevel: z.coerce.number().int().min(1).max(3),
  mediaPath: z.string().optional(),
  mediaType: z.enum(['text', 'image', 'video']),
})

export async function createPost(_prev: unknown, formData: FormData) {
  const coach = await requireCoach()

  const parsed = PostSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const supabase = await createClient()
  const { error } = await supabase.from('posts').insert({
    coach_id: coach.id,                 // from the session, never the form
    title: parsed.data.title,
    body: parsed.data.body ?? null,
    min_tier_level: parsed.data.minTierLevel,
    media_path: parsed.data.mediaPath ?? null,
    media_type: parsed.data.mediaType,
    published_at: new Date().toISOString(),
  })

  if (error) return { error: 'Could not publish post.' }

  revalidatePath('/content')
  revalidatePath('/feed')
  return { ok: true }
}
```

### Serving gated media

The only correct way to hand a client a video:

```ts
export async function getSignedMediaUrl(postId: string) {
  const supabase = await createClient()

  // RLS decides this. If the client lacks the tier, the row simply is not
  // returned and we never reach the signing step.
  const { data: post } = await supabase
    .from('posts').select('media_path').eq('id', postId).single()

  if (!post?.media_path) return { error: 'Not available' }

  const { data } = await supabase.storage
    .from('post-media')
    .createSignedUrl(post.media_path, 60 * 60)   // one hour

  return { url: data?.signedUrl }
}
```

The authorization check is the `select` itself. There is no `if (tier >= x)` anywhere,
and there must not be — that is the entire point of putting the rule in Postgres.

---

## 5. Stripe Connect

Money flows **client → platform → coach**. Coaches are Connect Express accounts; the
platform takes an application fee.

### `lib/stripe/index.ts`

```ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  typescript: true,
})

export const PLATFORM_FEE_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT ?? 10)
```

### Step 1 — coach onboarding

```ts
// lib/actions/billing.ts
'use server'
import { redirect } from 'next/navigation'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { requireCoach } from '@/lib/queries/auth'

export async function startConnectOnboarding() {
  const coach = await requireCoach()
  const supabase = await createClient()
  let accountId = coach.profile.coaches.stripe_account_id

  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      email: coach.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_profile: { product_description: 'Online fitness coaching' },
    })
    accountId = account.id
    await supabase.from('coaches')
      .update({ stripe_account_id: accountId }).eq('id', coach.id)
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/payments?refresh=1`,
    return_url:  `${process.env.NEXT_PUBLIC_APP_URL}/settings/payments?done=1`,
    type: 'account_onboarding',
  })

  redirect(link.url)
}
```

Express accounts mean Stripe collects the coach's tax and bank details on their own
hosted pages. We never see or store them, which keeps compliance out of our codebase.

### Step 2 — creating the products for a tier

When a coach saves a tier, mirror it into Stripe:

```ts
const product = await stripe.products.create(
  { name: `${coachName} — ${tier.name}` },
  { stripeAccount: coach.stripe_account_id }
)

const price = await stripe.prices.create(
  {
    product: product.id,
    unit_amount: tier.price_cents,
    currency: tier.currency,
    recurring: { interval: 'month' },
  },
  { stripeAccount: coach.stripe_account_id }
)
// persist product.id and price.id onto the tiers row
```

The `{ stripeAccount }` option creates these **on the coach's connected account**, not
the platform's. Omitting it is a common and confusing mistake — checkout will later
fail with a price-not-found error.

### Step 3 — checkout

```ts
export async function createCheckoutSession(tierId: string) {
  const user = await requireUser()
  const supabase = await createClient()

  const { data: tier } = await supabase
    .from('tiers')
    .select('*, coaches(id, handle, stripe_account_id, stripe_onboarding_complete)')
    .eq('id', tierId).single()

  if (!tier?.coaches?.stripe_onboarding_complete) {
    return { error: 'This coach is not accepting payments yet.' }
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: tier.stripe_price_id!, quantity: 1 }],
    customer_email: user.email,
    subscription_data: {
      application_fee_percent: PLATFORM_FEE_PERCENT,
      transfer_data: { destination: tier.coaches.stripe_account_id! },
      metadata: {
        client_id: user.id,          // read back in the webhook
        coach_id: tier.coaches.id,
        tier_id: tier.id,
      },
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/feed?welcome=1`,
    cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/c/${tier.coaches.handle}`,
  })

  return { url: session.url }
}
```

The `metadata` block is load-bearing. It is how the webhook — which receives no
session cookie and has no idea who was browsing — knows which rows to write.

### Step 4 — the webhook

`app/api/webhooks/stripe/route.ts`. **This is the only place a subscription is
granted.**

```ts
import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type Stripe from 'stripe'

export async function POST(req: Request) {
  const body = await req.text()              // raw body — required for signature check
  const sig = (await headers()).get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body, sig, process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return new NextResponse('Invalid signature', { status: 400 })
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const { client_id, coach_id, tier_id } = sub.metadata

      await supabaseAdmin.from('subscriptions').upsert({
        client_id,
        coach_id,
        tier_id,
        status: sub.status,
        stripe_subscription_id: sub.id,
        stripe_customer_id: sub.customer as string,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      }, { onConflict: 'client_id,coach_id' })
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      await supabaseAdmin.from('subscriptions')
        .update({ status: 'canceled' })
        .eq('stripe_subscription_id', sub.id)
      break
    }

    case 'account.updated': {
      const acct = event.data.object as Stripe.Account
      await supabaseAdmin.from('coaches')
        .update({ stripe_onboarding_complete: acct.charges_enabled })
        .eq('stripe_account_id', acct.id)
      break
    }
  }

  return NextResponse.json({ received: true })
}
```

Four rules for this file:

1. **Verify the signature.** Without `constructEvent`, anyone who finds the URL can
   POST themselves a free subscription.
2. **Read the raw body.** `req.json()` reformats it and the signature check fails.
3. **Be idempotent.** Stripe retries. `upsert` on `(client_id, coach_id)` makes a
   duplicate delivery harmless — which is exactly why that unique constraint exists.
4. **Return 200 quickly.** Non-2xx triggers exponential-backoff retries.

Local development:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the printed `whsec_...` into `STRIPE_WEBHOOK_SECRET`.

---

## 6. Realtime chat

Insert through a Server Action so RLS applies; subscribe in a client component.

```tsx
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useMessages(conversationId: string, initial: Message[]) {
  const [messages, setMessages] = useState(initial)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`conv:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`,
      }, ({ new: row }) => setMessages(prev => [...prev, row as Message]))
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId])

  return messages
}
```

Enable replication once, in SQL:

```sql
alter publication supabase_realtime add table messages;
```

Realtime respects RLS, so a client subscribing to a channel they lack the tier for
receives nothing. The filter is a performance optimisation, not the security boundary.

---

## 7. Seed script

`supabase/seed.ts`, run with `npx tsx supabase/seed.ts`. This is the second and last
legitimate use of the service role key.

Everything is generated from the single `COACHES` array at the top of the file, so
adding a coach means adding one object, not editing eight functions.

It must produce:

- **6 published coaches**, each with their own handle, headline, bio, specialties,
  cover photography and a distinct pricing ladder — a marketplace with one seller in
  it reads as a prototype, and `/discover` needs something to browse
- 3 tiers per coach at levels 1/2/3, priced differently per coach so the ladder
  reads as a coach-level decision rather than a platform constant
- **27 clients** spread across the six rosters, with real-looking names and avatars
- 12–16 posts per coach across all three tier levels, mixed media types
- 60 exercises covering barbell, bodyweight, kettlebell and conditioning work, so
  every coaching style has movements to program with
- **One assigned program per client, plus 2 unassigned templates per coach.** Level 1
  gets a shared starter block, level 2 the group block, level 3 an individually named
  one. Every client having a plan keeps `/today` and `/progress` populated for any
  demo account; what level 3 buys is the coach's attention, not the existence of a plan
- **Workout logs with weights that progress session over session** from a plausible
  starting load. Random per-set weights read as noise on the progress chart and defeat
  the last-session prefill in `/today`, which exists to show what you lifted last time
- 12 weeks of check-ins with varied adherence and progress photos every third week,
  including clients whose adherence and training drop off so the "at risk" panel has
  something real to show
- A direct conversation per level-3 client and a group thread per coach, 28–60
  messages each, timestamps spread across weeks
- **3 clients subscribed to a second coach**, which is what makes the feed's coach
  switcher real rather than dead code

The `stripe_*` columns stay null — this build has no payment processor (see
`05-BUILD-ORDER.md` Phase 6), and `stripe_account_id` is unique, so a shared
placeholder collides on the second coach.

> The seed is not a developer convenience — it is what makes screenshots look like a
> product instead of a tutorial. Budget real time for it, and make the fake data
> plausible. A dashboard showing believable names and three months of trending data
> reads completely differently from one showing "Test User 1".

---

## 8. Error handling

- Server Actions **return** `{ error: string }`; they do not throw. Thrown errors in
  production render a generic page and the user learns nothing.
- Error messages shown to users are human ("Could not publish post."). Raw Postgres
  errors go to `console.error` for you, never to the screen.
- Every route segment gets `error.tsx` and `loading.tsx`.
- Toasts via `sonner`, triggered from the client after an action resolves.

## 9. Performance rules

- **Select columns explicitly.** `select('id, title, published_at')`, never `*`, on
  list endpoints.
- **Paginate.** `.range(0, 19)` on the feed, messages, and client lists.
- Every column used in a `where` or `order by` needs an index — `01-DATABASE.md`
  declares them.
- Aggregate on the server. The dashboard's MRR figure is one SQL sum, not eight
  hundred rows sent to the browser to be added up in JavaScript.
- Default to Server Components. Add `'use client'` only for state, effects, or event
  handlers — chat, the program builder, and forms.

# 00 — Architecture

Read this first. It explains what the system is, what each piece does, and how the
pieces talk to each other. Every other document assumes you have read this one.

---

## 1. What we are building

A subscription platform where **fitness coaches** sell tiered access to **clients**.

There are exactly two kinds of human user:

| Role | What they do |
|---|---|
| **Coach** | Sets up a storefront, defines 1–3 price tiers, publishes content, writes training programs, replies to clients |
| **Client** | Subscribes to a coach at one tier, consumes content, logs workouts, submits check-ins, chats with the coach |

A client subscribes **to a coach**, not to the platform. One person can be a client of
several coaches at once, at different tiers. A coach can also be a client of another
coach. So role is not a fixed property of a person — it is a property of a
relationship. The schema reflects this.

## 2. The one idea that drives the whole design

Access is **tiered and numeric**.

Every tier has an integer `level`:

| Level | Tier | Typical price |
|---|---|---|
| `1` | Content | $10–20/mo |
| `2` | Group | $40–80/mo |
| `3` | 1:1 | $150–400/mo |

Every piece of gated content carries a `min_tier_level`. A client may read it when:

```
they have an ACTIVE subscription to that coach
AND that subscription's tier.level >= content.min_tier_level
```

That single comparison governs posts, group chats, programs, and everything else
gated. Because it is an integer comparison rather than a tangle of role checks, the
rule stays readable as the product grows, and it lives in **one place**: Postgres.

### Why the check lives in the database

If tier gating is implemented in React, then every new component is a fresh chance to
leak paid content, and any bug in a query is a data breach. The application would be
one forgotten `if` away from serving 1:1 material to a $15 subscriber.

Instead we enforce it with **PostgreSQL row-level security (RLS)**. Policies attached
to each table decide which rows a given user can see. The database physically will not
return rows the caller has not paid for — whether the query comes from our UI, from a
server action, from a mis-scoped API route, or from someone poking the auto-generated
REST endpoint with the public anon key.

The frontend then blurs locked posts as a *UX affordance*, not as a security measure.
It is telling the user that something exists; the content itself was never sent.

This is the architectural decision that matters most in the project.
`01-DATABASE.md` implements it.

## 3. System diagram

```
                        ┌───────────────────────────┐
    Browser             │  Next.js on Vercel        │
  (coach + client)      │                           │
        │               │  • React Server Components│
        │  HTTPS        │  • Server Actions         │
        ├──────────────▶│  • Route Handlers (API)   │
        │               │  • Middleware (session)   │
        │               └────────┬──────────┬───────┘
        │                        │          │
        │                        │          │ secret key
        │              anon key  │          │ (server only)
        │              + user    │          │
        │              JWT       ▼          ▼
        │               ┌────────────┐  ┌──────────┐
        ├──────────────▶│  Supabase  │  │  Stripe  │
        │  realtime ws  │            │  │          │
        │               │ • Postgres │  │ • Connect│
        │               │   + RLS    │  │ • Billing│
        │               │ • Auth     │  │ • Webhook│
        │               │ • Storage  │  └────┬─────┘
        │               │ • Realtime │       │
        │               └────────────┘       │
        │                                    │
        │  signed URLs                       │ POST /api/webhooks/stripe
        └────────────────────────────────────┘
```

## 4. The pieces, and why each was chosen

| Piece | Tool | Why this one |
|---|---|---|
| Framework | **Next.js (App Router) + TypeScript** | Server Components let us query Postgres directly from the component that renders it — no API layer to write for reads. One deploy target for site and API. |
| Styling | **Tailwind CSS** | Utility classes keep spacing and colour consistent, because the design tokens become the only vocabulary available. |
| Components | **shadcn/ui** | Copied into the repo rather than installed, so we own and restyle them. Gives accessible primitives (dialog, dropdown, tooltip) without a design-system dependency. |
| DB + Auth + Storage + Realtime | **Supabase** | Real Postgres, so RLS is available — that is the whole architecture. Bundling auth, file storage, and websockets removes three integrations. |
| Payments | **Stripe Connect + Billing** | Money must flow *client → platform → coach*. Connect is the only sane way to do multi-party payouts, and Billing handles recurring charges, retries, and dunning. |
| Charts | **Recharts** | Composable React charts. The coach dashboard needs about four chart types and this covers them. |
| Hosting | **Vercel** | Zero-config for Next.js. Free tier is sufficient. |

## 5. Where code runs, and the security rule that follows

Three execution contexts. Confusing them is the most common way to create a
vulnerability, so learn the distinction now.

**Browser (client components).** Uses the Supabase **anon key** plus the signed-in
user's JWT. The anon key is public and is *meant* to be — it grants nothing on its
own, because RLS decides what the attached user may see. Everything the browser can
reach, it can reach because a policy allows it.

**Server (Server Components, Server Actions, Route Handlers).** Also uses the anon key
plus the user's session by default, so RLS still applies. This is correct and
deliberate: server code should get the same answers the user would.

**Privileged server paths.** A very small number of operations must bypass RLS —
Stripe webhooks writing subscription rows for a user who is not making the request,
and the seed script. These use the **service role key**, which ignores RLS entirely.

> **Rule.** The service role key appears in exactly two places: the Stripe webhook
> handler and the seed script. It is never imported into a file a client component can
> reach, never prefixed `NEXT_PUBLIC_`, and never used "just to make this query work."
> If you reach for it a third time, an RLS policy is wrong — fix the policy.

## 6. Request lifecycles

Three flows worth understanding before you write code.

### A client views a coach's content feed

1. Browser requests `/feed`.
2. Middleware refreshes the Supabase session cookie.
3. The Server Component creates a server Supabase client carrying the user's JWT.
4. It runs `select * from posts where coach_id = $1 order by published_at desc`.
5. **Postgres applies the RLS policy on `posts`**, silently dropping every row whose
   `min_tier_level` exceeds the client's active tier.
6. Separately, the component reads *locked* post metadata — title, thumbnail, tier
   required — from a view that deliberately exposes only those columns.
7. React renders unlocked posts normally and locked ones blurred, with an upgrade CTA.

The body of a locked post never leaves the database.

### A client subscribes

1. Client opens `/c/[handle]` and picks a tier.
2. A Server Action creates a Stripe Checkout Session with `transfer_data.destination`
   set to the coach's connected account, plus our application fee.
3. Browser redirects to Stripe. **We never touch card details.**
4. Stripe charges the card and calls `POST /api/webhooks/stripe`.
5. The handler verifies the signature, then uses the service role key to insert a
   `subscriptions` row with `status = 'active'`.
6. The client returns to `/feed` and — because that row now exists — RLS begins
   returning the tier's content.

Note that **the webhook is what grants access**, not the redirect. A user who
hand-crafts the success URL gets nothing, because no subscription row was written.

### A client sends a message

1. Client types into `/chat` and submits.
2. A Server Action inserts into `messages`. RLS verifies they are a participant in
   that conversation.
3. Supabase Realtime broadcasts the row over websockets.
4. The coach's open browser receives it and appends to the thread — RLS applies to
   realtime too, so nobody receives messages from conversations they are not in.

## 7. Repository layout

```
only-champs/
├── app/
│   ├── (marketing)/            # public landing, no auth
│   ├── (auth)/                 # login, signup
│   ├── c/[handle]/             # public coach storefront
│   ├── (coach)/                # coach app — sidebar layout
│   │   ├── dashboard/
│   │   ├── clients/[id]/
│   │   ├── content/
│   │   ├── programs/
│   │   ├── messages/
│   │   └── settings/
│   ├── (client)/               # client app — bottom-tab layout
│   │   ├── feed/
│   │   ├── today/
│   │   ├── progress/
│   │   └── chat/
│   └── api/
│       └── webhooks/stripe/
├── components/
│   ├── ui/                     # shadcn primitives
│   ├── coach/
│   ├── client/
│   └── shared/
├── lib/
│   ├── supabase/               # server.ts, client.ts, middleware.ts, admin.ts
│   ├── stripe/
│   ├── actions/                # server actions, grouped by domain
│   ├── queries/                # typed read helpers
│   └── utils.ts
├── supabase/
│   ├── migrations/             # numbered SQL, applied in order
│   └── seed.sql
├── types/
│   └── database.ts             # generated from the schema — never hand-edited
└── docs/
```

**Convention: writes live in `lib/actions/`, reads live in `lib/queries/`.** A Server
Component imports from `queries`. A form imports from `actions`. Keeping them apart
means you can audit every mutation in the app by reading one folder.

## 8. Environment variables

Create `.env.local`. Never commit it. `.env.example` — committed — lists the same keys
with empty values.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only — webhook + seed
STRIPE_SECRET_KEY=                # sk_test_... during development
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=            # whsec_... from `stripe listen`
NEXT_PUBLIC_APP_URL=http://localhost:3000
PLATFORM_FEE_PERCENT=10
```

Anything prefixed `NEXT_PUBLIC_` is **compiled into the JavaScript bundle and visible
to anyone**. Only put values there that are safe to publish.

## 9. Reading order

| Document | Covers |
|---|---|
| `01-DATABASE.md` | Every table, column, constraint, index, and RLS policy, as runnable SQL |
| `02-BACKEND.md` | Auth, server actions, Stripe Connect, webhooks, storage, realtime |
| `03-DESIGN-SYSTEM.md` | Colour, type, spacing, and every component's visual spec |
| `04-FRONTEND.md` | Every screen, what is on it, and each of its states |
| `05-BUILD-ORDER.md` | The ordered task list — start here once you have read the rest |

Build in that order. The schema constrains the backend, the backend constrains the
frontend, and the design system constrains how the frontend looks. Working out of
order means rework.

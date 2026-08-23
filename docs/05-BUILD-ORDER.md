# 05 — Build Order

The ordered task list. Work top to bottom. Each phase leaves the app in a working
state, so you can stop at any phase boundary and still have something to show.

Estimates assume one developer working evenings and weekends.

---

## How to use this

Do not skip ahead. The ordering is not arbitrary — each phase depends on the one
before it, and the two most common ways this project fails are:

1. **Building UI before the schema is settled.** Every schema change then means
   rewriting components. Get the database right first; it is the cheapest thing to
   change on day 2 and the most expensive on day 20.
2. **Leaving the seed data until the end.** You will spend weeks looking at empty
   screens, unable to tell whether a layout works, and the "finished" app will get
   screenshotted with three rows of test data in it.

---

## Phase 0 — Foundations · ~3 hours

- [ ] `create-next-app` with TypeScript, Tailwind, App Router
- [ ] Install dependencies and initialise shadcn (`02-BACKEND.md §1`)
- [ ] Create the Supabase project; copy keys into `.env.local`
- [ ] Commit `.env.example` with empty values
- [ ] Paste the design tokens into `app/globals.css` and `tailwind.config.ts`
- [ ] Wire the three fonts in `app/layout.tsx`
- [ ] Build a `/styleguide` page rendering every button variant, input state, badge,
      stat tile, and both themes

**Done when:** `/styleguide` renders correctly in dark and light.

> The styleguide page is not a detour. Every later screen is assembled from these
> pieces, and getting them right once — in isolation, where mistakes are obvious —
> is far faster than discovering a broken button variant on six different screens.
> Delete it before launch, or keep it; it makes a good screenshot either way.

## Phase 1 — Database · ~4 hours

- [ ] Write migrations `00001` through `00009` from `01-DATABASE.md`
- [ ] `supabase db push`
- [ ] Generate types: `supabase gen types typescript --linked > types/database.ts`
- [ ] **Run the policy tests in `01-DATABASE.md §12`** for all five personas
- [ ] Write the four Supabase client files

**Done when:** impersonating a level-1 client returns level-1 posts only, and
`select body from posts where min_tier_level = 3` returns zero rows.

**Do not proceed until this passes.** Everything downstream assumes the gate works.

## Phase 2 — Auth · ~4 hours

- [ ] `middleware.ts` with session refresh and route protection
- [ ] `/login`, `/signup` with the role toggle
- [ ] `signUp`, `signIn`, `signOut` actions
- [ ] Google OAuth + `/auth/callback`
- [ ] `getCurrentUser`, `requireUser`, `requireCoach`
- [ ] Both app shells: coach sidebar layout, client tab-bar layout

**Done when:** you can sign up as each role and land in the right shell, and a
signed-out visit to `/dashboard` redirects to `/login`.

## Phase 3 — Seed data · ~4 hours

Yes, this early. Everything after this point is easier to build and judge with real-
looking data on screen.

- [ ] Write `supabase/seed.ts` to the spec in `02-BACKEND.md §7`
- [ ] Realistic names and avatars; no "Test User"
- [ ] 90 days of weight logs per client, trending down with day-to-day noise
- [ ] Two clients with deliberately declining adherence, for the at-risk panel
- [ ] Conversations with 30–60 messages, timestamps spread over weeks
- [ ] Make it idempotent — you will run it many times

**Done when:** `npx tsx supabase/seed.ts` produces a database that looks like a real
coaching business.

## Phase 4 — Coach core · ~10 hours

- [ ] Onboarding wizard, all four steps, saving per step
- [ ] `/settings` — profile and tiers
- [ ] `/content` list and `/content/new` composer with the tier selector
- [ ] `MediaUploader` against the `post-media` bucket
- [ ] `/clients` table with search, filters, sorting
- [ ] `/clients/[id]` — Overview and Check-ins tabs

**Done when:** a coach can sign up, configure tiers, publish a post at each level, and
see seeded clients.

## Phase 5 — Client core · ~8 hours

- [ ] `/c/[handle]` storefront with the pricing ladder
- [ ] `/feed` with locked and unlocked rendering
- [ ] `<LockedOverlay />` — build this carefully, it is the signature component
- [ ] Signed URLs on play, not on render
- [ ] `/profile` with subscription cards

**Done when:** signing in as a level-1 client shows a feed mixing unlocked posts with
blurred level-2 and level-3 ones — **and DevTools confirms no locked body text is in
the response payload.**

That DevTools check is the moment the architecture proves itself. It is also the
screenshot for your technical post.

## Phase 6 — Payments · ~8 hours

- [ ] Stripe test-mode keys
- [ ] `startConnectOnboarding` with Express accounts
- [ ] Mirror tiers into Stripe products and prices on the connected account
- [ ] `createCheckoutSession` with application fee and `transfer_data`
- [ ] Webhook handler with signature verification
- [ ] `stripe listen` forwarding locally
- [ ] `/settings/payments` status UI

**Done when:** a full loop works — subscribe with test card `4242 4242 4242 4242`, the
webhook writes the row, and previously locked content unlocks on refresh.

## Phase 7 — Training · ~12 hours

The largest phase. The program builder is genuinely fiddly.

- [ ] Exercise library and seeded exercises
- [ ] `/programs` list
- [ ] `/programs/[id]` builder with `@dnd-kit`, inline editing, "copy week"
- [ ] Assign a program to a client
- [ ] `/today` with set logging and prefilled last-session values
- [ ] `/progress` — charts, photos, check-in composer
- [ ] Coach reply to check-ins

**Done when:** a coach builds a program, assigns it, and the client logs a workout that
appears on the coach's dashboard.

## Phase 8 — Messaging · ~6 hours

- [ ] `conversations` and `messages` actions
- [ ] `alter publication supabase_realtime add table messages`
- [ ] `useMessages` realtime hook
- [ ] Coach inbox two-pane; client `/chat`
- [ ] Optimistic sends
- [ ] Level-1 upsell card instead of a dead end

**Done when:** two browsers, coach and client, exchange messages live.

## Phase 9 — Dashboard · ~5 hours

- [ ] Four stat tiles with correct delta polarity
- [ ] Revenue area chart and tier distribution bar
- [ ] At-risk panel
- [ ] Recent check-ins panel
- [ ] New-coach empty state

**Done when:** the dashboard looks like a product. This is your hero screenshot —
spend the extra hour on it.

## Phase 10 — Polish · ~8 hours

- [ ] `loading.tsx` and `error.tsx` for every route
- [ ] Every empty state
- [ ] Skeletons matching real layouts
- [ ] Full pass at 375px
- [ ] Focus rings and `aria-label`s
- [ ] `prefers-reduced-motion`
- [ ] Metadata and OG images
- [ ] Run the checklist in `04-FRONTEND.md §7`

## Phase 11 — Ship · ~4 hours

- [ ] Deploy to Vercel; environment variables set
- [ ] Point the Stripe webhook at the production URL
- [ ] Seed the production database
- [ ] **Demo accounts** — `View as Coach` / `View as Client` buttons on `/login`,
      pre-authenticated
- [ ] README with a screenshot and the live link
- [ ] 45-second screen recording
- [ ] Five-screenshot carousel

The demo-account buttons are the highest-value hour in this phase. Every second
between someone clicking your link and seeing the product costs you half the audience,
and a login wall costs you nearly all of it.

---

## Total

Roughly **75 hours**, or 6–8 weeks of evenings.

**If you need to cut**, cut in this order: Phase 7's builder becomes a simple form,
Phase 8 group chat is dropped, `/discover` is dropped entirely. **Never cut Phase 3
(seed data), Phase 10 (polish), or the demo accounts in Phase 11** — those are what
make the difference between a project that reads as finished and one that reads as
abandoned.

---

## Definition of done

The project is finished when a stranger can:

1. Open the live URL with no account
2. Click "View as Coach" and see a populated dashboard
3. Understand what the product does within ten seconds
4. Switch to "View as Client" and see the locked-content feed
5. Never encounter an empty screen, a spinner that does not resolve, or a broken layout

That is the bar. Not feature count.

---

## The write-up

Plan this before you finish building, so you build toward it.

**Three posts, not one.** A "starting this, here's the problem" post, a mid-build post
about one specific problem you solved, and the launch post. The arc reaches more people
in total than a single reveal.

**The technical hook is row-level security.** Most developers implement paywalls in
application code. Explaining why you pushed the check into Postgres — and showing the
DevTools panel proving locked content never reaches the browser — is a genuinely
interesting post that signals you think about correctness, not just shipping screens.

**Launch post shape:** one line on the problem → 45-second screen recording → three
bullets on what you learned → link in the first comment (LinkedIn suppresses posts with
outbound links in the body; say "link in comments").

Lead the screenshot carousel with the coach dashboard, not the content feed.

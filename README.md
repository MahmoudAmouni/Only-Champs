# OnlyChamps

**A subscription platform for online fitness coaches.**

Sell tiered memberships, deliver programs and video content, and coach clients
directly — from one place.

> **Status:** in active development. Architecture and product scope are defined;
> implementation is underway.

---

## The problem

Online coaching is a real business that runs on duct tape. A typical coach juggles
Instagram for audience, WhatsApp for client communication, Google Sheets for
programming, and bank transfers for payment — with a Notes app tracking who paid and
who's gone quiet.

Two things break as a result:

**Income caps out.** One-to-one coaching stops scaling at roughly 25 clients, because
the coach runs out of hours. Meanwhile they have thousands of followers who would pay
$15/month for something lighter, and no way to serve them.

**Clients churn silently.** Nothing tells the coach that a client hasn't logged a
workout in nine days until the cancellation comes through.

Existing tools force a choice. Coaching software handles 1:1 but ignores audience.
Content platforms handle audience but can't do real coaching. Neither does both.

## The product

Each coach gets a branded storefront with a **pricing ladder** — same coach, one
platform, three levels of access:

| Tier | Price | Includes |
|---|---|---|
| **Content** | $10–20/mo | Video library, weekly program drops, community feed |
| **Group** | $40–80/mo | Above, plus group chat and a shared check-in cadence |
| **1:1** | $150–400/mo | Above, plus custom programming and direct chat |

Clients subscribe, land in the app, and see exactly the level of access they paid for.
Coaches monetize their whole audience instead of only the people who fit in a calendar.

## Features

**Coach**
- Client roster with revenue, retention, and at-risk flags
- Drag-and-drop program builder over a shared exercise library
- Structured weekly check-ins — weight, photos, sleep, adherence — in one view
- Direct and group chat
- Tier-gated content publishing

**Client**
- Today's workout, with video demos and set-by-set logging
- Progress charts and photo timeline
- Direct line to their coach
- A clear upgrade path to more access

## Architecture notes

The core engineering problem is **access control**. Every post, message thread, and
program belongs to exactly one tier, and a client must see only what they have paid
for. That invariant is enforced at the database layer with Postgres row-level
security rather than scattered across application code — a tier check that lives in
the UI is a data leak waiting to happen.

Built around that: realtime chat, Stripe Connect for multi-party payments and payouts,
signed-URL video delivery, and an analytics layer for the coach dashboard.

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Database / Auth | Supabase (Postgres, RLS, Realtime, Storage) |
| Payments | Stripe Connect + Stripe Billing |
| Charts | Recharts |
| Hosting | Vercel |

## Roadmap

- [ ] Schema + row-level security policies for tier gating
- [ ] Seed data
- [ ] Auth and coach onboarding
- [ ] Coach storefront with tiered checkout
- [ ] Tier-gated content feed
- [ ] Realtime coach ↔ client chat
- [ ] Program builder and client workout logging
- [ ] Coach analytics dashboard

## Documentation

The full implementation plan lives in [`docs/`](docs/). Read in order.

| Doc | Covers |
|---|---|
| [00 — Architecture](docs/00-ARCHITECTURE.md) | How the pieces fit, request lifecycles, repo layout, env vars |
| [01 — Database](docs/01-DATABASE.md) | Every table and policy as runnable SQL, including the tier-gating model |
| [02 — Backend](docs/02-BACKEND.md) | Auth, server actions, Stripe Connect, webhooks, storage, realtime |
| [03 — Design System](docs/03-DESIGN-SYSTEM.md) | Colour, type, spacing, motion, and every component spec |
| [04 — Frontend](docs/04-FRONTEND.md) | Every screen, its data, and all of its states |
| [05 — Build Order](docs/05-BUILD-ORDER.md) | The ordered task list, phase by phase |

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase project's keys
npm run db:migrate           # applies supabase/migrations/*.sql
npx tsx supabase/seed.ts     # populates the demo data described below
npm run dev
```

## Demo data

The seed builds a working marketplace rather than a handful of test rows:
**6 coaches**, each with their own pricing ladder, content library and client
roster, and **27 clients** with assigned programs, months of logged workouts,
12 weeks of check-ins and real conversations. Every client has training
history, so no screen in the app renders empty.

Every account uses the password `OnlyChamps2026!`. The sign-in page has
**Coach** and **Client** buttons that fill the form for you, so there is
nothing to type.

| Sign in as | Email | What it shows |
| --- | --- | --- |
| Coach | `marcus.chen@onlychamps.demo` | The fullest roster — 8 clients, $962 MRR, 2 flagged at risk |
| Client, level 1 | `sofia.martins@onlychamps.demo` | Mostly locked feed, and two coaches so the feed switcher is live |
| Client, level 2 | `priya.nair@onlychamps.demo` | Group chat and the shared group block |
| Client, level 3 | `elena.volkov@onlychamps.demo` | Everything unlocked, direct chat with the coach |

The other five coaches are `nadia.rahman@`, `theo.almeida@`, `kaia.lindqvist@`,
`andre.wallace@` and `yuki.tanaka@onlychamps.demo`. Browse all of them at
`/discover`, or visit a storefront directly at `/c/marcus`, `/c/nadia`,
`/c/theo`, `/c/kaia`, `/c/dre`, `/c/yuki` — no account needed.

> **This build has no payment processor.** Subscribing grants the tier
> immediately and free, which means anyone can give themselves any tier. That
> is deliberate for a demo (see `docs/05-BUILD-ORDER.md` Phase 6) and is the
> reason this app must never be pointed at real customer data.

---

Built by [Mahmoud Abou Amoun](https://github.com/MahmoudAmouni).

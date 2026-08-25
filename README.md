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

## Local development

Setup instructions will be added once the application scaffold lands.

---

Built by [Mahmoud Abou Amoun](https://github.com/MahmoudAmouni).

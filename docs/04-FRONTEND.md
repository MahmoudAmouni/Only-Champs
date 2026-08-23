# 04 — Frontend

Every screen in the product, what is on it, where its data comes from, and how it
behaves when things are loading, empty, or broken.

Read `03-DESIGN-SYSTEM.md` first. This document names components and tokens without
re-explaining them.

---

## 1. Route map

| Route | Group | Auth | Purpose |
|---|---|---|---|
| `/` | marketing | public | Landing page |
| `/login` · `/signup` | auth | public | Authentication |
| `/c/[handle]` | public | public | **Coach storefront — the sales page** |
| `/onboarding/coach` | onboarding | coach | Four-step setup wizard |
| `/dashboard` | coach | coach | Business overview |
| `/clients` | coach | coach | Client roster |
| `/clients/[id]` | coach | coach | One client, everything |
| `/content` | coach | coach | Post management |
| `/content/new` | coach | coach | Composer |
| `/programs` · `/programs/[id]` | coach | coach | Program library and builder |
| `/messages` · `/messages/[id]` | coach | coach | Inbox and thread |
| `/settings/*` | coach | coach | Profile, tiers, payments |
| `/discover` | client | client | Find coaches |
| `/feed` | client | client | **Tier-gated content feed** |
| `/today` | client | client | Today's workout |
| `/progress` | client | client | Charts, photos, check-ins |
| `/chat` | client | client | Message the coach |
| `/profile` | client | client | Account and subscriptions |

Two route groups, two layouts: `(coach)` renders the sidebar shell, `(client)` renders
the mobile shell with a bottom tab bar.

## 2. Universal rules

**Server Component by default.** Add `'use client'` only for state, effects, or event
handlers. In practice the client components are: chat, the program builder, all forms,
the media uploader, and chart wrappers.

**Every route segment ships three files:** `page.tsx`, `loading.tsx`, `error.tsx`. The
skeleton in `loading.tsx` must match the real layout's shape — same number of cards,
same heights — so the page does not jump when data lands.

**Every list has four states.** Loading (skeleton), empty (icon + explanation +
action), error (message + retry), populated. Build all four. The empty state is the one
developers skip and reviewers notice.

**Data flows down, mutations go up.** Server Components fetch and pass props. Client
components call Server Actions. No client-side data fetching except realtime chat.

---

## 3. Public screens

### `/c/[handle]` — Coach storefront

The single most important screen. It converts a follower into a paying client, and it
is what a coach shares on Instagram.

**Layout, top to bottom**

1. **Hero** — full-bleed cover image, 320px tall, with a dark gradient scrim from
   transparent to `--bg` so text stays readable over any photo. Avatar 96px, circular,
   4px `--bg` ring, overlapping the scrim's lower edge. Display name in `display`,
   headline in `body-lg fg-secondary`, specialty badges below.
2. **Social proof strip** — active client count, years coaching, a stat or two. `xs
   overline` labels over `h3` values. Skip entirely if the numbers are small; three
   clients advertised is worse than no number.
3. **Pricing ladder** — the three tier cards, side by side at `lg`, stacked below.
   Level 2 marked `RECOMMENDED` by default. This section gets `scroll-mt-24` and an
   anchor, because the hero CTA jumps here.
4. **Preview feed** — six most recent posts via `post_previews`. All locked for a
   signed-out visitor, which is exactly right: it shows the library is real and active.
5. **About** — long-form bio, max 68ch.
6. **Sticky mobile CTA** — below `md`, a fixed bottom bar with "Subscribe from $19"
   that scrolls to the pricing anchor.

**Data:** one query joining `coaches` (by handle, `is_published = true`), its active
`tiers` ordered by level, and the latest six `post_previews`.

**States:** unknown handle or unpublished coach → `notFound()`. A signed-in client who
already subscribes sees "You're subscribed — go to feed" in place of the ladder, with
their current tier highlighted and the higher ones showing "Upgrade".

**SEO:** `generateMetadata` builds the title, description, and an OG image from the
coach's cover. This page will be pasted into Instagram bios, so the link preview
matters commercially.

### `/login` and `/signup`

Centred card, 400px, on `--bg`. Logo above. Email and password fields, primary submit,
"or" divider, Google OAuth button in `secondary`.

Signup adds a **role toggle** — two large selectable cards, "I'm a coach" / "I'm a
client" — because the choice routes the entire onboarding path. Default to client.

Errors render inline above the submit button in `text-danger`, never as a toast.
Submit shows an in-button spinner with the width held so the form does not reflow.

---

## 4. Coach screens

### `/onboarding/coach` — four steps

A stepper with a progress bar. Each step is one decision; do not combine them.

1. **Handle** — live availability check, debounced 400ms, against
   `checkHandleAvailable`. Shows the resulting URL beneath the field as the user
   types: `onlychamps.app/c/marcus`.
2. **Profile** — display name, headline, bio, avatar, cover image.
3. **Tiers** — three pre-filled cards at $19 / $59 / $249 that the coach edits. Any
   tier can be switched off. **Pre-filling matters:** a coach facing three empty price
   fields stalls, and pricing guidance is genuine product value.
4. **Payments** — explains Stripe, single button to `startConnectOnboarding`, returns
   to `/settings/payments?done=1`.

Save each step immediately. A coach who closes the tab at step 3 returns to step 3.

### `/dashboard`

What the coach sees first every morning. Density over decoration.

**Row 1 — four stat tiles:** Monthly revenue (sum of active tier prices, with
month-over-month delta) · Active clients (with new-this-month delta) · At-risk count
(no workout logged in 7 days — delta polarity inverted, up is bad) · Check-ins awaiting
reply.

**Row 2 — revenue chart**, 2/3 width. Area chart, last 6 months, volt line with the
12% fill. Beside it, 1/3 width, **tier distribution** — a horizontal stacked bar in the
three tier colours with a count legend.

**Row 3 — two panels side by side:**

- *Needs attention* — at-risk clients. Avatar, name, "9 days since last workout" in
  `warning`, and a "Message" button that deep-links to their thread. This panel is
  where the product earns its subscription fee, so give it real prominence.
- *Recent check-ins* — last five, weight delta, adherence badge, "Reply" if unanswered.

**Empty state** (a new coach): replace the entire grid with a single centred card —
"Your dashboard fills up once you have clients" plus a "Share your storefront" button
that copies the URL. Never show four zeroes; it reads as broken.

### `/clients`

Full-width table. Columns: avatar + name · tier badge · joined date · last active
(relative, `warning` past 7 days) · adherence (mono %, with a 40px inline bar) · MRR
(mono, right-aligned) · status dot.

Above: search box filtering on name, a tier filter, and a status filter. Sortable
headers. Row click opens the detail. Paginated at 25.

Below `md` the table becomes a card list — tables do not work on phones, and a
horizontally scrolling table is worse than a redesign.

### `/clients/[id]`

Header: avatar, name, tier badge, joined date, MRR. Actions right: "Message",
"Assign program", overflow menu with "Pause" and "Cancel subscription".

Four tabs:

- **Overview** — weight chart (90 days), adherence chart (12 weeks), three stat tiles
  (total workouts, current streak, avg session length), recent activity feed.
- **Program** — current assignment, week accordion, per-day completion ticks, "Edit in
  builder" link.
- **Check-ins** — reverse chronological. Each: week date, weight with delta, sleep,
  adherence, energy, notes, photo thumbnails opening a lightbox, and the coach's reply
  or a reply composer.
- **Logs** — every workout, expandable to set-by-set detail in a mono table.

### `/content` and `/content/new`

**List:** grid of post cards, 3 across at `lg`. Each shows thumbnail, title, tier
badge, publish date, and a view count. Filter tabs: All / Drafts / by tier. Primary
button "New post" top-right.

**Composer:** title, rich body, media dropzone, and a **tier selector rendered as three
radio cards** showing name, level, and how many clients would see it — "Visible to 6
clients". That count turns an abstract setting into a concrete decision and is worth
the extra query.

Live preview panel on the right at `lg`, showing exactly how the post will appear —
including, via a toggle, how it looks *locked* to a lower tier. That toggle is a good
screenshot.

Actions: "Save draft" (`secondary`) and "Publish" (`primary`).

### `/programs/[id]` — the builder

The most interactive screen. `'use client'` throughout.

Left rail 280px: exercise library, searchable, filterable by muscle group, each entry
draggable. Main area: week tabs across the top, day columns beneath, exercises as
draggable rows within a day.

Each exercise row: drag handle · name · sets · reps · RPE · rest · notes · remove.
Sets/reps/RPE are inline-editable inputs, not a modal — a coach building a 4-week
program touches these hundreds of times and a dialog per edit is unusable.

Use `@dnd-kit/core` for drag and drop. Persist on drop with optimistic UI: reorder in
local state immediately, call `reorderExercises`, and revert with a toast if it fails.

"Copy week" duplicates a whole week — the single biggest time-saver, since real
programs repeat with small progressions.

### `/messages`

Two-pane at `lg`: 320px thread list, conversation on the right. Below `lg`, the list is
the page and a thread is a route push.

Thread list rows: avatar, name, tier dot, last message preview truncated to one line,
relative timestamp, unread count as a volt pill. Sorted by `last_message_at`.

Thread view per `03-DESIGN-SYSTEM.md`. Group threads show the tier badge in the header
and sender names above incoming bubbles.

### `/settings`

Tabs: Profile · Tiers · Payments · Account.

**Tiers** is the one that matters. Each tier is an editable card. Changing a price
shows a warning: existing subscribers keep the old price until they change tiers —
because that is how Stripe behaves, and a coach who does not know that will be
confused when their MRR does not move.

**Payments** shows Connect status. If incomplete: a `warning` banner and a "Finish
setup" button. If complete: payout schedule, next payout, and a link to the Stripe
Express dashboard.

---

## 5. Client screens

### `/feed`

Single column, 480px max. Coach switcher at the top if subscribed to more than one.

Posts render in one of two ways:

- **Unlocked:** full card — media, title, body, timestamp. Video plays inline from a
  signed URL fetched on play, not on render. Fetching every signed URL up front would
  mint dozens of unused credentials and slow the page.
- **Locked:** the locked overlay component. Title and duration sharp, thumbnail
  blurred, lock and border in the required tier's colour, upgrade CTA.

Infinite scroll, 10 per page, skeletons while loading.

The mix matters. A feed of entirely locked posts feels like a paywall; entirely
unlocked feels like there is nothing to upgrade for. **Seed data should give a level-1
client roughly 60% unlocked**, so the screen demonstrates both states at once. This is
the screenshot that explains the product.

### `/today`

The screen used mid-workout. Everything is thumb-sized.

Header: day name, week position ("Week 2, Day 3"), progress ring showing sets
completed. Then one card per exercise:

- Name, target sets × reps, RPE.
- Demo video thumbnail that opens a bottom sheet, not a new page.
- A row per set: set number, weight input, reps input, and a large circular check.
- **Weight and reps prefill from the last session's values** — the single most
  requested feature in every training app, and it costs one extra query.
- Tapping the check marks the set done: fills volt, ticks, brief haptic on supported
  devices.

Bottom: "Finish workout", which sets `completed_at` and shows a summary — total
volume, duration, PRs hit.

Empty state (no program assigned): "No program yet" with a "Message your coach"
button.

### `/progress`

Three tabs.

- **Charts** — weight over time (90d / 6m / 1y toggle, Y axis *not* zero-based), total
  volume per week as bars, adherence as a 12-week line.
- **Photos** — grid by check-in date, with a two-up compare mode. Private, always.
- **Check-ins** — history plus the composer for the current week: weight, sleep,
  adherence slider, energy 1–10, notes, up to 4 photos. Once submitted for the week,
  shows the submission and the coach's reply. The `one_per_week` constraint means the
  UI must handle "already submitted" as a normal state, not an error.

### `/chat`

Direct thread with the coach if they hold level 3; group thread if level 2; if level 1,
an upsell card — "Direct messaging is included from the Group tier" with an upgrade
button. Level-1 clients should still see this screen, not a 404. A dead-end tab teaches
them nothing; an upsell converts.

### `/profile`

Account details, unit preference (kg/lb), a subscription card per coach showing tier,
price, renewal date, plus "Change tier" and "Cancel". Cancel opens a confirm dialog
stating access continues until the period end — accurate, and it reduces support
messages.

---

## 6. Shared components to build once

| Component | Notes |
|---|---|
| `<TierBadge level={1..3} />` | Colour and label from one map. Never hand-write tier colours |
| `<LockedOverlay post requiredTier />` | The signature component |
| `<StatTile label value delta invertPolarity? />` | `invertPolarity` for churn and at-risk |
| `<WeightChart data range />` | Enforces the non-zero Y domain |
| `<MediaUploader bucket pathPrefix />` | Progress bar, type and size validation, returns a storage path |
| `<EmptyState icon title action />` | Prevents ad-hoc empty states |
| `<Avatar user size />` | Initials fallback on a deterministic colour from the user id |
| `<RelativeTime date />` | Under a week relative, beyond it absolute |

Centralising `TierBadge` and `LockedOverlay` is what keeps the tier system visually
coherent as the app grows. Every place that displays a tier must go through them.

---

## 7. Frontend checklist

- [ ] Dark theme default; light theme present and correct
- [ ] Every route has `loading.tsx` and `error.tsx`
- [ ] Every list has loading, empty, error, and populated states
- [ ] All numbers use `tabular-nums`
- [ ] Locked posts never receive body or media in the network response — verify in
      DevTools, not by reading the code
- [ ] Touch targets ≥ 44px in the client app
- [ ] Focus rings visible on every interactive element
- [ ] Charts have empty states
- [ ] Client app verified at 375px width
- [ ] Coach app verified at 1280px and 1440px
- [ ] `prefers-reduced-motion` respected

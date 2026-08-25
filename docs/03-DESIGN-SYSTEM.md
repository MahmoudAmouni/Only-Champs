# 03 — Design System

Every visual decision in the product is specified here. If a value is not in this
document, it does not go in the CSS. No arbitrary hex codes, no one-off pixel values,
no "just this once" font sizes.

---

## 1. The look, in one paragraph

**Dark, dense, athletic, and technical.** Near-black backgrounds with a single
high-voltage lime accent. Tight typography with heavy weights for numbers. Thin
borders instead of heavy shadows. Data-dense layouts that respect the fact that a
coach opens this at 6am and wants to see fifteen clients at once, not scroll through
airy marketing cards.

The reference points are performance-tracking tools — Whoop, Strava's analytics,
Linear — not consumer wellness apps. Nothing rounded and pastel. Nothing playful.

**Why dark-first:** it makes video thumbnails and progress photos the brightest thing
on screen, which is correct — the content is the product. It also makes the lime
accent read as genuinely energetic rather than merely loud.

---

## 2. Colour

### 2.1 The palette

**Neutrals — dark theme (default)**

| Token | Hex | Used for |
|---|---|---|
| `--bg` | `#0A0E13` | Page background. Near-black with a blue cast, never pure `#000` |
| `--surface` | `#111820` | Cards, panels, sidebar |
| `--elevated` | `#18212B` | Modals, dropdowns, anything floating above a card |
| `--hover` | `#1F2A36` | Row and button hover states |
| `--border` | `#233040` | Default hairlines |
| `--border-strong` | `#35465C` | Input borders, focused dividers |
| `--text` | `#F0F4F8` | Primary text. Not pure white — pure white on near-black vibrates |
| `--text-secondary` | `#9AA9BC` | Labels, secondary copy, table headers |
| `--text-muted` | `#63748A` | Timestamps, placeholders, disabled |

**Accent — Volt**

| Token | Hex | Used for |
|---|---|---|
| `--volt-400` | `#D6FF4E` | Highlights, chart lines, active icons |
| `--volt-500` | `#C2F03A` | **Primary buttons, key CTAs** |
| `--volt-600` | `#A8D420` | Hover and pressed states |
| `--on-volt` | `#0A0E13` | Text on a volt background — always the dark ink, never white |

Volt is the only saturated colour in the interface. That is deliberate: when exactly
one colour means "act here," every call to action is unmissable without any element
having to shout. **If more than roughly 5% of a screen is volt, something is wrong.**

**Tier colours** — the ladder is the core concept, so each level gets a fixed identity
used consistently on badges, pricing cards, locks, and charts:

| Level | Tier | Token | Hex |
|---|---|---|---|
| 1 | Content | `--tier-1` | `#8CA0B8` — cool slate |
| 2 | Group | `--tier-2` | `#45C8F0` — cyan |
| 3 | 1:1 | `--tier-3` | `#C2F03A` — volt |

Level 3 shares the accent colour on purpose: the most expensive tier reads as the most
valuable because it wears the brand colour.

**Semantic**

| Token | Hex | Meaning |
|---|---|---|
| `--success` | `#3DD68C` | Completed workout, active subscription, payment succeeded |
| `--warning` | `#F5B93B` | Payment past due, adherence dropping |
| `--danger` | `#F45B5B` | Churn risk, cancellation, destructive action |
| `--info` | `#5AA9F0` | Neutral notices |

Never use volt for success. Green means "done," volt means "do." Conflating them makes
completed states look clickable.

### 2.2 The CSS

> **Tailwind version note.** This spec targets **Tailwind v4**, which this project's
> `create-next-app` scaffold installs by default. v4 is CSS-first: there is no
> `tailwind.config.ts` to extend — tokens are declared as CSS variables and mapped to
> Tailwind utilities with an `@theme inline` block in the same file. If your project
> was scaffolded with Tailwind v3 instead, use the config file variant in
> §2.3 below.

`app/globals.css`:

```css
@import "tailwindcss";

:root {
  /* Dark is the default theme. */
  --bg: #0A0E13;
  --surface: #111820;
  --elevated: #18212B;
  --hover: #1F2A36;
  --border: #233040;
  --border-strong: #35465C;
  --text: #F0F4F8;
  --text-secondary: #9AA9BC;
  --text-muted: #63748A;

  --volt-400: #D6FF4E;
  --volt-500: #C2F03A;
  --volt-600: #A8D420;
  --on-volt: #0A0E13;

  --tier-1: #8CA0B8;
  --tier-2: #45C8F0;
  --tier-3: #C2F03A;

  --success: #3DD68C;
  --warning: #F5B93B;
  --danger:  #F45B5B;
  --info:    #5AA9F0;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-xl: 20px;
}

.light {
  --bg: #FFFFFF;
  --surface: #F7F9FB;
  --elevated: #FFFFFF;
  --hover: #EDF1F6;
  --border: #E2E8F0;
  --border-strong: #CBD5E1;
  --text: #0A0E13;
  --text-secondary: #47576B;
  --text-muted: #7A8AA0;

  /* Volt is too bright on white — darken so text on it stays legible. */
  --volt-400: #A8D420;
  --volt-500: #8FB81A;
  --volt-600: #769913;
  --on-volt: #0A0E13;

  --tier-1: #5A6B80;
  --tier-2: #1B9CCC;
  --tier-3: #8FB81A;
}

body {
  background: var(--bg);
  color: var(--text);
  font-feature-settings: 'cv11', 'ss01';
  -webkit-font-smoothing: antialiased;
}

/* Maps the CSS variables above onto Tailwind utility classes: bg-bg, text-fg,
   bg-volt-500, border-border-strong, rounded-lg, font-mono, etc. This block is
   what makes `className="bg-surface text-fg-secondary"` resolve — nothing here
   is optional scaffolding. */
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-elevated: var(--elevated);
  --color-hover: var(--hover);
  --color-border: var(--border);
  --color-border-strong: var(--border-strong);

  --color-fg: var(--text);
  --color-fg-secondary: var(--text-secondary);
  --color-fg-muted: var(--text-muted);

  --color-volt-400: var(--volt-400);
  --color-volt-500: var(--volt-500);
  --color-volt-600: var(--volt-600);
  --color-volt-ink: var(--on-volt);

  --color-tier-1: var(--tier-1);
  --color-tier-2: var(--tier-2);
  --color-tier-3: var(--tier-3);

  --color-success: var(--success);
  --color-warning: var(--warning);
  --color-danger: var(--danger);
  --color-info: var(--info);

  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --radius-xl: var(--radius-xl);

  --font-sans: var(--font-inter);
  --font-display: var(--font-inter-tight);
  --font-mono: var(--font-mono-jetbrains);
}
```

Ship the light theme, but **default to dark and take every screenshot in dark**.

### 2.3 Tailwind v3 variant (only if not on v4)

If the project is on Tailwind v3 instead, keep the same `:root` / `.light` variable
block (drop the `@theme inline` section) and extend colours the classic way in
`tailwind.config.ts`:

```ts
export default {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        elevated: 'var(--elevated)',
        hover: 'var(--hover)',
        border: 'var(--border)',
        'border-strong': 'var(--border-strong)',
        fg: { DEFAULT: 'var(--text)', secondary: 'var(--text-secondary)', muted: 'var(--text-muted)' },
        volt: { 400: 'var(--volt-400)', 500: 'var(--volt-500)', 600: 'var(--volt-600)', ink: 'var(--on-volt)' },
        tier: { 1: 'var(--tier-1)', 2: 'var(--tier-2)', 3: 'var(--tier-3)' },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger:  'var(--danger)',
        info:    'var(--info)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)', md: 'var(--radius-md)',
        lg: 'var(--radius-lg)', xl: 'var(--radius-xl)',
      },
      fontFamily: {
        sans:    ['var(--font-inter)', 'system-ui', 'sans-serif'],
        display: ['var(--font-inter-tight)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
}
```

---

## 3. Typography

Three families, each with one job.

| Role | Family | Where |
|---|---|---|
| Display | **Inter Tight** | Headings, stat values, tier prices, nav brand |
| Body | **Inter** | Everything else |
| Mono | **JetBrains Mono** | Weights, reps, RPE, table numbers, IDs |

Load in `app/layout.tsx`:

```ts
import { Inter, Inter_Tight, JetBrains_Mono } from 'next/font/google'

const inter      = Inter({ subsets: ['latin'], variable: '--font-inter' })
const interTight = Inter_Tight({ subsets: ['latin'], variable: '--font-inter-tight' })
const mono       = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })
```

### The scale

| Name | Size / line-height | Weight | Tracking | Used for |
|---|---|---|---|---|
| `display-lg` | 48 / 52 | 700 | −0.03em | Storefront hero, marketing |
| `display` | 36 / 40 | 700 | −0.02em | Page hero, big stat values |
| `h1` | 30 / 36 | 600 | −0.02em | Page titles |
| `h2` | 24 / 32 | 600 | −0.01em | Section headings |
| `h3` | 20 / 28 | 600 | −0.01em | Card titles |
| `body-lg` | 18 / 28 | 400 | 0 | Post body, long copy |
| `body` | 16 / 24 | 400 | 0 | Default |
| `sm` | 14 / 20 | 400 | 0 | Table cells, secondary |
| `xs` | 12 / 16 | 500 | +0.02em | Labels, badges, timestamps |
| `overline` | 11 / 14 | 600 | +0.08em, uppercase | Stat-tile labels, section eyebrows |

Two non-negotiable rules for numbers:

1. **`font-variant-numeric: tabular-nums`** on every number that appears in a column
   or updates live. Proportional digits make columns jitter and look amateur.
2. **Negative tracking on large display numbers.** At 36px and above, default spacing
   looks loose. `-0.02em` is what makes a stat tile read as designed.

```css
.stat-value {
  font-family: var(--font-inter-tight);
  font-size: 36px; line-height: 40px; font-weight: 700;
  letter-spacing: -0.02em; font-variant-numeric: tabular-nums;
}
```

Maximum line length for body copy: **68 characters** (`max-w-[68ch]`).

---

## 4. Spacing, radius, elevation

**Spacing** — 4px base. Only use: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`.

| Context | Value |
|---|---|
| Inside a badge or chip | 4–8 |
| Inside a button | 8 vertical / 16 horizontal |
| Inside a card | 20 (compact) or 24 (default) |
| Between cards in a grid | 16 |
| Between page sections | 32 |
| Page padding — mobile | 16 |
| Page padding — desktop | 32 |

**Radius**

| Token | Value | Applied to |
|---|---|---|
| `sm` | 6px | Badges, chips, small inputs |
| `md` | 10px | Buttons, inputs, dropdown items |
| `lg` | 14px | Cards, panels, dialogs |
| `xl` | 20px | Media thumbnails, hero blocks |
| `full` | 9999px | Avatars, pills, toggles |

Consistency matters more than the specific numbers. A card at `lg` containing a button
at `md` reads correctly; the reverse looks broken.

**Elevation.** In a dark UI, drop shadows are nearly invisible — depth comes from
**background lightness plus border**.

| Level | Recipe |
|---|---|
| Flat | `bg-surface` |
| Raised (card) | `bg-surface` + `border border-border` |
| Floating (dropdown, dialog) | `bg-elevated` + `border border-border` + `shadow-[0_16px_48px_rgba(0,0,0,0.5)]` |
| Focus / active | `border-volt-500` + `ring-2 ring-volt-500/20` |

One accent glow is permitted, on the primary CTA only:
`shadow-[0_0_24px_rgba(194,240,58,0.15)]`. Used anywhere else it becomes noise.

---

## 5. Layout

**Breakpoints:** `sm 640` · `md 768` · `lg 1024` · `xl 1280`

### Coach app — desktop-first

Coaches work at a desk. Optimise for information density.

```
┌────────────┬──────────────────────────────────────────┐
│            │  Topbar 64px — page title, search, avatar│
│  Sidebar   ├──────────────────────────────────────────┤
│  240px     │                                          │
│  fixed     │  Content, max-width 1280, padding 32     │
│            │                                          │
└────────────┴──────────────────────────────────────────┘
```

Below `lg`, the sidebar collapses into a `Sheet` behind a hamburger.

### Client app — mobile-first

Clients are on a phone, often mid-workout with one hand.

```
┌──────────────────────┐
│ Header 56px          │
├──────────────────────┤
│                      │
│ Content              │
│ max-width 480        │
│ padding 16           │
│                      │
├──────────────────────┤
│ Tab bar 64px + safe  │  Feed · Today · Progress · Chat
└──────────────────────┘
```

On desktop the client app centres at 480px with the tab bar still at the bottom. It
should look deliberately like a phone app, because that is how it will be used — and
it photographs well in a device frame for the screenshot carousel.

**Touch targets are 44×44px minimum.** A client tapping "complete set" with sweaty
hands between reps needs a target they cannot miss.

---

## 6. Components

### Button

| Design intent | Background | Text | Border | Use |
|---|---|---|---|---|
| primary | `volt-500` | `volt-ink` | none | One per screen. The main action |
| secondary | `surface` | `fg` | `border` | Common actions |
| ghost | transparent | `fg-secondary` | none | Toolbar and icon actions |
| danger | transparent | `danger` | `danger/30` | Cancel, delete, remove |

> **Variant naming.** The shadcn CLI installed for this project names these
> variants `default` / `secondary` / `ghost` / `destructive` (plus `outline` and
> `link`, which this spec doesn't otherwise define — `outline` behaves like a
> bordered secondary, `link` is text-only for inline actions). Use those literal
> prop values in code (`<Button variant="default">`); the table above is the
> design intent behind each one, not the prop name.

| Size | Height | Padding | Text |
|---|---|---|---|
| `sm` | 32 | 0 12 | 14 |
| `md` | 40 | 0 16 | 14 |
| `lg` | 48 | 0 24 | 16 |

States — hover: one step darker (`volt-600`) or `bg-hover`. Active: `scale(0.98)`.
Disabled: `opacity-50`, `cursor-not-allowed`. Loading: spinner replaces the label,
width **held fixed** so the layout does not jump. Focus: `ring-2 ring-volt-500/40`,
never `outline: none` without a replacement.

### Input

Height 40 · `bg-bg` (darker than the card it sits on, so fields read as recessed) ·
`border-border` · radius `md` · 12px horizontal padding · placeholder `fg-muted`.
Focus: `border-volt-500` + `ring-2 ring-volt-500/20`. Error: `border-danger`, message
below in `xs` `text-danger`. Label above in `xs` `fg-secondary`, 6px gap.

### Card

`bg-surface` · `border border-border` · radius `lg` · padding 24. Header row: `h3`
title left, action right. Hover only when the whole card is clickable —
`hover:border-border-strong`, 150ms.

### Stat tile

The dashboard's primary unit. Four across on desktop, two on mobile.

```
┌────────────────────────┐
│ MONTHLY REVENUE        │  overline, fg-secondary
│ $4,280                 │  stat-value, fg
│ ▲ 12.4% vs last month  │  xs, success (or danger if negative)
└────────────────────────┘
```

Padding 20, radius `lg`, `bg-surface`, `border-border`. The delta line uses
`success` for up and `danger` for down — except for churn, where the polarity inverts.
**Check the polarity on every metric.** A green rising churn number is a real bug and
an embarrassing screenshot.

### Tier card

Used on the storefront. Three side by side on desktop, stacked on mobile.

- Border in the tier colour at 30% opacity; the recommended tier gets it at 100% plus
  a `RECOMMENDED` badge in that colour.
- Tier name in `overline`, tier colour.
- Price in `display`, with `/month` in `sm fg-muted` on the same baseline.
- Features as a list, each with a check icon in the tier colour, `sm` text.
- CTA fills the card width: volt `primary` for the recommended tier, `secondary` for
  the others.
- Recommended card scales to `1.03` and sits on `bg-elevated`.

### Locked content overlay — the signature component

This is the component that communicates the entire business model, and the one that
will appear in your screenshots. Build it carefully.

```
┌────────────────────────────────┐
│ ▓▓▓▓▓▓▓ blurred thumbnail ▓▓▓▓ │  blur(16px) + brightness(0.4)
│                                │
│           🔒                   │  lock icon 24px, tier colour
│      1:1 members only          │  sm, weight 600, fg
│   Upgrade to unlock this video │  xs, fg-secondary
│                                │
│      [  Upgrade — $249/mo  ]   │  primary button, sm
└────────────────────────────────┘
```

Rules:

- The **thumbnail** is blurred, never the body. The body was never fetched. The blur
  is decoration over data the client is already allowed to see.
- Title and duration stay **sharp and readable** above the blurred area. The client
  should know exactly what they are missing — that is what drives the upgrade.
- The lock icon and border take the colour of the **required** tier, so the ladder is
  legible at a glance.
- Hover lifts the overlay slightly (`translateY(-2px)`) and brightens the border.

### Chat

- Bubbles `max-w-[75%]`, radius `lg` with the corner nearest the sender squared to
  `sm`.
- Outgoing: `bg-volt-500`, `text-volt-ink`, right-aligned.
- Incoming: `bg-elevated`, `text-fg`, left-aligned, 32px avatar.
- Timestamp `xs fg-muted`, shown on hover for desktop and always on mobile.
- Date separators: centred `xs fg-muted` pill on `bg-surface`.
- Composer pinned to the bottom, `bg-surface`, top border, textarea auto-growing to a
  max of 5 lines.
- Unsent messages render at `opacity-60` until the insert confirms — optimistic UI.

### Table (coach client list)

Header row: `xs overline fg-secondary`, `bg-surface`, bottom border. Rows 56px,
`hover:bg-hover`, bottom border `border`. Numeric columns right-aligned and mono.
Sticky header when the list scrolls. Row click opens the client detail.

Every row carries a status dot: `success` active · `warning` past due · `danger`
at risk · `fg-muted` cancelled.

### Badge

Height 22 · radius `sm` · padding 0 8 · `xs` weight 500 · background = colour at 12%
opacity · text and border = colour at 100% / 25%.

### Charts (Recharts)

| Element | Spec |
|---|---|
| Line | 2px, `volt-500`, no dots except on hover |
| Area fill | `volt-500` at 12%, fading to 0 |
| Grid | horizontal only, 1px, `border`, no vertical lines |
| Axes | no axis lines; `xs fg-muted` labels |
| Tooltip | `bg-elevated`, `border-border`, radius `md`, padding 12, mono values |
| Multi-series | tier colours in ladder order |
| Empty | "No data yet" centred in `fg-muted`, never a blank box |

Weight charts must **not** start the Y axis at zero. A 4kg loss on a 0–100 axis is a
flat line. Use `domain={['dataMin - 2', 'dataMax + 2']}`.

### Empty states

Every list needs one: icon 32px `fg-muted`, one-line explanation in `fg-secondary`, one
primary action. Never an empty container.

### Loading

**Skeletons, not spinners**, for content — matching the real layout's shape, `bg-hover`
with a 1.5s shimmer. Spinners only inside buttons.

---

## 7. Motion

| Duration | Use |
|---|---|
| 120ms | Hover, focus, colour change |
| 200ms | Dropdowns, tooltips, accordions |
| 320ms | Dialogs, sheets, page transitions |

Easing: `cubic-bezier(0.2, 0, 0, 1)` for entrances, `ease-out` for exits.

Animate `transform` and `opacity` only — animating `width`, `height`, or `top` forces
layout on every frame and drops the framerate on the mid-range Android phone your
client is actually holding.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Accessibility

Not optional, and cheap to get right if done from the start.

- **Contrast:** body text ≥ 4.5:1, large text ≥ 3:1. The palette is built for this —
  `--text-muted` on `--surface` is the tightest pairing, so never place body copy in
  muted on anything lighter.
- **Volt needs dark ink.** `--on-volt` is `#0A0E13`. White on volt fails contrast
  badly. Never override this.
- **Focus is always visible.** Every interactive element shows `ring-2
  ring-volt-500/40`. If you remove an outline, replace it.
- **Colour is never the only signal.** Status dots carry a text label; chart series
  carry a legend; the at-risk row says "At risk," not just red.
- Icon-only buttons need `aria-label`.
- Dialogs trap focus and close on `Escape` — shadcn handles this; do not rebuild it.
- Forms use real `<label for>`, and errors are wired with `aria-describedby`.

---

## 9. Writing style

The interface's words are part of the design.

- **Sentence case everywhere.** Not Title Case. Not ALL CAPS except `overline`.
- Buttons are verbs: "Publish post", not "Submit".
- Numbers are formatted: `$4,280` and `12.4%`, never `4280` and `0.124`.
- Dates are relative under a week ("3 days ago"), absolute beyond it ("12 Mar").
- Weights display in the client's chosen unit; the database is always kg.
- Errors say what to do: "Add at least one exercise before assigning this program",
  not "Validation failed".
- Never use "OnlyFans" anywhere in the product copy.

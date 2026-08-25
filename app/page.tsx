import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Dumbbell,
  Lock,
  MessageCircle,
  Quote,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AmbientBackdrop } from "@/components/marketing/ambient-backdrop";
import { AppMockup } from "@/components/marketing/app-mockup";
import { PhoneMockup } from "@/components/marketing/phone-mockup";
import {
  Counter,
  MaskReveal,
  Reveal,
  TiltCard,
} from "@/components/marketing/motion";

/**
 * Request a generous source from Unsplash and let next/image do the single
 * downscale + compress pass per breakpoint. Two reasons the source is
 * deliberately large: next/image never upscales past the source, so a
 * small one goes soft on retina/wide screens where `fill` asks for up to
 * 3840px; and compressing twice (Unsplash, then Next) compounds artifacts.
 */
const PHOTO = (id: string, w = 1600) =>
  `https://images.unsplash.com/${id}?w=${w}&q=82&auto=format&fit=crop`;

const TIERS = [
  {
    level: 1,
    name: "Content",
    price: 19,
    blurb: "Video library, weekly drops, community feed.",
    accent: "text-tier-1",
    dot: "bg-tier-1",
    ring: "ring-tier-1/20",
  },
  {
    level: 2,
    name: "Group",
    price: 59,
    blurb: "Everything above, plus group chat and check-ins.",
    accent: "text-tier-2",
    dot: "bg-tier-2",
    ring: "ring-tier-2/25",
  },
  {
    level: 3,
    name: "1:1",
    price: 249,
    blurb: "Everything above, plus custom programming and direct access.",
    accent: "text-tier-3",
    dot: "bg-tier-3",
    ring: "ring-tier-3/35",
  },
];

const FEATURES = [
  {
    icon: Lock,
    title: "Tier-gated content",
    body: "Access is enforced in Postgres, not the UI. A locked post's body never reaches the browser — it isn't blurred, it's never sent.",
    photo: "photo-1517836357463-d25dfeac3438",
  },
  {
    icon: Dumbbell,
    title: "Program builder",
    body: "Build a week, copy it forward, adjust the progression. Assign it to a client in two clicks.",
    photo: "photo-1571019613454-1cb2f99b2d8b",
  },
  {
    icon: CalendarCheck,
    title: "Workout logging",
    body: "Set-by-set logging with last session's numbers prefilled. Big targets, one-handed, mid-workout.",
    photo: "photo-1534438327276-14e5300c3a48",
  },
  {
    icon: MessageCircle,
    title: "Realtime chat",
    body: "Direct threads for 1:1 clients, a shared room for the group tier. Messages land instantly.",
    photo: "photo-1541534741688-6078c6bfb5c5",
  },
  {
    icon: BarChart3,
    title: "Retention signals",
    body: "See who hasn't trained in a week before the cancellation email arrives, not after.",
    photo: "photo-1550345332-09e3ac987658",
  },
  {
    icon: Users,
    title: "One roster, every tier",
    body: "Serve five clients at $249 and five hundred at $19 without running two businesses.",
    photo: "photo-1518611012118-696072aa579a",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I was capped at 22 one-to-one clients and turning people away. Now the same audience pays me three different ways and I coach fewer hours.",
    name: "Marcus Chen",
    role: "Strength coach · 42 clients",
    img: 12,
  },
  {
    quote:
      "The at-risk panel is the whole thing for me. I catch someone drifting on day eight instead of finding out when the payment stops.",
    name: "Priya Nair",
    role: "Physique coach · 130 clients",
    img: 47,
  },
  {
    quote:
      "Programming used to live in three spreadsheets. I built a four-week block in twenty minutes and pushed it to eleven people at once.",
    name: "Daniel Osei",
    role: "Powerlifting coach · 58 clients",
    img: 33,
  },
];

const GALLERY = [
  "photo-1583454110551-21f2fa2afe61",
  "photo-1566241440091-ec10de8db2e1",
  "photo-1581009146145-b5ef050c2e1e",
  "photo-1584466977773-e625c37cdd50",
  "photo-1546483875-ad9014c88eba",
  "photo-1571019613454-1cb2f99b2d8b",
];

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* ---------------------------------------------------------------- nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              render={<Link href="/login" />}
              nativeButton={false}
            >
              Sign in
            </Button>
            <Button size="sm" render={<Link href="/signup" />} nativeButton={false}>
              Start free
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ------------------------------------------------------------- hero */}
        <section className="relative isolate overflow-hidden px-6 pb-20 pt-20 sm:pt-28">
          <AmbientBackdrop />

          <div className="relative mx-auto max-w-3xl text-center">
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-fg-secondary backdrop-blur">
              <Sparkles className="size-3 text-volt-500" />
              Built for online coaches
            </div>

            <h1 className="animate-fade-up delay-100 mt-6 font-display text-[44px] font-bold leading-[1.05] tracking-[-0.035em] sm:text-[68px]">
              <span className="text-gradient-chrome">Your whole coaching</span>
              <br />
              <span className="text-gradient-chrome">business, </span>
              <span className="text-gradient-volt">one platform</span>
            </h1>

            <p className="animate-fade-up delay-200 mx-auto mt-6 max-w-[54ch] text-lg leading-relaxed text-fg-secondary">
              Sell tiered memberships, deliver programs and video content, and
              coach clients directly. Stop running your business across Instagram,
              WhatsApp and a spreadsheet.
            </p>

            <div className="animate-fade-up delay-300 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                className="glow-volt group w-full sm:w-auto"
                render={<Link href="/signup" />}
                nativeButton={false}
              >
                Start coaching free
                <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="w-full sm:w-auto"
                render={<Link href="/c/marcus" />}
                nativeButton={false}
              >
                See a live storefront
              </Button>
            </div>

            <p className="animate-fade-up delay-400 mt-5 text-xs text-fg-muted">
              No card required · Your first client in under 10 minutes
            </p>
          </div>

          {/* product shot */}
          <div className="animate-fade-up delay-500 relative mx-auto mt-16 max-w-5xl">
            <div
              aria-hidden
              className="absolute inset-x-10 -top-6 bottom-10 rounded-full bg-volt-500/10 blur-3xl"
            />
            <TiltCard className="relative" max={4}>
              <AppMockup />
            </TiltCard>
          </div>

          {/* proof strip */}
          <Reveal delay={120} className="mx-auto mt-16 max-w-4xl">
            <div className="grid grid-cols-2 gap-6 border-y border-border/60 py-8 sm:grid-cols-4">
              {[
                { v: 2400, suffix: "+", label: "Coaches" },
                { v: 91000, prefix: "", suffix: "+", label: "Clients trained" },
                { v: 38, suffix: "%", label: "Avg. revenue lift" },
                { v: 12, suffix: "min", label: "Setup time" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="font-display text-[28px] font-bold tracking-[-0.03em] text-foreground">
                    <Counter value={s.v} prefix={s.prefix} suffix={s.suffix} />
                  </div>
                  <div className="mt-1 text-xs text-fg-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </section>

        {/* ------------------------------------------------------ tier ladder */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
                The pricing ladder
              </p>
              <MaskReveal>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-[-0.025em] text-foreground sm:text-4xl">
                <span className="mask-line"><span>One coach. One roster.{" "}
                <span className="text-gradient-volt">Three levels.</span></span></span>
              </h2>
            </MaskReveal>
              <p className="mx-auto mt-4 max-w-[52ch] text-base text-fg-secondary">
                Most tools force a choice: one-to-one software, or a content
                platform. Running both means running two businesses.
              </p>
            </Reveal>

            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {TIERS.map((tier, i) => (
                <Reveal key={tier.level} delay={i * 110}>
                  <div
                    className={`lift surface-sheen h-full rounded-lg border border-border bg-card/70 p-6 ring-1 backdrop-blur hover:border-border-strong ${tier.ring}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`size-1.5 rounded-full ${tier.dot}`} />
                      <span
                        className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${tier.accent}`}
                      >
                        {tier.name}
                      </span>
                    </div>
                    <p className="mt-3 font-display text-[36px] font-bold leading-none tracking-[-0.03em] tabular-nums text-foreground">
                      ${tier.price}
                      <span className="ml-1 text-sm font-normal text-fg-muted">
                        /mo
                      </span>
                    </p>
                    <p className="card-body mt-3 text-sm leading-relaxed text-fg-secondary">
                      {tier.blurb}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------- gating (phone shot) */}
        <section className="relative isolate overflow-hidden border-y border-border/60 bg-card/30 px-6 py-24">
          <div className="mx-auto grid max-w-5xl items-center gap-14 lg:grid-cols-2">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
                How the gate works
              </p>
              <MaskReveal>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-[-0.025em] text-foreground sm:text-4xl">
                <span className="mask-line"><span>Locked content is never sent — not blurred.</span></span>
              </h2>
            </MaskReveal>
              <p className="mt-5 text-base leading-relaxed text-fg-secondary">
                Every post carries a tier level. Postgres row-level security
                decides what a given client can read before a single row leaves
                the database, so a paywall bug in the interface can&apos;t leak
                paid material.
              </p>
              <p className="mt-4 text-base leading-relaxed text-fg-secondary">
                Clients still see that higher-tier content{" "}
                <span className="text-foreground">exists</span> — the title, the
                length, the tier it needs. That&apos;s what drives the upgrade.
              </p>

              <ul className="mt-7 space-y-3">
                {[
                  "Title and duration stay sharp",
                  "Thumbnail blurred as an affordance, not a shield",
                  "Body and media URL never leave Postgres",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2.5 text-sm">
                    <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-volt-500/12">
                      <Lock className="size-2.5 text-volt-500" />
                    </span>
                    <span className="text-fg-secondary">{t}</span>
                  </li>
                ))}
              </ul>
            </Reveal>

            <Reveal delay={140} className="flex justify-center">
              <TiltCard max={7}>
                <PhoneMockup />
              </TiltCard>
            </Reveal>
          </div>
        </section>

        {/* --------------------------------------------------------- features */}
        <section className="px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <Reveal className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
                What&apos;s inside
              </p>
              <MaskReveal>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-[-0.025em] text-foreground sm:text-4xl">
                <span className="mask-line"><span>Everything the job actually needs.</span></span>
              </h2>
            </MaskReveal>
            </Reveal>

            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body, photo }, i) => (
                <Reveal key={title} delay={(i % 3) * 100}>
                  <article className="lift surface-sheen group h-full overflow-hidden rounded-lg border border-border bg-card hover:border-border-strong">
                    <div className="relative h-36 overflow-hidden">
                      <Image
                        src={PHOTO(photo)}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover grayscale-[0.35] transition-all duration-700 group-hover:scale-[1.06] group-hover:grayscale-0"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/45 to-transparent" />
                      <span className="absolute bottom-3 left-3 flex size-9 items-center justify-center rounded-md bg-background/70 ring-1 ring-volt-500/25 backdrop-blur-sm">
                        <Icon className="size-4 text-volt-500" />
                      </span>
                    </div>
                    <div className="p-5">
                      <h3 className="card-title text-base font-semibold tracking-[-0.01em] text-foreground">
                        {title}
                      </h3>
                      <p className="card-body mt-2 text-sm leading-relaxed text-fg-secondary">
                        {body}
                      </p>
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ----------------------------------------------------- testimonials */}
        <section className="border-y border-border/60 bg-card/30 px-6 py-24">
          <div className="mx-auto max-w-5xl">
            <Reveal className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
                From the field
              </p>
              <MaskReveal>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-[-0.025em] text-foreground sm:text-4xl">
                <span className="mask-line"><span>Coaches who stopped trading hours for ceiling.</span></span>
              </h2>
            </MaskReveal>
            </Reveal>

            <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-3">
              {TESTIMONIALS.map((t, i) => (
                <Reveal key={t.name} delay={i * 110}>
                  <figure className="lift surface-sheen flex h-full flex-col rounded-lg border border-border bg-card p-6 hover:border-border-strong">
                    <Quote className="size-5 shrink-0 text-volt-500/50" />
                    <blockquote className="card-body mt-4 flex-1 text-sm leading-relaxed text-fg-secondary">
                      “{t.quote}”
                    </blockquote>
                    <div className="mt-1 flex gap-0.5 pt-5">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          className="size-3 fill-volt-500 text-volt-500"
                        />
                      ))}
                    </div>
                    <figcaption className="mt-4 flex items-center gap-3 border-t border-border pt-4">
                      <Image
                        src={`https://i.pravatar.cc/96?img=${t.img}`}
                        alt=""
                        width={36}
                        height={36}
                        className="size-9 rounded-full object-cover ring-1 ring-border"
                        unoptimized
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-foreground">
                          {t.name}
                        </div>
                        <div className="truncate text-xs text-fg-muted">
                          {t.role}
                        </div>
                      </div>
                    </figcaption>
                  </figure>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------- gallery */}
        <section className="overflow-hidden px-6 py-20">
          <Reveal className="mx-auto mb-10 max-w-2xl text-center">
            <MaskReveal>
              <h2 className="font-display text-3xl font-semibold tracking-[-0.025em] text-foreground">
                <span className="mask-line"><span>Built for the work that happens{" "}
              <span className="text-gradient-volt">under the bar</span></span></span>
              </h2>
            </MaskReveal>
          </Reveal>

          <Reveal delay={100}>
            {/* Duplicated track so the marquee loops seamlessly at -50%. */}
            <div className="relative">
              <div className="flex w-max animate-marquee gap-4">
                {[...GALLERY, ...GALLERY].map((id, i) => (
                  <div
                    key={`${id}-${i}`}
                    className="relative h-44 w-64 shrink-0 overflow-hidden rounded-lg border border-border sm:h-52 sm:w-80"
                  >
                    <Image
                      src={PHOTO(id, 900)}
                      alt=""
                      fill
                      sizes="320px"
                      className="object-cover grayscale-[0.4] transition-all duration-500 hover:grayscale-0"
                    />
                  </div>
                ))}
              </div>
              {/* Feather both ends so images enter and exit, not pop. */}
              <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-background to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-background to-transparent" />
            </div>
          </Reveal>
        </section>

        {/* -------------------------------------------------------- final CTA */}
        <section className="relative isolate overflow-hidden px-6 py-28">
          <AmbientBackdrop variant="cool" />
          <Reveal className="relative mx-auto max-w-2xl text-center">
            <MaskReveal>
              <h2 className="font-display text-4xl font-bold leading-[1.1] tracking-[-0.03em] text-foreground sm:text-5xl">
                <span className="mask-line"><span>Start earning from the{" "}
              <span className="text-gradient-volt">whole audience</span></span></span>
              </h2>
            </MaskReveal>
            <p className="mx-auto mt-5 max-w-[48ch] text-lg text-fg-secondary">
              Set up your storefront, pick your tiers, share one link. That&apos;s
              the whole setup.
            </p>
            <Button
              size="lg"
              className="glow-volt-lg group mt-9"
              render={<Link href="/signup" />}
              nativeButton={false}
            >
              Create your storefront
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </Button>
            <p className="mt-4 text-xs text-fg-muted">
              Free to start · No card required
            </p>
          </Reveal>
        </section>
      </main>

      {/* ------------------------------------------------------------- footer */}
      <footer className="border-t border-border/60 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Logo markClassName="size-5" />
          <p className="text-xs text-fg-muted">
            A subscription platform for online fitness coaches.
          </p>
        </div>
      </footer>
    </div>
  );
}

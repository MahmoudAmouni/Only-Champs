import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarCheck,
  Dumbbell,
  Lock,
  MessageCircle,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AmbientBackdrop } from "@/components/marketing/ambient-backdrop";

const TIERS = [
  {
    level: 1,
    name: "Content",
    price: 19,
    blurb: "Video library, weekly drops, community feed.",
    accent: "text-tier-1",
    ring: "ring-tier-1/25",
    dot: "bg-tier-1",
  },
  {
    level: 2,
    name: "Group",
    price: 59,
    blurb: "Everything above, plus group chat and check-ins.",
    accent: "text-tier-2",
    ring: "ring-tier-2/30",
    dot: "bg-tier-2",
  },
  {
    level: 3,
    name: "1:1",
    price: 249,
    blurb: "Everything above, plus custom programming and direct access.",
    accent: "text-tier-3",
    ring: "ring-tier-3/40",
    dot: "bg-tier-3",
  },
];

const FEATURES = [
  {
    icon: Lock,
    title: "Tier-gated content",
    body: "Access is enforced in Postgres, not the UI. A locked post's body never reaches the browser — it isn't blurred, it's never sent.",
  },
  {
    icon: Dumbbell,
    title: "Program builder",
    body: "Build a week, copy it forward, adjust the progression. Assign it to a client in two clicks.",
  },
  {
    icon: CalendarCheck,
    title: "Workout logging",
    body: "Set-by-set logging with last session's numbers prefilled. Big targets, one-handed, mid-workout.",
  },
  {
    icon: MessageCircle,
    title: "Realtime chat",
    body: "Direct threads for 1:1 clients, a shared room for the group tier. Messages land instantly.",
  },
  {
    icon: BarChart3,
    title: "Retention signals",
    body: "See who hasn't trained in a week before the cancellation email arrives, not after.",
  },
  {
    icon: Users,
    title: "One roster, every tier",
    body: "Serve five clients at $249 and five hundred at $19 without running two businesses.",
  },
];

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col bg-background">
      {/* ---------------------------------------------------------------- nav */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="font-display text-lg font-bold tracking-[-0.02em] text-foreground"
          >
            OnlyChamps
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
        <section className="relative isolate overflow-hidden px-6 pb-24 pt-20 sm:pt-28">
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

          {/* ------------------------------------------------ the tier ladder */}
          <div className="animate-fade-up delay-500 relative mx-auto mt-20 max-w-4xl">
            <div className="mb-5 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
                The pricing ladder
              </p>
            </div>

            <div className="stagger grid grid-cols-1 gap-4 sm:grid-cols-3">
              {TIERS.map((tier) => (
                <div
                  key={tier.level}
                  className={`lift surface-sheen relative overflow-hidden rounded-lg border border-border bg-card/70 p-5 ring-1 backdrop-blur ${tier.ring} hover:border-border-strong`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`size-1.5 rounded-full ${tier.dot}`} />
                    <span
                      className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${tier.accent}`}
                    >
                      {tier.name}
                    </span>
                  </div>
                  <p className="mt-3 font-display text-[32px] font-bold leading-none tracking-[-0.02em] tabular-nums text-foreground">
                    ${tier.price}
                    <span className="ml-1 text-sm font-normal text-fg-muted">
                      /mo
                    </span>
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-fg-secondary">
                    {tier.blurb}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-6 text-center text-sm text-fg-muted">
              One coach. One roster.{" "}
              <span className="text-foreground">Three levels of access.</span>
            </p>
          </div>
        </section>

        {/* ---------------------------------------------------------- problem */}
        <section className="border-y border-border/60 bg-card/30 px-6 py-20">
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
                The problem
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-[-0.025em] text-foreground sm:text-4xl">
                One-to-one coaching stops scaling at about 25 clients.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-fg-secondary">
                That&apos;s the ceiling — you run out of hours, not demand.
                Meanwhile you have thousands of followers who&apos;d happily pay
                $19 a month for something lighter, and no way to serve them
                without running a second business.
              </p>
              <p className="mt-4 text-base leading-relaxed text-fg-secondary">
                And clients churn quietly. Nothing tells you someone stopped
                training nine days ago until the cancellation lands.
              </p>
            </div>

            <div className="stagger space-y-3">
              {[
                { before: "Instagram", after: "Content feed, tier-gated" },
                { before: "WhatsApp", after: "Realtime chat, per tier" },
                { before: "Google Sheets", after: "Program builder + logging" },
                { before: "Bank transfers", after: "Subscriptions on autopilot" },
                { before: "A Notes app", after: "Retention dashboard" },
              ].map((row) => (
                <div
                  key={row.before}
                  className="lift flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3.5"
                >
                  <span className="w-32 shrink-0 text-sm text-fg-muted line-through decoration-danger/50">
                    {row.before}
                  </span>
                  <ArrowRight className="size-3.5 shrink-0 text-fg-muted" />
                  <span className="text-sm font-medium text-foreground">
                    {row.after}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- features */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
                What&apos;s inside
              </p>
              <h2 className="mt-3 font-display text-3xl font-semibold leading-tight tracking-[-0.025em] text-foreground sm:text-4xl">
                Everything the job actually needs.
              </h2>
            </div>

            <div className="stagger mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="lift surface-sheen group rounded-lg border border-border bg-card p-6 hover:border-border-strong"
                >
                  <div className="flex size-10 items-center justify-center rounded-md bg-volt-500/10 ring-1 ring-volt-500/20 transition-colors duration-300 group-hover:bg-volt-500/15">
                    <Icon className="size-[18px] text-volt-500" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-fg-secondary">
                    {body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- final CTA */}
        <section className="relative isolate overflow-hidden px-6 py-24">
          <AmbientBackdrop variant="cool" />
          <div className="relative mx-auto max-w-2xl text-center">
            <h2 className="font-display text-4xl font-bold leading-[1.1] tracking-[-0.03em] text-foreground sm:text-5xl">
              Start earning from the{" "}
              <span className="text-gradient-volt">whole audience</span>
            </h2>
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
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------- footer */}
      <footer className="border-t border-border/60 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <span className="font-display text-sm font-bold tracking-[-0.01em] text-foreground">
            OnlyChamps
          </span>
          <p className="text-xs text-fg-muted">
            A subscription platform for online fitness coaches.
          </p>
        </div>
      </footer>
    </div>
  );
}

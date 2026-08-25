import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ArrowRight, Search, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/queries/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { AmbientBackdrop } from "@/components/marketing/ambient-backdrop";
import { Reveal } from "@/components/marketing/motion";

export const metadata: Metadata = {
  title: "Find a coach — OnlyChamps",
  description:
    "Browse coaches on OnlyChamps and pick the membership level that fits — content, group coaching, or one to one.",
};

/** Specialty chips are drawn from the coaches that actually exist rather
 * than a hardcoded list, so the filter row can never offer a tag that
 * returns nothing. */
function collectSpecialties(coaches: { specialties: string[] | null }[]) {
  const counts = new Map<string, number>();
  for (const c of coaches) {
    for (const s of c.specialties ?? []) counts.set(s, (counts.get(s) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([name]) => name);
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; specialty?: string }>;
}) {
  const { q, specialty } = await searchParams;
  const supabase = await createClient();
  const user = await getCurrentUser();

  // Every published coach, for the filter row. The roster is small enough
  // that one read beats a second round trip for the facet counts.
  const { data: allCoaches } = await supabase
    .from("coaches")
    .select("id, handle, display_name, headline, cover_image_url, specialties, profiles(avatar_url), tiers(level, price_cents, is_active)")
    .eq("is_published", true);

  const specialties = collectSpecialties(allCoaches ?? []);

  const query = q?.trim().toLowerCase() ?? "";
  const coaches = (allCoaches ?? [])
    .filter((c) =>
      specialty ? (c.specialties ?? []).includes(specialty) : true,
    )
    .filter((c) =>
      query
        ? c.display_name.toLowerCase().includes(query) ||
          (c.headline ?? "").toLowerCase().includes(query) ||
          (c.specialties ?? []).some((s) => s.toLowerCase().includes(query))
        : true,
    )
    .sort((a, b) => a.display_name.localeCompare(b.display_name));

  // Client counts come from the coach_stats view, not from subscriptions.
  // subscriptions is readable only by the client and coach on the row, and
  // should stay that way — the view exposes the aggregate and nothing else,
  // so this number is visible to signed-out visitors. See 01-DATABASE.md §7.
  const { data: stats } = await supabase
    .from("coach_stats")
    .select("coach_id, active_client_count");

  const clientCounts = new Map(
    (stats ?? []).map((s) => [s.coach_id, s.active_client_count]),
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link
            href="/"
            className="font-display text-lg font-bold tracking-[-0.02em] text-foreground"
          >
            OnlyChamps
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <Button size="sm" render={<Link href="/feed" />} nativeButton={false}>
                My feed
              </Button>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative isolate overflow-hidden px-6 pb-10 pt-16">
          <AmbientBackdrop />

          <div className="relative mx-auto w-full max-w-6xl">
            <Reveal>
              <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-fg-muted">
                {coaches.length} {coaches.length === 1 ? "coach" : "coaches"} taking clients
              </p>
              <h1 className="mt-3 max-w-[18ch] font-display text-[42px] font-bold leading-[1.03] tracking-[-0.03em] text-foreground sm:text-[56px]">
                Find the coach who
                <span className="text-gradient-volt"> fits how you train</span>
              </h1>
              <p className="mt-5 max-w-[56ch] text-lg leading-relaxed text-fg-secondary">
                Every coach sets their own ladder — content, group coaching, or
                one to one. Start at any level and move up when you want more
                access.
              </p>
            </Reveal>

            <Reveal delay={80}>
              <form className="mt-8 flex max-w-md gap-2" action="/discover">
                {specialty && <input type="hidden" name="specialty" value={specialty} />}
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
                  <Input
                    name="q"
                    defaultValue={q ?? ""}
                    placeholder="Search by name, style or goal"
                    aria-label="Search coaches"
                    className="pl-9"
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-6 flex flex-wrap gap-2">
                <FilterChip href={buildHref({ q })} active={!specialty}>
                  All
                </FilterChip>
                {specialties.map((s) => (
                  <FilterChip
                    key={s}
                    href={buildHref({ q, specialty: s })}
                    active={specialty === s}
                  >
                    {s}
                  </FilterChip>
                ))}
              </div>
            </Reveal>
          </div>
        </section>

        <section className="px-6 pb-24">
          <div className="mx-auto w-full max-w-6xl">
            {coaches.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No coaches match that"
                description="Try a different search, or clear the filters to see everyone."
              />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {coaches.map((coach, i) => {
                  const activeTiers = (coach.tiers ?? [])
                    .filter((t) => t.is_active)
                    .sort((a, b) => a.level - b.level);
                  const from = activeTiers[0]?.price_cents ?? null;
                  const clients = clientCounts.get(coach.id) ?? 0;

                  return (
                    <Reveal key={coach.id} delay={i * 60}>
                      <Link
                        href={`/c/${coach.handle}`}
                        className="group lift surface-sheen block h-full overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-volt-500/50"
                      >
                        <div className="relative h-32 overflow-hidden">
                          {coach.cover_image_url && (
                            <Image
                              src={coach.cover_image_url}
                              alt=""
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              className="object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                        </div>

                        <div className="-mt-8 px-5 pb-5">
                          <Avatar className="size-16 shadow-lg ring-4 ring-card">
                            <AvatarImage
                              src={coach.profiles?.avatar_url ?? undefined}
                              alt=""
                            />
                            <AvatarFallback>{coach.display_name[0]}</AvatarFallback>
                          </Avatar>

                          <h2 className="card-title mt-3 font-display text-lg font-semibold tracking-[-0.01em] text-foreground">
                            {coach.display_name}
                          </h2>
                          {coach.headline && (
                            <p className="card-body mt-1 line-clamp-2 text-sm leading-relaxed text-fg-secondary">
                              {coach.headline}
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {(coach.specialties ?? []).slice(0, 3).map((s) => (
                              <Badge key={s} variant="secondary" className="rounded-full text-[11px]">
                                {s}
                              </Badge>
                            ))}
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                            <span className="text-sm text-fg-secondary">
                              {from !== null ? (
                                <>
                                  from{" "}
                                  <span className="font-semibold tabular-nums text-foreground">
                                    ${(from / 100).toFixed(0)}
                                  </span>
                                  /mo
                                </>
                              ) : (
                                "Pricing soon"
                              )}
                            </span>
                            {clients >= 5 && (
                              <span className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
                                <Users className="size-3 text-volt-500" />
                                <span className="font-semibold tabular-nums text-foreground">
                                  {clients}
                                </span>
                                clients
                              </span>
                            )}
                          </div>

                          <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-volt-500">
                            View storefront
                            <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </Link>
                    </Reveal>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function buildHref({ q, specialty }: { q?: string; specialty?: string }) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (specialty) params.set("specialty", specialty);
  const qs = params.toString();
  return qs ? `/discover?${qs}` : "/discover";
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-volt-500/60 bg-volt-500/10 text-foreground"
          : "border-border text-fg-secondary hover:border-border hover:text-foreground"
      }`}
    >
      {children}
    </Link>
  );
}

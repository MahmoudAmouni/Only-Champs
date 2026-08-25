import Image from "next/image";
import { CalendarCheck, Lock, MessageCircle, Play, Rss } from "lucide-react";

/**
 * The client app in a phone frame, showing the unlocked/locked mix that
 * is the whole product idea. Built in markup, not a screenshot — see
 * AppMockup for the reasoning. Decorative, so aria-hidden.
 */
export function PhoneMockup() {
  return (
    <div
      aria-hidden
      className="relative mx-auto w-[280px] rounded-[2.2rem] border-[7px] border-[#1a222c] bg-background shadow-[0_40px_100px_-25px_rgba(0,0,0,0.8)]"
    >
      {/* notch */}
      <div className="absolute left-1/2 top-0 z-10 h-5 w-28 -translate-x-1/2 rounded-b-2xl bg-[#1a222c]" />

      <div className="overflow-hidden rounded-[1.7rem]">
        {/* header */}
        <div className="flex items-center justify-between border-b border-border/60 px-4 pb-2.5 pt-7">
          <span className="font-display text-[11px] font-bold tracking-[-0.01em] text-foreground">
            OnlyChamps
          </span>
          <span className="flex size-5 items-center justify-center rounded-full bg-accent text-[8px] font-semibold text-foreground">
            SM
          </span>
        </div>

        <div className="space-y-2.5 p-3">
          {/* unlocked post */}
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="relative h-24">
              <Image
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=560&q=70"
                alt=""
                fill
                sizes="280px"
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-background/25">
                <span className="flex size-8 items-center justify-center rounded-full bg-background/75 ring-1 ring-border">
                  <Play className="ml-0.5 size-3 fill-foreground text-foreground" />
                </span>
              </div>
              <span className="absolute bottom-1.5 right-1.5 rounded bg-background/80 px-1 py-0.5 text-[7px] font-medium tabular-nums text-foreground">
                11:46
              </span>
            </div>
            <div className="space-y-1 p-2.5">
              <span className="inline-block rounded-sm border border-tier-1/25 bg-tier-1/12 px-1.5 py-0.5 text-[7px] font-medium text-tier-1">
                Content
              </span>
              <p className="text-[10px] font-semibold leading-snug text-foreground">
                This week&apos;s leg day walkthrough
              </p>
            </div>
          </div>

          {/* locked post — the signature state */}
          <div className="overflow-hidden rounded-lg border border-border bg-card ring-1 ring-tier-3/25">
            <div className="relative h-24 overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=560&q=70"
                alt=""
                fill
                sizes="280px"
                className="scale-105 object-cover blur-[6px] brightness-[0.32] saturate-[0.6]"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-tier-3/12 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                <span className="flex size-7 items-center justify-center rounded-full bg-background/60 ring-1 ring-tier-3/25 backdrop-blur-sm">
                  <Lock className="size-3 text-tier-3" />
                </span>
                <p className="text-[8px] font-semibold text-foreground">
                  1:1 members only
                </p>
                <span className="rounded bg-volt-500 px-2 py-0.5 text-[7px] font-bold text-volt-ink">
                  Upgrade — $249/mo
                </span>
              </div>
            </div>
            <div className="space-y-1 p-2.5">
              <span className="inline-block rounded-sm border border-tier-3/25 bg-tier-3/12 px-1.5 py-0.5 text-[7px] font-medium text-tier-3">
                1:1
              </span>
              <p className="text-[10px] font-semibold leading-snug text-foreground">
                Competition prep: 8 weeks out
              </p>
            </div>
          </div>
        </div>

        {/* tab bar */}
        <div className="grid grid-cols-4 border-t border-border/60 pb-2 pt-1.5">
          {[
            { icon: Rss, label: "Feed", active: true },
            { icon: CalendarCheck, label: "Today" },
            { icon: Play, label: "Progress" },
            { icon: MessageCircle, label: "Chat" },
          ].map(({ icon: Icon, label, active }) => (
            <div
              key={label}
              className={`relative flex flex-col items-center gap-0.5 text-[7px] font-medium ${
                active ? "text-volt-500" : "text-fg-muted"
              }`}
            >
              {active && (
                <span className="absolute -top-1.5 inset-x-3 h-0.5 rounded-b-full bg-volt-500" />
              )}
              <Icon className="size-3" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

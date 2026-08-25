import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Lock, LineChart, MessageCircle } from "lucide-react";
import { AmbientBackdrop } from "@/components/marketing/ambient-backdrop";

const POINTS = [
  { icon: Lock, text: "Tier-gated content, enforced at the database" },
  { icon: LineChart, text: "Programs, logging and progress in one place" },
  { icon: MessageCircle, text: "Realtime chat with every client" },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* ------------------------------------------------------ brand panel */}
      <aside className="relative isolate hidden w-[46%] shrink-0 overflow-hidden border-r border-border lg:flex lg:flex-col lg:justify-between">
        <AmbientBackdrop />

        <div className="relative p-10">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <div className="relative max-w-md p-10">
          <h2 className="animate-fade-up font-display text-[40px] font-bold leading-[1.08] tracking-[-0.03em]">
            <span className="text-gradient-chrome">Run your whole</span>
            <br />
            <span className="text-gradient-chrome">coaching business </span>
            <span className="text-gradient-volt">from one place</span>
          </h2>

          <ul className="stagger mt-9 space-y-4">
            {POINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-volt-500/10 ring-1 ring-volt-500/20">
                  <Icon className="size-3.5 text-volt-500" />
                </span>
                <span className="text-sm leading-relaxed text-fg-secondary">
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative p-10">
          <p className="text-xs text-fg-muted">
            Sell tiered memberships. Deliver programs. Coach directly.
          </p>
        </div>
      </aside>

      {/* ------------------------------------------------------------- form */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-[380px]">
          <Link href="/" className="mb-10 flex justify-center lg:hidden">
            <Logo />
          </Link>
          <div className="animate-fade-up">{children}</div>
        </div>
      </main>
    </div>
  );
}

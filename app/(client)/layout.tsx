import { TabBar } from "@/components/client/tab-bar";

/**
 * Client app shell — mobile-first, centred at 480px even on desktop, with
 * a fixed bottom tab bar. See docs/03-DESIGN-SYSTEM.md §5 and
 * docs/04-FRONTEND.md §1.
 */
export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col border-x border-border bg-background">
      <header className="flex h-14 items-center border-b border-border px-4">
        <span className="font-display text-base font-bold tracking-[-0.01em] text-foreground">
          OnlyChamps
        </span>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">{children}</main>

      <TabBar />
    </div>
  );
}

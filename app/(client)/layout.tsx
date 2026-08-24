import { TabBar } from "@/components/client/tab-bar";
import { AccountMenu } from "@/components/shared/account-menu";
import { requireUser } from "@/lib/queries/auth";

/**
 * Client app shell — mobile-first, centred at 480px even on desktop, with
 * a fixed bottom tab bar. See docs/03-DESIGN-SYSTEM.md §5 and
 * docs/04-FRONTEND.md §1.
 */
export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[480px] flex-col border-x border-border bg-background">
      <header className="flex h-14 items-center justify-between border-b border-border px-4">
        <span className="font-display text-base font-bold tracking-[-0.01em] text-foreground">
          OnlyChamps
        </span>
        <AccountMenu
          fullName={user.profile.full_name}
          email={user.email ?? ""}
        />
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6">{children}</main>

      <TabBar />
    </div>
  );
}

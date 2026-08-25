import Link from "next/link";
import { SidebarNav } from "@/components/coach/sidebar-nav";
import { MobileNav } from "@/components/coach/mobile-nav";
import { AccountMenu } from "@/components/shared/account-menu";
import { requireCoach } from "@/lib/queries/auth";

/**
 * Coach app shell — 240px fixed sidebar + 64px topbar, desktop-first.
 * See docs/03-DESIGN-SYSTEM.md §5 and docs/04-FRONTEND.md §1.
 */
export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireCoach();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link
            href="/dashboard"
            className="font-display text-lg font-bold tracking-[-0.01em] text-foreground"
          >
            OnlyChamps
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav />
        </div>
      </aside>

      <div className="flex flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-background px-4 lg:px-8">
          <div className="flex items-center gap-2">
            <MobileNav />
            <span className="text-sm font-medium text-muted-foreground lg:hidden">
              OnlyChamps
            </span>
          </div>
          <AccountMenu
            fullName={user.profile.full_name}
            email={user.email ?? ""}
          />
        </header>

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

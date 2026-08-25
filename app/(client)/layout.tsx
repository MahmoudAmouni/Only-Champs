import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { TabBar } from "@/components/client/tab-bar";
import { ClientSidebarNav } from "@/components/client/sidebar-nav";
import { AccountMenu } from "@/components/shared/account-menu";
import { requireUser } from "@/lib/queries/auth";

/**
 * Client app shell. Phone and tablet get the mobile layout — a single
 * column with a bottom tab bar. From lg up it becomes a real desktop app:
 * the same 240px fixed sidebar the coach shell uses, and content that
 * spans the window.
 *
 * It used to be pinned at max-w-[480px] with visible side borders at every
 * width, which put a phone-shaped column in the middle of a 1440px display
 * and wasted two thirds of the screen. Mobile-first is about which layout
 * you design first, not about shipping only that one.
 *
 * See docs/03-DESIGN-SYSTEM.md §5 and docs/04-FRONTEND.md §1.
 */
export default async function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-16 items-center border-b border-border px-5">
          <Link href="/feed">
            <Logo />
          </Link>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <ClientSidebarNav />
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border/60 bg-background/85 px-4 backdrop-blur-xl lg:h-16 lg:px-8">
          <Logo className="lg:hidden" markClassName="size-6" />
          <span className="hidden text-sm text-fg-muted lg:block">
            Welcome back, {user.profile.full_name.split(" ")[0] || "champ"}
          </span>
          <AccountMenu
            fullName={user.profile.full_name}
            email={user.email ?? ""}
            links={[
              { href: "/profile", label: "Your profile" },
              { href: "/discover", label: "Find a coach" },
            ]}
          />
        </header>

        <main className="animate-fade-up mx-auto w-full max-w-[1100px] flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>

        <TabBar />
      </div>
    </div>
  );
}

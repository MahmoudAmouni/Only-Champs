import { NavLink } from "@/components/shared/nav-link";
import { CLIENT_NAV_ITEMS } from "@/components/client/nav-items";

/**
 * 64px + safe-area bottom tab bar. Touch targets are the full column
 * height/width, comfortably over the 44px minimum from
 * docs/03-DESIGN-SYSTEM.md §5.
 */
export function TabBar() {
  return (
    <nav className="grid h-16 grid-cols-4 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
      {CLIENT_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <NavLink
          key={href}
          href={href}
          className="flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors"
          activeClassName="text-primary"
          inactiveClassName="text-muted-foreground"
        >
          <Icon className="size-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

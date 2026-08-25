import { NavLink } from "@/components/shared/nav-link";
import { CLIENT_NAV_ITEMS } from "@/components/client/nav-items";

/**
 * 64px + safe-area bottom tab bar. Touch targets are the full column
 * height/width, comfortably over the 44px minimum from
 * docs/03-DESIGN-SYSTEM.md §5.
 */
export function TabBar() {
  return (
    <nav className="sticky bottom-0 z-20 grid h-16 grid-cols-4 border-t border-border bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl">
      {CLIENT_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <NavLink
          key={href}
          href={href}
          className="group relative flex flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-200"
          activeClassName="text-volt-500"
          inactiveClassName="text-fg-muted hover:text-fg-secondary"
        >
          {/* Volt bar above the active tab. */}
          <span className="absolute inset-x-5 top-0 h-0.5 rounded-b-full bg-volt-500 opacity-0 transition-opacity duration-200 group-aria-[current=page]:opacity-100" />
          <Icon className="size-[18px] transition-transform duration-200 group-active:scale-90 group-aria-[current=page]:scale-110" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

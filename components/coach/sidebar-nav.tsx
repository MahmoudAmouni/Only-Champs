import { NavLink } from "@/components/shared/nav-link";
import { COACH_NAV_ITEMS } from "@/components/coach/nav-items";

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {COACH_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <NavLink
          key={href}
          href={href}
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
          activeClassName="bg-accent text-foreground"
          inactiveClassName="text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Icon className="size-4" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

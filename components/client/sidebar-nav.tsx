import { NavLink } from "@/components/shared/nav-link";
import { CLIENT_NAV_ITEMS } from "@/components/client/nav-items";

/** Desktop sidebar for the client shell, matching the coach's. */
export function ClientSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5 px-3">
      {CLIENT_NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <NavLink
          key={href}
          href={href}
          onClick={onNavigate}
          className="group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200"
          activeClassName="bg-accent text-foreground"
          inactiveClassName="text-fg-secondary hover:bg-accent/60 hover:text-foreground"
        >
          <span className="absolute inset-y-1.5 -left-3 w-0.5 rounded-r-full bg-volt-500 opacity-0 transition-opacity duration-200 group-aria-[current=page]:opacity-100" />
          <Icon className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

import {
  Rss,
  Compass,
  CalendarCheck,
  LineChart,
  MessageCircle,
  User,
  type LucideIcon,
} from "lucide-react";

export type ClientNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown in the mobile tab bar. Everything else is sidebar/menu only —
   * five columns is the most a 375px bar holds without the labels
   * truncating. */
  primary?: boolean;
};

// See docs/04-FRONTEND.md §1 (route map) and §5 (client screens).
export const CLIENT_NAV_ITEMS: ClientNavItem[] = [
  { href: "/feed", label: "Feed", icon: Rss, primary: true },
  { href: "/discover", label: "Discover", icon: Compass, primary: true },
  { href: "/today", label: "Today", icon: CalendarCheck, primary: true },
  { href: "/progress", label: "Progress", icon: LineChart, primary: true },
  { href: "/chat", label: "Chat", icon: MessageCircle, primary: true },
  { href: "/profile", label: "Profile", icon: User },
];

export const CLIENT_TAB_ITEMS = CLIENT_NAV_ITEMS.filter((i) => i.primary);

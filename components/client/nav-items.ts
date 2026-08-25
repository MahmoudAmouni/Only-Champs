import {
  Rss,
  CalendarCheck,
  LineChart,
  MessageCircle,
  type LucideIcon,
} from "lucide-react";

export type ClientNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// See docs/04-FRONTEND.md §1 (route map) and §5 (client screens).
export const CLIENT_NAV_ITEMS: ClientNavItem[] = [
  { href: "/feed", label: "Feed", icon: Rss },
  { href: "/today", label: "Today", icon: CalendarCheck },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/chat", label: "Chat", icon: MessageCircle },
];

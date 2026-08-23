import {
  LayoutDashboard,
  Users,
  Image as ImageIcon,
  Dumbbell,
  MessageSquare,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type CoachNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

// See docs/04-FRONTEND.md §1 (route map) and §4 (coach screens).
export const COACH_NAV_ITEMS: CoachNavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/content", label: "Content", icon: ImageIcon },
  { href: "/programs", label: "Programs", icon: Dumbbell },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/settings", label: "Settings", icon: Settings },
];

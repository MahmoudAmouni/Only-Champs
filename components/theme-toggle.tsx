"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Dev/QA utility for eyeballing both themes — not a user-facing feature yet.
 * The app always server-renders with `.dark` on <html> (see app/layout.tsx),
 * so `isDark` can start `true` with no mount-effect needed; this just
 * toggles the class client-side so §7 of the design system doc can be
 * checked in both themes without a real theme system.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  function toggle() {
    const next = !isDark;
    document.documentElement.classList.toggle("dark", next);
    setIsDark(next);
  }

  return (
    <Button variant="secondary" size="sm" onClick={toggle}>
      {isDark ? <Moon /> : <Sun />}
      {isDark ? "Dark" : "Light"}
    </Button>
  );
}

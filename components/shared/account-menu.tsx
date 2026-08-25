"use client";

import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string, email: string) {
  const trimmed = name.trim();
  if (trimmed) {
    return trimmed
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");
  }
  return email[0]?.toUpperCase() ?? "?";
}

export function AccountMenu({
  fullName,
  email,
  avatarUrl,
  links = [],
}: {
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  links?: { href: string; label: string }[];
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50">
        <Avatar className="size-8">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          <AvatarFallback>{initials(fullName, email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-56">
        {/*
          DropdownMenuLabel renders Base UI's Menu.GroupLabel, which reads
          MenuGroupContext and throws "MenuGroupContext is missing" when it
          sits directly under the popup. It has to label an actual group, so
          the identity header and the items it heads are wrapped in one.
        */}
        <DropdownMenuGroup>
          <DropdownMenuLabel className="py-2">
            <span className="block truncate text-sm font-medium text-foreground">
              {fullName || "Your account"}
            </span>
            <span className="block truncate text-xs font-normal text-fg-muted">
              {email}
            </span>
          </DropdownMenuLabel>

          {links.length > 0 && (
            <>
              <DropdownMenuSeparator />
              {links.map((link) => (
                <DropdownMenuItem
                  key={link.href}
                  render={<Link href={link.href} />}
                  nativeButton={false}
                >
                  {link.label}
                </DropdownMenuItem>
              ))}
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              void signOut();
            }}
          >
            Sign out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

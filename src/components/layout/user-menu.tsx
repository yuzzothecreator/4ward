"use client";

import Link from "next/link";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  ShoppingBag,
  UserRound,
  BadgeCheck,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ROLE_LABELS, type AppRole } from "@/lib/rbac";
import { cn } from "@/lib/utils";

export type UserMenuProfile = {
  name: string;
  email: string;
  username?: string;
  role?: AppRole;
  avatarUrl?: string;
};

const menuLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
  { href: "/dashboard/verification", label: "Get verified", icon: BadgeCheck },
  { href: "/dashboard/purchases", label: "Purchases", icon: ShoppingBag },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
  { href: "/dashboard/projects", label: "My projects", icon: Package },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
];

export function UserMenu({
  profile,
  onSignOut,
  className,
}: {
  profile: UserMenuProfile;
  onSignOut: () => void | Promise<void>;
  className?: string;
}) {
  const initials = profile.name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const avatarSrc =
    profile.avatarUrl ||
    `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(profile.email || profile.name)}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-border bg-foreground/[0.03] py-1 pl-1 pr-2.5 text-left transition hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className
          )}
          aria-label="Open account menu"
        >
          <Avatar className="h-7 w-7">
            <AvatarImage src={avatarSrc} alt={profile.name} />
            <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-[9rem] truncate text-[13px] text-foreground sm:inline">
            {profile.name}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <p className="truncate text-sm font-medium text-foreground">{profile.name}</p>
            <p className="truncate text-xs text-muted-foreground">{profile.email}</p>
            {profile.role ? (
              <p className="pt-0.5 text-[11px] text-muted-foreground">
                {ROLE_LABELS[profile.role]}
                {profile.username ? ` · @${profile.username}` : ""}
              </p>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {menuLinks.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href}>
              <item.icon className="h-4 w-4 text-muted-foreground" />
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
          onSelect={(e) => {
            e.preventDefault();
            void onSignOut();
          }}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

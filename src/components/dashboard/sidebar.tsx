"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  FolderKanban,
  ShoppingBag,
  BarChart3,
  Users,
  Shield,
  Heart,
  MessageSquare,
  Settings,
  Package,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/store/use-app-store";
import {
  type AppRole,
  type Permission,
  ROLE_LABELS,
  hasPermission,
} from "@/lib/rbac";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permissions: Permission[];
};

const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Overview",
    icon: LayoutDashboard,
    permissions: ["dashboard:buyer", "dashboard:seller", "admin:access"],
  },
  {
    href: "/dashboard/projects",
    label: "Projects",
    icon: FolderKanban,
    permissions: ["dashboard:seller"],
  },
  {
    href: "/dashboard/orders",
    label: "Orders",
    icon: ShoppingBag,
    permissions: ["dashboard:seller"],
  },
  {
    href: "/dashboard/analytics",
    label: "Analytics",
    icon: BarChart3,
    permissions: ["dashboard:seller"],
  },
  {
    href: "/dashboard/purchases",
    label: "Purchases",
    icon: Package,
    permissions: ["dashboard:buyer"],
  },
  {
    href: "/dashboard/wishlist",
    label: "Wishlist",
    icon: Heart,
    permissions: ["dashboard:buyer"],
  },
  {
    href: "/dashboard/messages",
    label: "Messages",
    icon: MessageSquare,
    permissions: ["dashboard:buyer"],
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: Settings,
    permissions: ["dashboard:buyer"],
  },
  {
    href: "/dashboard/admin",
    label: "Admin",
    icon: Shield,
    permissions: ["admin:access"],
  },
  {
    href: "/dashboard/admin/users",
    label: "Users",
    icon: Users,
    permissions: ["admin:users"],
  },
];

function useVisibleLinks() {
  const user = useAppStore((s) => s.user);
  const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  const role: AppRole | null = user?.role ?? (clerkEnabled ? "SELLER" : null);

  return navItems.filter((item) =>
    item.permissions.some((p) => hasPermission(role, p))
  );
}

function isActivePath(pathname: string, href: string) {
  return (
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(href))
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const links = useVisibleLinks();

  return (
    <nav className="space-y-1">
      {links.map((link) => {
        const active = isActivePath(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition",
              active
                ? "bg-primary/20 text-primary"
                : "text-muted hover:bg-foreground/5 hover:text-foreground"
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardSidebar() {
  const user = useAppStore((s) => s.user);

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card/40 p-4 lg:block">
      <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Dashboard
      </p>
      {user?.role && (
        <p className="mb-4 px-2 text-xs text-muted">
          Role: <span className="text-foreground">{ROLE_LABELS[user.role]}</span>
        </p>
      )}
      <NavLinks />
    </aside>
  );
}

export function DashboardMobileNav() {
  const links = useVisibleLinks();
  const pathname = usePathname();

  return (
    <div className="mb-4 lg:hidden">
      <div className="flex flex-wrap gap-2">
        {links.map((link) => {
          const active = isActivePath(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs",
                active
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-border text-muted"
              )}
            >
              <link.icon className="h-3.5 w-3.5" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

const sellerLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
  { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/purchases", label: "Purchases", icon: Package },
  { href: "/dashboard/wishlist", label: "Wishlist", icon: Heart },
  { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { href: "/dashboard/profile", label: "Profile", icon: Settings },
  { href: "/dashboard/admin", label: "Admin", icon: Shield },
  { href: "/dashboard/admin/users", label: "Users", icon: Users },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {sellerLinks.map((link) => {
        const active = pathname === link.href;
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
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card/40 p-4 lg:block">
      <p className="mb-4 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Dashboard
      </p>
      <NavLinks />
    </aside>
  );
}

export function DashboardMobileNav() {
  return (
    <div className="mb-4 overflow-x-auto lg:hidden">
      <div className="flex min-w-max gap-2 pb-1">
        {sellerLinks.map((link) => (
          <MobileChip key={link.href} href={link.href} label={link.label} icon={link.icon} />
        ))}
      </div>
    </div>
  );
}

function MobileChip({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs whitespace-nowrap",
        active
          ? "border-primary bg-primary/20 text-primary"
          : "border-border text-muted"
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

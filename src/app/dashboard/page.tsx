"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { DollarSign, Eye, Download, ShoppingBag, Package, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, formatNumber } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { ROLE_LABELS, hasPermission } from "@/lib/rbac";

type DashStats = {
  sales: number;
  revenue: number;
  netRevenue: number;
  views: number;
  downloads: number;
  listings: number;
  salesChangePct: number | null;
  revenueChangePct: number | null;
};

type DashProject = {
  id: string;
  title: string;
  slug: string;
  price: number;
  status: string;
  views: number;
  downloads: number;
  sales?: number;
};

function formatChange(pct: number | null) {
  if (pct === null) return "No prior month data";
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}% vs last month`;
}

export default function DashboardPage() {
  const user = useAppStore((s) => s.user);
  const purchases = useAppStore((s) => s.purchases);
  const listings = useAppStore((s) => s.listings);
  const isSeller = hasPermission(user?.role, "dashboard:seller");
  const isAdmin = hasPermission(user?.role, "admin:access");

  const localListings = useMemo(() => {
    if (!user) return listings;
    return listings.filter(
      (p) => p.seller.username === user.username || p.seller.id === user.email
    );
  }, [listings, user]);

  const [stats, setStats] = useState<DashStats | null>(null);
  const [projects, setProjects] = useState<DashProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [fromDb, setFromDb] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user?.email || !isSeller) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/dashboard/stats?email=${encodeURIComponent(user.email)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load stats");
        return;
      }
      setStats(data.stats);
      setProjects(data.projects || []);
      setFromDb(!data.demo);
    } catch {
      setError("Network error loading dashboard");
    } finally {
      setLoading(false);
    }
  }, [user?.email, isSeller]);

  useEffect(() => {
    load();
  }, [load]);

  // Fallback from local listings when DB has no rows yet
  const displayStats: DashStats = stats || {
    sales: 0,
    revenue: 0,
    netRevenue: 0,
    views: localListings.reduce((s, p) => s + (p.views || 0), 0),
    downloads: localListings.reduce((s, p) => s + (p.downloads || 0), 0),
    listings: localListings.length,
    salesChangePct: null,
    revenueChangePct: null,
  };

  const displayProjects: DashProject[] =
    projects.length > 0
      ? projects
      : localListings.slice(0, 8).map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
          price: p.price,
          status: p.status,
          views: p.views,
          downloads: p.downloads,
        }));

  const sellerCards = [
    {
      label: "Total Sales",
      value: formatNumber(displayStats.sales),
      icon: ShoppingBag,
      change: formatChange(displayStats.salesChangePct),
    },
    {
      label: "Revenue",
      value: formatPrice(displayStats.revenue),
      icon: DollarSign,
      change: formatChange(displayStats.revenueChangePct),
    },
    {
      label: "Project Views",
      value: formatNumber(displayStats.views),
      icon: Eye,
      change: `${displayStats.listings} listing${displayStats.listings === 1 ? "" : "s"}`,
    },
    {
      label: "Downloads",
      value: formatNumber(displayStats.downloads),
      icon: Download,
      change:
        displayStats.netRevenue > 0
          ? `Net ${formatPrice(displayStats.netRevenue)}`
          : "After platform fee",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
          {isSeller ? "Seller overview" : "Your dashboard"}
        </h1>
        <p className="mt-1 text-muted">
          {user
            ? `Signed in as ${user.name} · ${ROLE_LABELS[user.role]}`
            : "Track purchases, listings, and account activity."}
        </p>
        {isSeller && (
          <p className="mt-1 text-xs text-muted-foreground">
            {loading
              ? "Loading live metrics…"
              : fromDb
                ? "Live data from your sales and listings in the database."
                : "Showing local listing data until database sales sync."}
          </p>
        )}
        {isAdmin && (
          <Link
            href="/dashboard/admin"
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            Open admin console →
          </Link>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isSeller ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sellerCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card>
                <CardContent className="flex items-start justify-between p-5">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold text-foreground">
                      {loading && !stats ? "…" : stat.value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
                  </div>
                  <div className="rounded-xl bg-primary/20 p-2.5 text-primary">
                    {loading && !stats ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <stat.icon className="h-5 w-5" />
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-start justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">Purchases</p>
                <p className="mt-1 text-2xl font-bold text-foreground">
                  {purchases.length}
                </p>
              </div>
              <div className="rounded-xl bg-primary/20 p-2.5 text-primary">
                <Package className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Ready to sell?</p>
              <p className="mt-1 text-sm text-foreground">
                List a project and you&apos;ll be promoted to Seller automatically.
              </p>
              <Link href="/sell">
                <Button className="mt-3" size="sm">
                  Start selling
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {isSeller && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Your projects</CardTitle>
            <Link href="/sell">
              <Button size="sm" variant="outline">
                New listing
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {displayProjects.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-muted">No projects yet.</p>
                <Link href="/sell" className="mt-3 inline-block">
                  <Button size="sm">Sell your first project</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {displayProjects.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-foreground/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <Link
                        href={`/projects/${p.slug}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {p.title}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {formatNumber(p.views)} views · {formatNumber(p.downloads)}{" "}
                        downloads
                        {typeof p.sales === "number" ? ` · ${p.sales} sales` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{p.status}</Badge>
                      <span className="text-sm font-medium text-foreground">
                        {formatPrice(p.price)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

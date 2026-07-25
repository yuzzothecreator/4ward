"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { DollarSign, Eye, Download, ShoppingBag, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoProjects } from "@/lib/demo-data";
import { formatPrice, formatNumber } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { ROLE_LABELS, hasPermission } from "@/lib/rbac";

const sellerStats = [
  { label: "Total Sales", value: "487", icon: ShoppingBag, change: "+12%" },
  { label: "Revenue", value: "TZS 45.2M", icon: DollarSign, change: "+18%" },
  { label: "Project Views", value: "12.4K", icon: Eye, change: "+9%" },
  { label: "Downloads", value: "1,892", icon: Download, change: "+15%" },
];

export default function DashboardPage() {
  const user = useAppStore((s) => s.user);
  const purchases = useAppStore((s) => s.purchases);
  const listings = useAppStore((s) => s.listings);
  const isSeller = hasPermission(user?.role, "dashboard:seller");
  const isAdmin = hasPermission(user?.role, "admin:access");
  const myListings = user
    ? listings.filter(
        (p) => p.seller.username === user.username || p.seller.id === user.email
      )
    : listings;
  const myProjects = myListings.length
    ? myListings.slice(0, 4)
    : demoProjects.slice(0, 4);

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
        {isAdmin && (
          <Link
            href="/dashboard/admin"
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            Open admin console →
          </Link>
        )}
      </div>

      {isSeller ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {sellerStats.map((stat, i) => (
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
                    <p className="mt-1 text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="mt-1 text-xs text-emerald-400">
                      {stat.change} vs last month
                    </p>
                  </div>
                  <div className="rounded-xl bg-primary/20 p-2.5 text-primary">
                    <stat.icon className="h-5 w-5" />
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
          <CardHeader>
            <CardTitle>Recent projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {myProjects.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-foreground/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatNumber(p.views)} views · {formatNumber(p.downloads)}{" "}
                      downloads
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

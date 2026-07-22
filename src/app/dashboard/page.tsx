"use client";

import { motion } from "framer-motion";
import { DollarSign, Eye, Download, ShoppingBag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { demoProjects } from "@/lib/demo-data";
import { formatPrice, formatNumber } from "@/lib/utils";

const stats = [
  { label: "Total Sales", value: "487", icon: ShoppingBag, change: "+12%" },
  { label: "Revenue", value: "TZS 45.2M", icon: DollarSign, change: "+18%" },
  { label: "Project Views", value: "12.4K", icon: Eye, change: "+9%" },
  { label: "Downloads", value: "1,892", icon: Download, change: "+15%" },
];

export default function DashboardPage() {
  const myProjects = demoProjects.slice(0, 4);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Seller overview</h1>
        <p className="mt-1 text-muted">Track sales, revenue, and project performance.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, i) => (
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
                  <p className="mt-1 text-xs text-emerald-400">{stat.change} vs last month</p>
                </div>
                <div className="rounded-xl bg-primary/20 p-2.5 text-primary">
                  <stat.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

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
                    {formatNumber(p.views)} views · {formatNumber(p.downloads)} downloads
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="success">{p.status}</Badge>
                  <span className="text-sm font-semibold text-primary">
                    {formatPrice(p.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

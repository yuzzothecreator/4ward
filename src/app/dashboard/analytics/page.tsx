"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";

type MonthRow = { month: string; revenue: number };
type PopularRow = { name: string; sales: number; views: number };

export default function AnalyticsPage() {
  const user = useAppStore((s) => s.user);
  const [monthly, setMonthly] = useState<MonthRow[]>([]);
  const [popular, setPopular] = useState<PopularRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totals, setTotals] = useState({ revenue: 0, sales: 0, views: 0 });

  const load = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/dashboard/stats?email=${encodeURIComponent(user.email)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load analytics");
        return;
      }
      setMonthly(data.monthlyRevenue || []);
      setPopular(data.popularProjects || []);
      setTotals({
        revenue: data.stats?.revenue || 0,
        sales: data.stats?.sales || 0,
        views: data.stats?.views || 0,
      });
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    load();
  }, [load]);

  const hasChartData =
    monthly.some((m) => m.revenue > 0) || popular.some((p) => p.sales > 0 || p.views > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted">Revenue and popularity from your real sales data.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total revenue</p>
            <p className="mt-1 text-2xl font-bold text-foreground">
              {formatPrice(totals.revenue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Completed sales</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{totals.sales}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Project views</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{totals.views}</p>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <p className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading charts…
        </p>
      ) : !hasChartData ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted">
            No sales yet — charts will fill in as buyers complete payments on your listings.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Revenue (7 months)</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    width={48}
                    tickFormatter={(v) =>
                      Number(v) >= 1_000_000
                        ? `${Math.round(Number(v) / 1_000_000)}M`
                        : Number(v) >= 1000
                          ? `${Math.round(Number(v) / 1000)}K`
                          : String(v)
                    }
                  />
                  <Tooltip
                    formatter={(value) => formatPrice(Number(value || 0))}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary) / 0.2)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top projects by sales</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={popular}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={28} />
                  <Tooltip />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

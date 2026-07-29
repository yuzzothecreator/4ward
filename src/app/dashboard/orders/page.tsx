"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";

type OrderRow = {
  id: string;
  project: string;
  slug: string;
  buyer: string;
  buyerName: string;
  amount: number;
  status: string;
  gateway?: string | null;
  date: string;
};

export default function OrdersPage() {
  const user = useAppStore((s) => s.user);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/dashboard/stats?email=${encodeURIComponent(user.email)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load orders");
        return;
      }
      setOrders(data.orders || []);
    } catch {
      setError("Network error loading orders");
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        <p className="text-muted">Live sales history from completed purchases.</p>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Card>
        <CardHeader>
          <CardTitle>Sales history</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading orders…
            </p>
          ) : orders.length === 0 ? (
            <div className="space-y-3 py-6 text-center">
              <p className="text-sm text-muted">
                No completed sales yet. When buyers pay via ClickPesa, orders appear here.
              </p>
              <Link href="/sell">
                <Button size="sm" variant="outline">
                  List a project
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="flex flex-col gap-2 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <Link
                      href={`/projects/${o.slug}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {o.project}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {o.id.slice(0, 12)} · {o.buyerName || o.buyer}
                      {o.gateway ? ` · ${o.gateway}` : ""} ·{" "}
                      {new Date(o.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        o.status === "COMPLETED"
                          ? "success"
                          : o.status === "PENDING"
                            ? "warning"
                            : "secondary"
                      }
                    >
                      {o.status}
                    </Badge>
                    <span className="text-sm font-semibold text-foreground">
                      {formatPrice(o.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPrice } from "@/lib/utils";

const orders = [
  { id: "ORD-1042", project: "CampusConnect", buyer: "sarah@uni.edu", amount: 49, status: "COMPLETED", date: "2026-07-18" },
  { id: "ORD-1041", project: "StudyBuddy AI Tutor", buyer: "mike@dev.io", amount: 39, status: "COMPLETED", date: "2026-07-17" },
  { id: "ORD-1040", project: "CampusConnect", buyer: "lena@campus.ac", amount: 49, status: "PENDING", date: "2026-07-16" },
  { id: "ORD-1039", project: "SecureVault", buyer: "dev@startup.com", amount: 79, status: "COMPLETED", date: "2026-07-14" },
  { id: "ORD-1038", project: "AgriSense", buyer: "farm@agri.ke", amount: 59, status: "REFUNDED", date: "2026-07-12" },
];

export const metadata = { title: "Orders" };

export default function OrdersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        <p className="text-muted">Sales history and payment status.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sales history</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className="flex flex-col gap-2 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{o.project}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.id} · {o.buyer} · {o.date}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      o.status === "COMPLETED"
                        ? "success"
                        : o.status === "PENDING"
                          ? "warning"
                          : "destructive"
                    }
                  >
                    {o.status}
                  </Badge>
                  <span className="font-semibold text-primary">{formatPrice(o.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

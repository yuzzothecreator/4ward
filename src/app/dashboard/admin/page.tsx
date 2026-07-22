import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoProjects, demoUsers } from "@/lib/demo-data";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

export const metadata = { title: "Admin" };

const reports = [
  { id: "R1", reason: "Misleading description", project: "FinTrack UI Kit", status: "OPEN" },
  { id: "R2", reason: "Broken download", project: "AgriSense", status: "REVIEWING" },
];

export default function AdminPage() {
  const pending = demoProjects.slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin dashboard</h1>
        <p className="text-muted">Users, approvals, payments, reports, and platform analytics.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Users", value: "1,248" },
          { label: "Pending projects", value: "23" },
          { label: "GMV (30d)", value: "TZS 105M" },
          { label: "Open reports", value: "7" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Project approval queue</CardTitle>
            <Link href="/dashboard/admin/users">
              <Button variant="outline" size="sm">
                Manage users
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pending.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.seller.name} · {formatPrice(p.price)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary">
                    Reject
                  </Button>
                  <Button size="sm">Approve</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">{r.reason}</p>
                  <p className="text-xs text-muted-foreground">{r.project}</p>
                </div>
                <Badge variant={r.status === "OPEN" ? "warning" : "secondary"}>{r.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seller approvals</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {demoUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-xl border border-border p-3">
              <div>
                <p className="text-sm font-medium text-foreground">{u.name}</p>
                <p className="text-xs text-muted-foreground">
                  {u.university} · {u.email}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {u.badges.map((b) => (
                  <Badge key={b} variant="success">
                    {b.replace(/_/g, " ")}
                  </Badge>
                ))}
                <Button size="sm" variant="outline">
                  Review
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

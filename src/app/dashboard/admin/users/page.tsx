import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoUsers } from "@/lib/demo-data";

export const metadata = { title: "User Management" };

const extraUsers = [
  { id: "b1", name: "Sarah Chen", email: "sarah@uni.edu", role: "BUYER", university: "MIT" },
  { id: "a1", name: "Admin User", email: "admin@4ward.com", role: "ADMIN", university: "—" },
];

export default function AdminUsersPage() {
  const users = [
    ...demoUsers.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      university: u.university,
    })),
    ...extraUsers,
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User management</h1>
        <p className="text-muted">Roles, verification, and account controls.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {users.map((u) => (
              <div
                key={u.id}
                className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-foreground">{u.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.email} · {u.university}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      u.role === "ADMIN" ? "neon" : u.role === "SELLER" ? "default" : "secondary"
                    }
                  >
                    {u.role}
                  </Badge>
                  <Button size="sm" variant="outline">
                    Edit role
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

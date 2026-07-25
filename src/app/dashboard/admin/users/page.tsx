"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoUsers } from "@/lib/demo-data";
import { useAppStore } from "@/store/use-app-store";
import {
  APP_ROLES,
  type AppRole,
  ROLE_LABELS,
  DEMO_ADMIN_EMAIL,
} from "@/lib/rbac";

type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  university: string;
  isYou?: boolean;
};

const seedUsers: ManagedUser[] = [
  ...demoUsers.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role as AppRole,
    university: u.university,
  })),
  {
    id: "b1",
    name: "Sarah Chen",
    email: "sarah@uni.edu",
    role: "BUYER",
    university: "MIT",
  },
  {
    id: "a1",
    name: "Admin User",
    email: DEMO_ADMIN_EMAIL,
    role: "ADMIN",
    university: "—",
  },
];

export default function AdminUsersPage() {
  const current = useAppStore((s) => s.user);
  const setRole = useAppStore((s) => s.setRole);
  const [roles, setRoles] = useState<Record<string, AppRole>>(() =>
    Object.fromEntries(seedUsers.map((u) => [u.id, u.role]))
  );
  const [editingId, setEditingId] = useState<string | null>(null);

  const users = useMemo(() => {
    const list: ManagedUser[] = seedUsers.map((u) => ({
      ...u,
      role: roles[u.id] || u.role,
    }));
    if (current) {
      list.unshift({
        id: "you",
        name: current.name,
        email: current.email,
        role: current.role,
        university: current.university,
        isYou: true,
      });
    }
    return list;
  }, [current, roles]);

  function applyRole(user: ManagedUser, next: AppRole) {
    if (user.isYou) {
      setRole(next);
      setEditingId(null);
      return;
    }
    setRoles((prev) => ({ ...prev, [user.id]: next }));
    setEditingId(null);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User management</h1>
        <p className="text-muted">
          Assign BUYER, SELLER, or ADMIN. Your own role updates immediately in this demo.
        </p>
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
                  <p className="font-medium text-foreground">
                    {u.name}
                    {u.isYou ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        (you)
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {u.email} · {u.university}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={
                      u.role === "ADMIN"
                        ? "neon"
                        : u.role === "SELLER"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {ROLE_LABELS[u.role]}
                  </Badge>
                  {editingId === u.id ? (
                    <div className="flex flex-wrap gap-1">
                      {APP_ROLES.map((role) => (
                        <Button
                          key={role}
                          size="sm"
                          variant={u.role === role ? "default" : "outline"}
                          onClick={() => applyRole(u, role)}
                        >
                          {ROLE_LABELS[role]}
                        </Button>
                      ))}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingId(u.id)}
                    >
                      Edit role
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

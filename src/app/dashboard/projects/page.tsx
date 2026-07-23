"use client";

import Link from "next/link";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice, categoryLabel } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";

export default function ProjectsDashboardPage() {
  const listings = useAppStore((s) => s.listings);
  const getMyListings = useAppStore((s) => s.getMyListings);
  const mine = getMyListings();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted">Manage drafts, reviews, and published listings.</p>
        </div>
        <Link href="/sell">
          <Button>
            <Plus className="h-4 w-4" />
            New project
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your listings</CardTitle>
        </CardHeader>
        <CardContent>
          {mine.length === 0 && listings.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-muted">You have not listed a project yet.</p>
              <Link href="/sell" className="mt-4 inline-block">
                <Button>Sell your first project</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    <th className="pb-3 font-medium">Project</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Price</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Sales</th>
                    <th className="pb-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {(mine.length ? mine : listings).map((p) => (
                    <tr key={p.id} className="border-b border-border">
                      <td className="py-4 font-medium text-foreground">{p.title}</td>
                      <td className="py-4 text-muted">{categoryLabel(p.category)}</td>
                      <td className="py-4 text-foreground/80">{formatPrice(p.price)}</td>
                      <td className="py-4">
                        <Badge variant={p.status === "PUBLISHED" ? "success" : "warning"}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="py-4 text-muted">{p.downloads}</td>
                      <td className="py-4">
                        <Link href={`/projects/${p.slug}`}>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

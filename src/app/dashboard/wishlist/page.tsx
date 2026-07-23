"use client";

import { useMemo } from "react";
import { ProjectCard } from "@/components/projects/project-card";
import { useAppStore } from "@/store/use-app-store";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WishlistPage() {
  const favorites = useAppStore((s) => s.favorites);
  const listings = useAppStore((s) => s.listings);
  const getCatalog = useAppStore((s) => s.getCatalog);

  const projects = useMemo(
    () => getCatalog().filter((p) => favorites.includes(p.id)),
    [favorites, listings, getCatalog]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Wishlist</h1>
        <p className="text-muted">Projects you saved for later.</p>
      </div>
      {projects.length === 0 ? (
        <Card>
          <CardContent className="space-y-3 p-10 text-center">
            <p className="text-muted-foreground">No favorites yet.</p>
            <Link href="/marketplace">
              <Button variant="secondary">Browse marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

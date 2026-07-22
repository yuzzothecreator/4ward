"use client";

import { demoProjects } from "@/lib/demo-data";
import { ProjectCard } from "@/components/projects/project-card";
import { useAppStore } from "@/store/use-app-store";
import { Card, CardContent } from "@/components/ui/card";

export default function WishlistPage() {
  const favorites = useAppStore((s) => s.favorites);
  const projects = demoProjects.filter((p) => favorites.includes(p.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Wishlist</h1>
        <p className="text-muted">Projects you saved for later.</p>
      </div>
      {projects.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            No favorites yet. Heart projects in the marketplace.
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

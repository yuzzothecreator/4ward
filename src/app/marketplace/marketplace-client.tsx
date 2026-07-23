"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProjectCard } from "@/components/projects/project-card";
import { filterCatalog, useAppStore } from "@/store/use-app-store";
import { CATEGORIES, TECHNOLOGIES } from "@/lib/constants";

export default function MarketplacePage() {
  const searchParams = useSearchParams();
  const listings = useAppStore((s) => s.listings);
  const getCatalog = useAppStore((s) => s.getCatalog);
  const [q, setQ] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [tech, setTech] = useState("");
  const [university, setUniversity] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState<"all" | "free" | "paid" | "under100k" | "over100k">("all");
  const [showFilters, setShowFilters] = useState(false);

  const projects = useMemo(() => {
    let minPrice: number | undefined;
    let maxPrice: number | undefined;
    if (priceRange === "free") {
      minPrice = 0;
      maxPrice = 0;
    } else if (priceRange === "paid") {
      minPrice = 0.01;
    } else if (priceRange === "under100k") {
      maxPrice = 100000;
    } else if (priceRange === "over100k") {
      minPrice = 100001;
    }

    return filterCatalog(getCatalog(), {
      q: q || undefined,
      category: category || undefined,
      tech: tech || undefined,
      university: university || undefined,
      minPrice,
      maxPrice,
      minRating: minRating || undefined,
    });
  }, [q, category, tech, university, minRating, priceRange, listings, getCatalog]);

  const universities = [
    "University of Nairobi",
    "Strathmore University",
    "Jomo Kenyatta University",
    "Kenyatta University",
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-8 border-b border-border pb-8">
          <p className="font-mono text-xs text-muted-foreground">Marketplace</p>
          <h1 className="font-display mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Browse campus products
          </h1>
          <p className="mt-2 max-w-xl text-[15px] text-muted">
            Ready-made student projects, source, and docs — filter by craft, stack, or campus.
          </p>
        </div>

        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search projects, tech, creators..."
              className="pl-10"
            />
          </div>
          <Button variant="secondary" onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          <Badge
            variant={!category ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setCategory("")}
          >
            All
          </Badge>
          {CATEGORIES.map((c) => (
            <Badge
              key={c.value}
              variant={category === c.value ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setCategory(c.value)}
            >
              {c.label}
            </Badge>
          ))}
        </div>

        {showFilters && (
          <div className="glass mb-8 grid gap-4 rounded-2xl p-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-xs text-muted">Technology</label>
              <select
                value={tech}
                onChange={(e) => setTech(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-foreground/5 px-3 text-sm text-foreground"
              >
                <option value="">Any</option>
                {TECHNOLOGIES.map((t) => (
                  <option key={t} value={t} className="bg-card text-foreground">
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs text-muted">University</label>
              <select
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-foreground/5 px-3 text-sm text-foreground"
              >
                <option value="">Any</option>
                {universities.map((u) => (
                  <option key={u} value={u} className="bg-card text-foreground">
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs text-muted">Price</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value as typeof priceRange)}
                className="h-11 w-full rounded-xl border border-border bg-foreground/5 px-3 text-sm text-foreground"
              >
                <option value="all" className="bg-card text-foreground">All prices</option>
                <option value="free" className="bg-card text-foreground">Free</option>
                <option value="paid" className="bg-card text-foreground">Paid</option>
                <option value="under100k" className="bg-card text-foreground">Under TZS 100,000</option>
                <option value="over100k" className="bg-card text-foreground">TZS 100,000+</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-xs text-muted">Min rating</label>
              <select
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="h-11 w-full rounded-xl border border-border bg-foreground/5 px-3 text-sm text-foreground"
              >
                <option value={0} className="bg-card text-foreground">Any</option>
                <option value={4} className="bg-card text-foreground">4+</option>
                <option value={4.5} className="bg-card text-foreground">4.5+</option>
              </select>
            </div>
          </div>
        )}

        <p className="mb-4 text-sm text-muted-foreground">{projects.length} projects found</p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </div>

        {projects.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-muted">No projects match your filters.</p>
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => {
                setQ("");
                setCategory("");
                setTech("");
                setUniversity("");
                setMinRating(0);
                setPriceRange("all");
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

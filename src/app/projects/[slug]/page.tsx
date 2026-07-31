"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Star, ExternalLink, Code2, Download, GraduationCap, Shield, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, categoryLabel, formatNumber } from "@/lib/utils";
import { ProjectCard } from "@/components/projects/project-card";
import { PurchaseButton } from "@/components/projects/purchase-button";
import { ProjectReviews } from "@/components/projects/project-reviews";
import { VerifiedTick } from "@/components/verified-tick";
import { useAppStore } from "@/store/use-app-store";

export default function ProjectDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const listings = useAppStore((s) => s.listings);
  const getCatalog = useAppStore((s) => s.getCatalog);
  const getProjectBySlug = useAppStore((s) => s.getProjectBySlug);
  const [reviewStats, setReviewStats] = useState<{ average: number; count: number } | null>(
    null
  );

  const project = useMemo(() => getProjectBySlug(slug), [slug, listings, getProjectBySlug]);

  const onReviewStats = useCallback((stats: { average: number; count: number }) => {
    setReviewStats(stats);
  }, []);

  useEffect(() => {
    setReviewStats(null);
  }, [slug]);

  const related = useMemo(() => {
    if (!project) return [];
    return getCatalog()
      .filter((p) => p.category === project.category && p.id !== project.id)
      .slice(0, 3);
  }, [project, listings, getCatalog]);

  const displayRating = reviewStats && reviewStats.count > 0 ? reviewStats.average : 0;
  const displayReviewCount = reviewStats ? reviewStats.count : 0;

  if (!project) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-foreground">Project not found</h1>
        <p className="mt-2 text-sm text-muted">It may have been removed or the link is wrong.</p>
        <Link href="/marketplace" className="mt-6 inline-block">
          <Button>Browse marketplace</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-10">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-border">
              <Image
                src={project.coverImage}
                alt={project.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width:1024px) 100vw, 66vw"
              />
            </div>

            <div>
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge variant="neon">{categoryLabel(project.category)}</Badge>
                <Badge variant="secondary">{project.license.replace("_", " ")}</Badge>
                {project.pricingType === "FREE" && <Badge variant="success">Free</Badge>}
              </div>
              <h1 className="text-2xl font-bold break-words text-foreground sm:text-3xl lg:text-4xl">
                {project.title}
              </h1>
              <p className="mt-3 break-words text-muted">{project.description}</p>
            </div>
          </div>

          <div className="min-w-0 space-y-4 lg:row-span-2 lg:self-start">
            <Card className="lg:sticky lg:top-24">
              <CardContent className="space-y-5 p-5 sm:p-6">
                <div className="text-3xl font-bold text-foreground">
                  {formatPrice(project.price)}
                </div>
                <PurchaseButton project={project} />
                <div className="flex flex-col gap-2">
                  {project.demoUrl && (
                    <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="secondary" className="w-full">
                        <ExternalLink className="h-4 w-4" />
                        Live demo
                      </Button>
                    </a>
                  )}
                  {project.githubRepo && (
                    <a href={project.githubRepo} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full">
                        <Code2 className="h-4 w-4" />
                        GitHub
                      </Button>
                    </a>
                  )}
                </div>
                <div className="space-y-2 border-t border-border pt-4 text-sm text-muted">
                  <p className="flex items-center gap-2">
                    <Download className="h-4 w-4 shrink-0 text-primary" />
                    Instant secure download
                  </p>
                  <p className="flex items-center gap-2">
                    <Shield className="h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 break-words">
                      License: {project.license.replace("_", " ")}
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 sm:p-6">
                <Link
                  href={`/${project.seller.username}`}
                  className="flex min-w-0 items-center gap-3"
                >
                  <Image
                    src={project.seller.avatar}
                    alt={project.seller.name}
                    width={48}
                    height={48}
                    className="shrink-0 rounded-full"
                  />
                  <div className="min-w-0">
                    <p className="flex items-center gap-1 font-medium text-foreground">
                      <span className="truncate">{project.seller.name}</span>
                      {project.seller.badges?.includes("VERIFIED_CREATOR") ? (
                        <VerifiedTick />
                      ) : null}
                    </p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <GraduationCap className="h-3 w-3 shrink-0" />
                      <span className="truncate">{project.seller.university}</span>
                    </p>
                  </div>
                </Link>
                <div className="mt-3 flex flex-wrap gap-1">
                  {project.seller.badges?.map((b) => (
                    <Badge key={b} variant="success">
                      {b.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
                <Link
                  href={`/dashboard/messages?peer=${encodeURIComponent(project.seller.id)}&project=${encodeURIComponent(project.id)}`}
                  className="mt-4 block"
                >
                  <Button variant="outline" className="w-full" size="sm">
                    <MessageSquare className="h-4 w-4" />
                    Message seller
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="min-w-0 space-y-6 lg:col-span-2">
            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">Tech stack</h2>
              <div className="flex flex-wrap gap-2">
                {project.technologyStack.map((t) => (
                  <Badge key={t} variant="outline">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>

            <Card>
              <CardContent className="grid grid-cols-3 gap-2 p-4 text-center sm:gap-4 sm:p-6">
                <div className="min-w-0">
                  <p className="text-lg font-bold text-foreground sm:text-2xl">
                    {formatNumber(project.views)}
                  </p>
                  <p className="text-[10px] text-muted-foreground sm:text-xs">Views</p>
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-foreground sm:text-2xl">
                    {formatNumber(project.downloads)}
                  </p>
                  <p className="text-[10px] text-muted-foreground sm:text-xs">Downloads</p>
                </div>
                <div className="min-w-0">
                  <p className="flex items-center justify-center gap-1 text-lg font-bold text-amber-400 sm:text-2xl">
                    <Star className="h-4 w-4 fill-amber-400 sm:h-5 sm:w-5" />
                    {displayReviewCount > 0 ? displayRating : "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground sm:text-xs">
                    {displayReviewCount} {displayReviewCount === 1 ? "review" : "reviews"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-10">
          <ProjectReviews
            projectId={project.id}
            slug={project.slug}
            title={project.title}
            price={project.price}
            onStats={onReviewStats}
          />
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="mb-6 text-2xl font-bold text-foreground">Related projects</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p, i) => (
                <ProjectCard key={p.id} project={p} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

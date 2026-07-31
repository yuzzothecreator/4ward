"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Star, ExternalLink, Code2, Download, GraduationCap, Shield, MessageSquare, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, categoryLabel, formatNumber } from "@/lib/utils";
import { institutionShort } from "@/lib/tanzania-institutions";
import { isCommercialListing, getLicenseMeta } from "@/lib/constants";
import {
  LicenseBadge,
  ListingTypeBadge,
} from "@/components/projects/listing-badges";
import { ProjectCard } from "@/components/projects/project-card";
import { PurchaseButton } from "@/components/projects/purchase-button";
import { ProjectReviews } from "@/components/projects/project-reviews";
import { VerifiedTick } from "@/components/verified-tick";
import { useAppStore } from "@/store/use-app-store";
import { cn } from "@/lib/utils";

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
  const commercial = project ? isCommercialListing(project) : false;
  const licenseMeta = project ? getLicenseMeta(project.license) : null;

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
        {commercial ? (
          <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
            <Briefcase className="h-4 w-4 shrink-0" />
            <span className="font-medium">Market listing</span>
            <span className="text-amber-900/80 dark:text-amber-100/80">
              — real commercial product. Open to companies and developers; no
              campus exclusivity lock.
            </span>
          </div>
        ) : (
          <div className="mb-6 flex flex-wrap items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-950 dark:text-cyan-100">
            <GraduationCap className="h-4 w-4 shrink-0" />
            <span className="font-medium">Campus listing</span>
            <span className="text-cyan-900/80 dark:text-cyan-100/80">
              — student / academic use with same-university presentation
              exclusivity.
            </span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3 lg:gap-10">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            <div
              className={cn(
                "relative aspect-video overflow-hidden rounded-2xl border",
                commercial ? "border-amber-500/40" : "border-border"
              )}
            >
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
                <ListingTypeBadge
                  listingType={project.listingType}
                  license={project.license}
                />
                <LicenseBadge license={project.license} />
                <Badge variant="secondary">{categoryLabel(project.category)}</Badge>
                {project.pricingType === "FREE" && (
                  <Badge variant="success">Free</Badge>
                )}
              </div>
              <h1 className="text-2xl font-bold break-words text-foreground sm:text-3xl lg:text-4xl">
                {project.title}
              </h1>
              <p className="mt-3 break-words text-muted">{project.description}</p>
              {licenseMeta ? (
                <p className="mt-3 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {licenseMeta.label}:
                  </span>{" "}
                  {licenseMeta.description}
                </p>
              ) : null}
            </div>

            {project.setupGuide ? (
              <Card>
                <CardContent className="space-y-3 p-5 sm:p-6">
                  <h2 className="text-lg font-semibold text-foreground">
                    How to use / setup
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Read this before you buy so you know what happens after
                    purchase. Full steps stay available in your purchases too.
                  </p>
                  <pre className="whitespace-pre-wrap rounded-xl border border-border bg-foreground/[0.03] p-4 text-sm leading-relaxed text-foreground">
                    {project.setupGuide}
                  </pre>
                  {project.documentationUrl ? (
                    <a
                      href={project.documentationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex text-sm text-primary underline"
                    >
                      Open documentation
                    </a>
                  ) : null}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="min-w-0 space-y-4 lg:row-span-2 lg:self-start">
            <Card
              className={cn(
                "lg:sticky lg:top-24",
                commercial && "border-amber-500/40"
              )}
            >
              <CardContent className="space-y-5 p-5 sm:p-6">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {commercial ? "Commercial price" : "Campus price"}
                  </p>
                  <div
                    className={cn(
                      "text-3xl font-bold",
                      commercial
                        ? "text-amber-700 dark:text-amber-300"
                        : "text-foreground"
                    )}
                  >
                    {formatPrice(project.price)}
                  </div>
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
                  <p className="flex items-start gap-2">
                    <Shield className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="min-w-0 break-words">
                      {licenseMeta?.label}: {licenseMeta?.description}
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
                      <span className="truncate">
                        {institutionShort(project.seller.university) ||
                          project.seller.university}
                      </span>
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

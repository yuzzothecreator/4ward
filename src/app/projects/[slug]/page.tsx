import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Star, ExternalLink, Code2, Download, GraduationCap, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getProjectBySlug, demoProjects } from "@/lib/demo-data";
import { formatPrice, categoryLabel, formatNumber } from "@/lib/utils";
import { ProjectCard } from "@/components/projects/project-card";
import { PurchaseButton } from "@/components/projects/purchase-button";
import { ProjectReviews } from "@/components/projects/project-reviews";

export function generateStaticParams() {
  return demoProjects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };
  return { title: project.title, description: project.shortDescription };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const related = demoProjects
    .filter((p) => p.category === project.category && p.id !== project.id)
    .slice(0, 3);

  return (
    <div className="gradient-mesh min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
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
              <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{project.title}</h1>
              <p className="mt-3 text-muted">{project.description}</p>
            </div>

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
              <CardContent className="grid grid-cols-3 gap-4 p-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(project.views)}</p>
                  <p className="text-xs text-muted-foreground">Views</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatNumber(project.downloads)}</p>
                  <p className="text-xs text-muted-foreground">Downloads</p>
                </div>
                <div>
                  <p className="flex items-center justify-center gap-1 text-2xl font-bold text-amber-400">
                    <Star className="h-5 w-5 fill-amber-400" />
                    {project.rating}
                  </p>
                  <p className="text-xs text-muted-foreground">{project.reviewCount} reviews</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="sticky top-24">
              <CardContent className="space-y-5 p-6">
                <div className="text-3xl font-bold text-foreground">{formatPrice(project.price)}</div>
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
                    <Download className="h-4 w-4 text-primary" />
                    Instant secure download
                  </p>
                  <p className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    License: {project.license.replace("_", " ")}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <Link href={`/${project.seller.username}`} className="flex items-center gap-3">
                  <Image
                    src={project.seller.avatar}
                    alt={project.seller.name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                  <div>
                    <p className="font-medium text-foreground">{project.seller.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <GraduationCap className="h-3 w-3" />
                      {project.seller.university}
                    </p>
                  </div>
                </Link>
                <div className="mt-3 flex flex-wrap gap-1">
                  {project.seller.badges.map((b) => (
                    <Badge key={b} variant="success">
                      {b.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-10">
          <ProjectReviews projectId={project.id} />
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

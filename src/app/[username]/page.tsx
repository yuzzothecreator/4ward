import Image from "next/image";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ProjectCard } from "@/components/projects/project-card";
import { getUserByUsername, getProjectsByUsername, demoUsers } from "@/lib/demo-data";
import { formatNumber, formatPrice } from "@/lib/utils";
import { GraduationCap, Code2, Globe } from "lucide-react";

export function generateStaticParams() {
  return demoUsers.map((u) => ({ username: u.username }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = getUserByUsername(username);
  return { title: user ? `${user.name} (@${user.username})` : "Creator" };
}

export default async function PortfolioPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const user = getUserByUsername(username);
  if (!user) notFound();

  const projects = getProjectsByUsername(username);

  return (
    <div className="gradient-mesh min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="glass mb-10 rounded-3xl p-8 sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Image
              src={user.avatar}
              alt={user.name}
              width={96}
              height={96}
              className="rounded-2xl"
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold text-foreground">{user.name}</h1>
                {user.badges.map((b) => (
                  <Badge key={b} variant="success">
                    {b.replace(/_/g, " ")}
                  </Badge>
                ))}
              </div>
              <p className="mt-1 text-muted-foreground">@{user.username}</p>
              <p className="mt-3 max-w-2xl text-foreground/80">{user.bio}</p>
              <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                <GraduationCap className="h-4 w-4 text-primary" />
                {user.university}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {user.skills.map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
              </div>
              <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" /> Portfolio
                </span>
                <span className="flex items-center gap-1">
                  <Code2 className="h-3.5 w-3.5" /> GitHub
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center sm:min-w-[180px]">
              <div className="rounded-xl bg-foreground/5 p-4">
                <p className="text-xl font-bold text-foreground">{formatNumber(user.totalSales)}</p>
                <p className="text-xs text-muted-foreground">Sales</p>
              </div>
              <div className="rounded-xl bg-foreground/5 p-4">
                <p className="text-xl font-bold text-primary">{formatPrice(user.revenue)}</p>
                <p className="text-xs text-muted-foreground">Earned</p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="mb-6 text-2xl font-bold text-foreground">Projects</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <ProjectCard key={p.id} project={p} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ProjectCard } from "@/components/projects/project-card";
import { VerifiedTick } from "@/components/verified-tick";
import { formatNumber } from "@/lib/utils";
import { GraduationCap, Code2, Globe, Loader2 } from "lucide-react";
import type { DemoProject } from "@/lib/demo-data";

type ProfileUser = {
  name: string;
  username: string;
  avatar: string;
  bio: string;
  university: string;
  skills: string[];
  badges: string[];
  verified: boolean;
  totalSales: number;
  projectsCount?: number;
  website?: string | null;
  githubUrl?: string | null;
};

export default function PortfolioPage() {
  const params = useParams<{ username: string }>();
  const username = decodeURIComponent(params.username || "").replace(/^@/, "");
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [projects, setProjects] = useState<DemoProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMissing(false);
    void fetch(`/api/users/by-username/${encodeURIComponent(username)}`)
      .then(async (res) => {
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setMissing(true);
          setUser(null);
          setProjects([]);
          return;
        }
        setUser(data.user);
        setProjects(data.projects || []);
      })
      .catch(() => {
        if (!cancelled) setMissing(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [username]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-sm text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading profile…
      </div>
    );
  }

  if (missing || !user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-semibold text-foreground">Creator not found</h1>
        <p className="mt-2 text-sm text-muted">@{username} isn’t on 4ward yet.</p>
      </div>
    );
  }

  const verified =
    user.verified || user.badges?.includes("VERIFIED_CREATOR");

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
                <h1 className="flex items-center gap-1.5 text-3xl font-bold text-foreground">
                  {user.name}
                  {verified ? <VerifiedTick className="h-7 w-7" /> : null}
                </h1>
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
                {user.website ? (
                  <a
                    href={user.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Globe className="h-3.5 w-3.5" /> Portfolio
                  </a>
                ) : (
                  <span className="flex items-center gap-1">
                    <Globe className="h-3.5 w-3.5" /> Portfolio
                  </span>
                )}
                {user.githubUrl ? (
                  <a
                    href={user.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Code2 className="h-3.5 w-3.5" /> GitHub
                  </a>
                ) : (
                  <span className="flex items-center gap-1">
                    <Code2 className="h-3.5 w-3.5" /> GitHub
                  </span>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center sm:min-w-[180px]">
              <div className="rounded-xl bg-foreground/5 p-4">
                <p className="text-xl font-bold text-foreground">
                  {formatNumber(user.totalSales || 0)}
                </p>
                <p className="text-xs text-muted-foreground">Sales</p>
              </div>
              <div className="rounded-xl bg-foreground/5 p-4">
                <p className="text-xl font-bold text-foreground">
                  {formatNumber(user.projectsCount ?? projects.length)}
                </p>
                <p className="text-xs text-muted-foreground">Projects</p>
              </div>
            </div>
          </div>
        </div>

        <h2 className="mb-4 text-lg font-semibold text-foreground">Projects</h2>
        {projects.length === 0 ? (
          <p className="text-sm text-muted">No published projects yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

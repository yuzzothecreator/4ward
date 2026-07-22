"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Heart, ExternalLink, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice, categoryLabel } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import type { DemoProject } from "@/lib/demo-data";

export function ProjectCard({ project, index = 0 }: { project: DemoProject; index?: number }) {
  const { toggleFavorite, isFavorite } = useAppStore();
  const fav = isFavorite(project.id);

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -6 }}
      className="group overflow-hidden rounded-2xl border border-border bg-foreground/[0.03] backdrop-blur-xl"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <Image
          src={project.coverImage}
          alt={project.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width:768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <button
          onClick={() => toggleFavorite(project.id)}
          className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white backdrop-blur-sm transition hover:bg-black/70"
          aria-label="Favorite"
        >
          <Heart className={`h-4 w-4 ${fav ? "fill-pink-500 text-pink-500" : "text-white"}`} />
        </button>
        <div className="absolute bottom-3 left-3">
          <Badge variant="neon">{categoryLabel(project.category)}</Badge>
        </div>
        <div className="absolute bottom-3 right-3">
          <span className="rounded-lg bg-black/60 px-2.5 py-1 text-sm font-semibold text-white backdrop-blur-sm">
            {formatPrice(project.price)}
          </span>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <Link href={`/projects/${project.slug}`}>
          <h3 className="line-clamp-2 text-base font-semibold text-foreground transition group-hover:text-primary">
            {project.title}
          </h3>
        </Link>

        <div className="flex items-center gap-2 text-xs text-muted">
          <GraduationCap className="h-3.5 w-3.5 text-primary" />
          <Link href={`/${project.seller.username}`} className="hover:text-foreground">
            {project.seller.name}
          </Link>
          <span>·</span>
          <span className="truncate">{project.seller.university}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {project.technologyStack.slice(0, 3).map((tech) => (
            <Badge key={tech} variant="secondary">
              {tech}
            </Badge>
          ))}
          {project.technologyStack.length > 3 && (
            <Badge variant="outline">+{project.technologyStack.length - 3}</Badge>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1 text-sm text-amber-400">
            <Star className="h-3.5 w-3.5 fill-amber-400" />
            <span>{project.rating}</span>
            <span className="text-muted-foreground">({project.reviewCount})</span>
          </div>
          <div className="flex gap-2">
            {project.demoUrl && (
              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Demo
                </Button>
              </a>
            )}
            <Link href={`/projects/${project.slug}`}>
              <Button size="sm">View</Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

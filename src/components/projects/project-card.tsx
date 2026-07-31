"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { Heart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice, categoryLabel } from "@/lib/utils";
import { useAppStore } from "@/store/use-app-store";
import { easeOutExpo } from "@/lib/motion";
import { VerifiedTick } from "@/components/verified-tick";
import type { DemoProject } from "@/lib/demo-data";
import { institutionShort } from "@/lib/tanzania-institutions";
import { isCommercialListing } from "@/lib/constants";
import {
  LicenseBadge,
  ListingTypeBadge,
} from "@/components/projects/listing-badges";
import { cn } from "@/lib/utils";

/** Quiet product tile — commercial/market listings get a distinct amber frame */
export function ProjectCard({
  project,
  index = 0,
}: {
  project: DemoProject;
  index?: number;
}) {
  const reduce = useReducedMotion() ?? false;
  const { toggleFavorite, isFavorite } = useAppStore();
  const fav = isFavorite(project.id);
  const commercial = isCommercialListing(project);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        delay: reduce ? 0 : index * 0.05,
        duration: 0.4,
        ease: easeOutExpo,
      }}
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card transition-colors",
        commercial
          ? "border-amber-500/40 shadow-[0_0_0_1px_rgba(245,158,11,0.12)] hover:border-amber-500/70"
          : "border-border hover:border-foreground/20"
      )}
    >
      {commercial ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-0.5 bg-gradient-to-r from-amber-500 via-amber-400 to-orange-400" />
      ) : null}

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          toggleFavorite(project.id);
        }}
        className="absolute right-3 top-3 z-10 rounded-md border border-border bg-card/90 p-1.5 text-muted opacity-100 backdrop-blur transition hover:text-foreground [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
        aria-label={fav ? "Remove from wishlist" : "Add to wishlist"}
      >
        <Heart
          className={`h-3.5 w-3.5 ${fav ? "fill-foreground text-foreground" : ""}`}
        />
      </button>

      <Link href={`/projects/${project.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden border-b border-border">
          <Image
            src={project.coverImage}
            alt={project.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
            sizes="(max-width:768px) 100vw, 33vw"
          />
          <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
            <ListingTypeBadge
              listingType={project.listingType}
              license={project.license}
            />
          </div>
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <h3 className="line-clamp-2 text-[15px] font-medium leading-snug tracking-tight text-foreground">
              {project.title}
            </h3>
            <span
              className={cn(
                "shrink-0 text-sm font-semibold",
                commercial ? "text-amber-700 dark:text-amber-300" : "text-foreground"
              )}
            >
              {formatPrice(project.price)}
            </span>
          </div>
          <p className="flex min-w-0 items-center gap-1 text-[13px] text-muted">
            <span className="truncate">{project.seller.name}</span>
            {project.seller.badges?.includes("VERIFIED_CREATOR") ? (
              <VerifiedTick className="inline-block shrink-0 align-text-bottom" />
            ) : null}
            {!commercial ? (
              <span className="min-w-0 truncate">
                {" "}
                ·{" "}
                {institutionShort(project.seller.university) ||
                  project.seller.university}
              </span>
            ) : (
              <span className="truncate text-amber-700/80 dark:text-amber-300/80">
                {" "}
                · Commercial seller
              </span>
            )}
          </p>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="outline" className="font-normal">
                {categoryLabel(project.category).split(" ")[0]}
              </Badge>
              <LicenseBadge license={project.license} />
            </div>
            <span className="flex items-center gap-1 text-xs text-muted">
              <Star className="h-3 w-3 fill-foreground/40 text-foreground/40" />
              {project.rating}
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

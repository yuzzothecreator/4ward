"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/use-app-store";
import type { DemoProject } from "@/lib/demo-data";

/**
 * Keeps blue-tick + listing badges in sync after admin approval.
 * Refreshes on mount, tab focus, and every 45s while signed in.
 */
export function VerificationStatusSync() {
  const user = useAppStore((s) => s.user);
  const setVerified = useAppStore((s) => s.setVerified);
  const upsertListings = useAppStore((s) => s.upsertListings);
  const lastEmail = useRef<string | null>(null);

  useEffect(() => {
    if (!user?.email) {
      lastEmail.current = null;
      return;
    }

    let cancelled = false;
    const email = user.email;

    async function refreshVerified() {
      try {
        const res = await fetch(
          `/api/verification?email=${encodeURIComponent(email)}`,
          { credentials: "same-origin" }
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled || !res.ok) return;
        setVerified(Boolean(data.verified));
      } catch {
        /* ignore */
      }
    }

    async function refreshCatalog() {
      try {
        const res = await fetch("/api/projects", { credentials: "same-origin" });
        const data = await res.json().catch(() => ({}));
        if (cancelled || !res.ok || !Array.isArray(data.projects)) return;

        const mapped: DemoProject[] = data.projects
          .filter(
            (p: { status?: string }) =>
              p.status === "PUBLISHED" || p.status === "APPROVED"
          )
          .map(
            (p: {
              id: string;
              title: string;
              slug: string;
              description?: string;
              shortDescription?: string | null;
              category: string;
              price: number;
              pricingType: "FREE" | "PAID";
              license: string;
              status: string;
              coverImage: string;
              images?: string[];
              demoUrl?: string | null;
              githubRepo?: string | null;
              technologyStack?: string[];
              views?: number;
              downloads?: number;
              rating?: number;
              reviewCount?: number;
              createdAt: string;
              seller: {
                id: string;
                name: string;
                username: string;
                avatar?: string | null;
                university?: string | null;
                badges?: string[];
              };
            }) => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              description: p.description || "",
              shortDescription:
                p.shortDescription || (p.description || "").slice(0, 140),
              category: p.category,
              price: p.price,
              pricingType: p.pricingType,
              license: p.license,
              status: p.status,
              coverImage: p.coverImage,
              images: p.images?.length ? p.images : [p.coverImage],
              demoUrl: p.demoUrl || "",
              githubRepo: p.githubRepo || undefined,
              technologyStack: p.technologyStack || [],
              views: p.views || 0,
              downloads: p.downloads || 0,
              rating: p.rating || 0,
              reviewCount: p.reviewCount || 0,
              createdAt:
                typeof p.createdAt === "string"
                  ? p.createdAt
                  : new Date(p.createdAt).toISOString(),
              seller: {
                id: p.seller.id,
                name: p.seller.name,
                username: p.seller.username,
                avatar:
                  p.seller.avatar ||
                  `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(p.seller.username)}`,
                university: p.seller.university || "—",
                badges: Array.isArray(p.seller.badges) ? p.seller.badges : [],
              },
            })
          );

        if (mapped.length) upsertListings(mapped);
      } catch {
        /* ignore */
      }
    }

    async function refreshAll() {
      await Promise.all([refreshVerified(), refreshCatalog()]);
    }

    // Always refresh when email changes or on first mount for this user
    if (lastEmail.current !== email) {
      lastEmail.current = email;
    }
    void refreshAll();

    const onFocus = () => {
      void refreshAll();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refreshAll();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const interval = window.setInterval(() => {
      void refreshAll();
    }, 45_000);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, [user?.email, setVerified, upsertListings]);

  return null;
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Heart, Loader2, CheckCircle2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-app-store";
import type { DemoProject } from "@/lib/demo-data";
import Link from "next/link";
import { institutionShort } from "@/lib/tanzania-institutions";
import { isCommercialListing } from "@/lib/constants";

type Availability = {
  allowed: boolean;
  code?: string;
  message?: string;
  lockedUntil?: string;
};

export function PurchaseButton({ project }: { project: DemoProject }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<Availability | null>(null);
  const user = useAppStore((s) => s.user);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const isFavorite = useAppStore((s) => s.isFavorite);
  const addToCart = useAppStore((s) => s.addToCart);
  const hasPurchased = useAppStore((s) => s.hasPurchased);
  const owned = hasPurchased(project.id);
  const commercial = isCommercialListing(project);
  const isOwner =
    !!user &&
    (project.seller.username === user.username || project.seller.id === user.email);

  useEffect(() => {
    if (commercial || !user?.email || owned || isOwner) {
      setAvailability(null);
      return;
    }
    let cancelled = false;
    fetch(
      `/api/purchases/availability?email=${encodeURIComponent(user.email)}&projectId=${encodeURIComponent(project.id)}&slug=${encodeURIComponent(project.slug)}&university=${encodeURIComponent(user.university || "")}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setAvailability(data);
      })
      .catch(() => {
        if (!cancelled) setAvailability(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.email, project.id, project.slug, owned, isOwner, commercial]);

  async function handlePurchase() {
    if (!user && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      router.push(`/sign-up?next=${encodeURIComponent(`/checkout?project=${project.slug}`)}`);
      return;
    }

    if (isOwner) return;
    if (!commercial && availability && !availability.allowed) return;

    setLoading(true);
    addToCart({
      projectId: project.id,
      title: project.title,
      price: project.price,
      coverImage: project.coverImage,
    });

    router.push(`/checkout?project=${project.slug}`);
    setLoading(false);
  }

  if (owned) {
    return (
      <Link href="/dashboard/purchases">
        <Button className="w-full" variant="secondary">
          <CheckCircle2 className="h-4 w-4" />
          Purchased — download
        </Button>
      </Link>
    );
  }

  if (isOwner) {
    return (
      <Button className="w-full" variant="secondary" disabled>
        Your listing
      </Button>
    );
  }

  const locked = !commercial && availability && !availability.allowed;

  return (
    <div className="w-full space-y-2">
      <div className="flex w-full gap-2">
        <Button
          className="min-w-0 flex-1"
          onClick={handlePurchase}
          disabled={loading || Boolean(locked)}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : locked ? (
            <Lock className="h-4 w-4 shrink-0" />
          ) : (
            <ShoppingCart className="h-4 w-4 shrink-0" />
          )}
          {locked
            ? "Campus reserved"
            : project.price === 0
              ? "Get free"
              : commercial
                ? "Buy commercial"
                : "Buy now"}
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="shrink-0"
          onClick={() => toggleFavorite(project.id)}
          aria-label="Favorite"
        >
          <Heart
            className={`h-4 w-4 ${isFavorite(project.id) ? "fill-foreground text-foreground" : ""}`}
          />
        </Button>
      </div>
      {locked && availability?.message ? (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {availability.message}
          {availability.code === "UNIVERSITY_REQUIRED" ? (
            <>
              {" "}
              <Link href="/dashboard/profile" className="text-primary underline">
                Update profile
              </Link>
            </>
          ) : null}
        </p>
      ) : commercial ? (
        <p className="text-[11px] text-amber-800 dark:text-amber-200/80">
          Market product — open to any buyer under a commercial license.
        </p>
      ) : user?.university ? (
        <p className="text-[11px] text-muted-foreground">
          Campus rule: one buyer from{" "}
          {institutionShort(user.university) || user.university} per project for
          4 months (presentation exclusivity).
        </p>
      ) : null}
    </div>
  );
}

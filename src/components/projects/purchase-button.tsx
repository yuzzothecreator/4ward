"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Heart, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-app-store";
import type { DemoProject } from "@/lib/demo-data";
import Link from "next/link";

export function PurchaseButton({ project }: { project: DemoProject }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const user = useAppStore((s) => s.user);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const isFavorite = useAppStore((s) => s.isFavorite);
  const addToCart = useAppStore((s) => s.addToCart);
  const hasPurchased = useAppStore((s) => s.hasPurchased);
  const owned = hasPurchased(project.id);
  const isOwner =
    !!user &&
    (project.seller.username === user.username || project.seller.id === user.email);

  async function handlePurchase() {
    if (!user && !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
      router.push(`/sign-up?next=${encodeURIComponent(`/checkout?project=${project.slug}`)}`);
      return;
    }

    if (isOwner) return;

    setLoading(true);
    addToCart({
      projectId: project.id,
      title: project.title,
      price: project.price,
      coverImage: project.coverImage,
    });

    // Paid projects go to checkout (ClickPesa mobile money / Stripe / demo)
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

  return (
    <div className="flex gap-2">
      <Button className="flex-1" onClick={handlePurchase} disabled={loading}>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
        {project.price === 0 ? "Get free" : "Buy now"}
      </Button>
      <Button
        variant="secondary"
        size="icon"
        onClick={() => toggleFavorite(project.id)}
        aria-label="Favorite"
      >
        <Heart
          className={`h-4 w-4 ${isFavorite(project.id) ? "fill-foreground text-foreground" : ""}`}
        />
      </Button>
    </div>
  );
}

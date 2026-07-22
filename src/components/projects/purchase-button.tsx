"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/use-app-store";
import type { DemoProject } from "@/lib/demo-data";

export function PurchaseButton({ project }: { project: DemoProject }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { toggleFavorite, isFavorite, addToCart } = useAppStore();

  async function handlePurchase() {
    setLoading(true);
    addToCart({
      projectId: project.id,
      title: project.title,
      price: project.price,
      coverImage: project.coverImage,
    });

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        router.push(`/checkout?project=${project.slug}&demo=1`);
      }
    } catch {
      router.push(`/checkout?project=${project.slug}&demo=1`);
    } finally {
      setLoading(false);
    }
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
          className={`h-4 w-4 ${isFavorite(project.id) ? "fill-pink-500 text-pink-500" : ""}`}
        />
      </Button>
    </div>
  );
}

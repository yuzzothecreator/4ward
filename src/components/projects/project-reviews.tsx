"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppStore } from "@/store/use-app-store";

type ReviewItem = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { name: string; username: string; avatar: string };
};

function formatReviewDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function ProjectReviews({
  projectId,
  slug,
  title,
  price,
  onStats,
}: {
  projectId: string;
  slug: string;
  title?: string;
  price?: number;
  onStats?: (stats: { average: number; count: number }) => void;
}) {
  const user = useAppStore((s) => s.user);
  const hasPurchased = useAppStore((s) => s.hasPurchased);
  const ownedLocally = hasPurchased(projectId);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [canReview, setCanReview] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ projectId, slug });
      if (user?.email) params.set("email", user.email);
      const res = await fetch(`/api/reviews?${params.toString()}`);
      const data = await res.json();
      const list: ReviewItem[] = Array.isArray(data.reviews) ? data.reviews : [];
      setReviews(list);
      setCanReview(Boolean(data.canReview) || (ownedLocally && !data.alreadyReviewed));
      setAlreadyReviewed(Boolean(data.alreadyReviewed));
      onStats?.({
        average: typeof data.average === "number" ? data.average : 0,
        count: typeof data.count === "number" ? data.count : list.length,
      });
    } catch {
      setReviews([]);
      setError("Could not load reviews");
    } finally {
      setLoading(false);
    }
  }, [projectId, slug, user?.email, ownedLocally, onStats]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  async function submitReview() {
    if (!user) return;
    if (comment.trim().length < 10) {
      setError("Comment must be at least 10 characters");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          slug,
          title,
          price,
          rating,
          comment: comment.trim(),
          email: user.email,
          name: user.name,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not post review");
        return;
      }
      setComment("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 2000);
      await loadReviews();
    } catch {
      setError("Network error posting review");
    } finally {
      setSubmitting(false);
    }
  }

  const showForm = Boolean(user) && (canReview || ownedLocally) && !alreadyReviewed;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!user ? (
          <div className="rounded-xl border border-border bg-background/40 p-4 text-sm text-muted">
            <Link href={`/sign-in?next=${encodeURIComponent(`/projects/${slug}`)}`} className="font-medium text-foreground underline-offset-2 hover:underline">
              Sign in
            </Link>{" "}
            to leave a review after you purchase.
          </div>
        ) : showForm ? (
          <div className="space-y-3 rounded-xl border border-border bg-background/40 p-4">
            <p className="text-sm font-medium text-foreground">Leave a review</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} stars`}>
                  <Star
                    className={`h-5 w-5 ${n <= rating ? "fill-warning text-warning" : "text-muted-foreground"}`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your real experience with this project (min 10 characters)..."
              maxLength={1000}
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button
              onClick={submitReview}
              disabled={submitting || comment.trim().length < 10}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {submitted ? "Posted!" : "Post review"}
            </Button>
          </div>
        ) : alreadyReviewed ? (
          <p className="text-sm text-muted">You already reviewed this project.</p>
        ) : (
          <p className="text-sm text-muted">
            Purchase this project to leave a verified review.
          </p>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading reviews…
            </div>
          ) : reviews.length === 0 ? (
            <p className="text-sm text-muted">No reviews yet. Be the first to share your experience.</p>
          ) : (
            reviews.map((r) => (
              <div key={r.id} className="flex gap-3 border-b border-border pb-4 last:border-0">
                <Avatar>
                  <AvatarImage src={r.user.avatar} alt={r.user.name} />
                  <AvatarFallback>{r.user.name[0] || "?"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{r.user.name}</p>
                    <div className="flex">
                      {Array.from({ length: r.rating }).map((_, idx) => (
                        <Star key={idx} className="h-3 w-3 fill-warning text-warning" />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatReviewDate(r.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{r.comment}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

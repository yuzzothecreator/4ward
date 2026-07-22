"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const seedReviews = [
  {
    name: "Sarah Chen",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=Sarah",
    rating: 5,
    comment: "Clean codebase and excellent docs. Used this for my final year reference.",
    date: "2 weeks ago",
  },
  {
    name: "Mike Otieno",
    avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=Mike",
    rating: 4,
    comment: "Solid architecture. Wish the demo video was longer, but worth the price.",
    date: "1 month ago",
  },
];

export function ProjectReviews({ projectId }: { projectId: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState(seedReviews);
  const [submitted, setSubmitted] = useState(false);

  function submitReview() {
    if (!comment.trim()) return;
    setReviews([
      {
        name: "You",
        avatar: "https://api.dicebear.com/7.x/avataaars/png?seed=You",
        rating,
        comment,
        date: "Just now",
      },
      ...reviews,
    ]);
    setComment("");
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
    void projectId;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
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
            placeholder="Share your experience with this project..."
          />
          <Button onClick={submitReview} disabled={!comment.trim()}>
            {submitted ? "Posted!" : "Post review"}
          </Button>
        </div>

        <div className="space-y-4">
          {reviews.map((r, i) => (
            <div key={`${r.name}-${i}`} className="flex gap-3 border-b border-border pb-4 last:border-0">
              <Avatar>
                <AvatarImage src={r.avatar} alt={r.name} />
                <AvatarFallback>{r.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{r.name}</p>
                  <div className="flex">
                    {Array.from({ length: r.rating }).map((_, idx) => (
                      <Star key={idx} className="h-3 w-3 fill-warning text-warning" />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">{r.date}</span>
                </div>
                <p className="mt-1 text-sm text-muted">{r.comment}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

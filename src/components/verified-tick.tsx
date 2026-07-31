import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/** Blue verification tick for approved sellers */
export function VerifiedTick({
  className,
  title = "Verified seller",
}: {
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={cn("inline-flex shrink-0 text-sky-500", className)}
      title={title}
      aria-label={title}
    >
      <BadgeCheck className="h-[1.05em] w-[1.05em]" aria-hidden />
    </span>
  );
}

export function isVerifiedSeller(badges?: string[] | null) {
  return Boolean(badges?.includes("VERIFIED_CREATOR"));
}

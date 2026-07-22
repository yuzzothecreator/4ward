import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  /** Gradient border around glass surface */
  gradientBorder?: boolean;
  blur?: "sm" | "md" | "lg" | "xl";
};

const blurMap = {
  sm: "backdrop-blur-sm",
  md: "backdrop-blur-md",
  lg: "backdrop-blur-lg",
  xl: "backdrop-blur-xl",
} as const;

/**
 * Glassmorphism card from tailwind-gradient-builder,
 * using 4ward tokens (primary → accent border).
 */
export function GlassCard({
  children,
  className,
  gradientBorder = false,
  blur = "xl",
}: GlassCardProps) {
  const inner = (
    <div
      className={cn(
        blurMap[blur],
        "rounded-[27px] border border-border bg-card/70 shadow-xl",
        "dark:bg-card/50 dark:border-white/10",
        !gradientBorder && className
      )}
    >
      {children}
    </div>
  );

  if (!gradientBorder) return inner;

  return (
    <div
      className={cn(
        "rounded-[28px] bg-gradient-to-br from-primary/50 via-border to-accent/40 p-px shadow-xl",
        className
      )}
    >
      {inner}
    </div>
  );
}

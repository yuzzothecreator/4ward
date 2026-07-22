"use client";

import { cn } from "@/lib/utils";

type MeshGradientProps = {
  className?: string;
  /** Brand-aligned mesh blobs (oklch/hsla strings) */
  colors?: string[];
  animated?: boolean;
};

const DEFAULT_COLORS = [
  "hsla(217, 91%, 60%, 0.28)", // primary blue
  "hsla(189, 94%, 43%, 0.22)", // accent cyan
  "hsla(224, 76%, 48%, 0.18)", // deeper blue
  "hsla(199, 89%, 48%, 0.16)", // sky
];

const POSITIONS = ["40% 18%", "82% 8%", "8% 55%", "78% 62%"];

/**
 * Multi-layer radial mesh — from tailwind-gradient-builder skill,
 * tuned to 4ward primary/accent (no purple neon).
 */
export function MeshGradient({
  className,
  colors = DEFAULT_COLORS,
  animated = false,
}: MeshGradientProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div className="absolute inset-0 bg-background" />
      {colors.map((color, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0",
            animated && "animate-pulse-gradient"
          )}
          style={{
            background: `radial-gradient(at ${POSITIONS[i] ?? "50% 50%"}, ${color} 0px, transparent 55%)`,
            animationDelay: animated ? `${i * 0.6}s` : undefined,
          }}
        />
      ))}
    </div>
  );
}

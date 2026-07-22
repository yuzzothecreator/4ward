"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  cardTransition,
  fadeUp,
  hoverLift,
  viewportOnce,
} from "@/lib/motion";

export type BentoSpan = "default" | "wide" | "tall" | "feature";

const spanClass: Record<BentoSpan, string> = {
  default: "lg:col-span-1 lg:row-span-1",
  wide: "lg:col-span-2 lg:row-span-1",
  tall: "lg:col-span-1 lg:row-span-2",
  feature: "lg:col-span-2 lg:row-span-2",
};

type BentoCardProps = {
  title: string;
  description: string;
  icon: ReactNode;
  visual: ReactNode;
  span?: BentoSpan;
  className?: string;
  index?: number;
};

/** Quiet Linear-style feature tile — hairline border, no neon frame */
export function BentoCard({
  title,
  description,
  icon,
  visual,
  span = "default",
  className,
  index = 0,
}: BentoCardProps) {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <motion.article
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      transition={{
        ...cardTransition(reduceMotion),
        delay: reduceMotion ? 0 : index * 0.05,
      }}
      whileHover={hoverLift(reduceMotion)}
      tabIndex={0}
      className={cn(
        "group flex min-h-[260px] flex-col overflow-hidden rounded-xl border border-border bg-card outline-none",
        "shadow-[0_0_0_1px_rgba(255,255,255,0.02)]",
        "transition-[border-color,box-shadow] duration-200",
        "hover:border-foreground/20",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        spanClass[span],
        className
      )}
    >
      <div className="flex flex-1 flex-col p-5">
        <header className="mb-4 flex items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04] text-muted"
            aria-hidden
          >
            {icon}
          </div>
          <div className="min-w-0 pt-0.5">
            <h3 className="text-[15px] font-medium tracking-tight text-foreground">
              {title}
            </h3>
            <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>
          </div>
        </header>

        <div className="relative mt-auto min-h-[132px] flex-1 overflow-hidden rounded-lg border border-border bg-background">
          {visual}
        </div>
      </div>
    </motion.article>
  );
}

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
        delay: reduceMotion ? 0 : index * 0.06,
      }}
      whileHover={hoverLift(reduceMotion)}
      tabIndex={0}
      className={cn(
        "group relative flex min-h-[280px] flex-col outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        spanClass[span],
        className
      )}
    >
      <div
        className={cn(
          "flex h-full flex-1 flex-col rounded-[28px] p-px",
          "bg-gradient-to-br from-primary/45 via-border to-accent/35",
          "shadow-[0_8px_40px_-12px_rgba(0,0,0,0.35)]",
          "transition-shadow duration-300",
          "group-hover:shadow-[0_16px_48px_-12px_rgba(59,130,246,0.28)]"
        )}
      >
        <div
          className={cn(
            "flex h-full flex-col overflow-hidden rounded-[27px]",
            "glass"
          )}
        >
          <div className="flex flex-1 flex-col p-5 sm:p-6">
            <header className="mb-4 flex items-start gap-3">
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
                  "bg-primary/15 text-primary ring-1 ring-primary/20"
                )}
                aria-hidden
              >
                {icon}
              </div>
              <div className="min-w-0 pt-0.5">
                <h3 className="font-display text-base font-semibold tracking-tight text-foreground sm:text-lg">
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
              </div>
            </header>

            <div className="relative mt-auto min-h-[140px] flex-1 overflow-hidden rounded-2xl bg-foreground/[0.03] ring-1 ring-border">
              {visual}
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

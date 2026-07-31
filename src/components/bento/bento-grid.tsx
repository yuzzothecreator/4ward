"use client";

import {
  Bot,
  BarChart3,
  Users,
  ShieldCheck,
  Store,
  Bell,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp, staggerContainer, viewportOnce, cardTransition } from "@/lib/motion";

const features = [
  {
    title: "AI listing assist",
    description: "Draft titles, tags, and descriptions from your upload — edit before publish.",
    icon: Bot,
  },
  {
    title: "Sales analytics",
    description: "Revenue, views, and downloads in one quiet dashboard as sales land.",
    icon: BarChart3,
  },
  {
    title: "Buyer messaging",
    description: "Clarify scope and licenses without leaving the project thread.",
    icon: Users,
  },
  {
    title: "Verified Market sellers",
    description:
      "Commercial Market listings require blue-tick verification — trust for company buyers.",
    icon: ShieldCheck,
  },
  {
    title: "Campus & Market shelves",
    description:
      "Student Campus projects and commercial Market products — clear badges so buyers never mix them up.",
    icon: Store,
  },
  {
    title: "Realtime alerts",
    description: "Sales, reviews, and approvals — delivered the moment they happen.",
    icon: Bell,
  },
];

/** Simple professional capability grid — no decorative mini-cards */
export function BentoGrid() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <section
      id="product"
      aria-labelledby="bento-heading"
      className="border-b border-border bg-background"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mb-14 max-w-2xl"
        >
          <motion.p
            variants={fadeUp}
            transition={cardTransition(reduceMotion)}
            className="font-mono text-xs text-muted-foreground"
          >
            3.5 Product
          </motion.p>
          <motion.h2
            id="bento-heading"
            variants={fadeUp}
            transition={cardTransition(reduceMotion)}
            className="font-display mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl"
          >
            Make campus commerce self-driving
          </motion.h2>
          <motion.p
            variants={fadeUp}
            transition={cardTransition(reduceMotion)}
            className="mt-3 text-[15px] leading-relaxed text-muted text-pretty"
          >
            Turn conversations and uploads into published listings — routed,
            reviewed, and ready for buyers.
          </motion.p>
        </motion.div>

        <motion.ul
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3"
        >
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <motion.li
                key={f.title}
                variants={fadeUp}
                transition={cardTransition(reduceMotion)}
                className="bg-background p-6 sm:p-7"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-foreground/[0.02] text-muted">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <h3 className="mt-4 text-[15px] font-medium tracking-tight text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-muted text-pretty">
                  {f.description}
                </p>
              </motion.li>
            );
          })}
        </motion.ul>
      </div>
    </section>
  );
}

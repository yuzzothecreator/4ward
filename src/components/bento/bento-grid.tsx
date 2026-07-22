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
import { BentoCard } from "@/components/bento/bento-card";
import {
  AiWorkflowVisual,
  AnalyticsVisual,
  CollaborationVisual,
  SecurityVisual,
  MarketplaceVisual,
  NotificationsVisual,
} from "@/components/bento/bento-visuals";
import { fadeUp, staggerContainer, viewportOnce, cardTransition } from "@/lib/motion";

const features = [
  {
    title: "AI Automation",
    description: "Generate listings, tags, and descriptions from your project files.",
    icon: <Bot className="h-4 w-4" />,
    visual: <AiWorkflowVisual />,
    span: "feature" as const,
  },
  {
    title: "Analytics",
    description: "Revenue, views, and downloads — live as sales come in.",
    icon: <BarChart3 className="h-4 w-4" />,
    visual: <AnalyticsVisual />,
    span: "wide" as const,
  },
  {
    title: "Collaboration",
    description: "Buyer ↔ seller chat without leaving the project page.",
    icon: <Users className="h-4 w-4" />,
    visual: <CollaborationVisual />,
    span: "default" as const,
  },
  {
    title: "Security",
    description: "Signed downloads, license checks, and verified payments.",
    icon: <ShieldCheck className="h-4 w-4" />,
    visual: <SecurityVisual />,
    span: "default" as const,
  },
  {
    title: "Marketplace",
    description: "Discover student-built apps across every campus stack.",
    icon: <Store className="h-4 w-4" />,
    visual: <MarketplaceVisual />,
    span: "wide" as const,
  },
  {
    title: "Notifications",
    description: "Sales, reviews, and approvals — the moment they happen.",
    icon: <Bell className="h-4 w-4" />,
    visual: <NotificationsVisual />,
    span: "wide" as const,
  },
];

export function BentoGrid() {
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <section
      id="product"
      aria-labelledby="bento-heading"
      className="border-b border-border bg-background"
    >
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mb-12 max-w-2xl"
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
            className="font-display mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Make campus commerce self-driving
          </motion.h2>
          <motion.p
            variants={fadeUp}
            transition={cardTransition(reduceMotion)}
            className="mt-3 text-[15px] leading-relaxed text-muted"
          >
            Turn conversations and uploads into published listings — routed,
            reviewed, and ready for buyers.
          </motion.p>
        </motion.div>

        <div className="grid auto-rows-[minmax(260px,auto)] grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4 lg:gap-3">
          {features.map((f, i) => (
            <BentoCard
              key={f.title}
              title={f.title}
              description={f.description}
              icon={f.icon}
              visual={f.visual}
              span={f.span}
              index={i}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

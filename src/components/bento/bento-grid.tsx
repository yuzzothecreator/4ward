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
    icon: <Bot className="h-5 w-5" />,
    visual: <AiWorkflowVisual />,
    span: "feature" as const,
  },
  {
    title: "Analytics Dashboard",
    description: "Revenue, views, and downloads — live as sales come in.",
    icon: <BarChart3 className="h-5 w-5" />,
    visual: <AnalyticsVisual />,
    span: "wide" as const,
  },
  {
    title: "Collaboration",
    description: "Buyer ↔ seller chat without leaving the project page.",
    icon: <Users className="h-5 w-5" />,
    visual: <CollaborationVisual />,
    span: "default" as const,
  },
  {
    title: "Security",
    description: "Signed downloads, license checks, and verified payments.",
    icon: <ShieldCheck className="h-5 w-5" />,
    visual: <SecurityVisual />,
    span: "default" as const,
  },
  {
    title: "Marketplace",
    description: "Discover student-built apps across every campus stack.",
    icon: <Store className="h-5 w-5" />,
    visual: <MarketplaceVisual />,
    span: "wide" as const,
  },
  {
    title: "Notifications",
    description: "Sales, reviews, and approvals — delivered the moment they happen.",
    icon: <Bell className="h-5 w-5" />,
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
      className="relative overflow-hidden gradient-mesh"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[720px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <motion.p
            variants={fadeUp}
            transition={cardTransition(reduceMotion)}
            className="text-xs font-medium uppercase tracking-[0.22em] text-primary"
          >
            Product
          </motion.p>
          <motion.h2
            id="bento-heading"
            variants={fadeUp}
            transition={cardTransition(reduceMotion)}
            className="font-display mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            Make campus commerce self-driving
          </motion.h2>
          <motion.p
            variants={fadeUp}
            transition={cardTransition(reduceMotion)}
            className="mt-3 text-muted"
          >
            Automation, analytics, trust, and discovery — the same quiet craft as{" "}
            <a
              href="https://linear.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Linear
            </a>
            , built for student creators.
          </motion.p>
        </motion.div>

        <div
          className="grid auto-rows-[minmax(280px,auto)] grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5"
        >
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

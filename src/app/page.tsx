"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/project-card";
import { BentoGrid } from "@/components/bento";
import { HeroProductMock } from "@/components/landing/hero-product-mock";
import {
  DiscoverRailMock,
  EarnRailMock,
  SellRailMock,
} from "@/components/landing/feature-rails";
import { demoProjects } from "@/lib/demo-data";
import { CATEGORIES, STATS } from "@/lib/constants";
import { easeOutExpo } from "@/lib/motion";

const rails = [
  {
    fig: "1.0",
    label: "Sell",
    title: "List after you present",
    copy: "Upload source, docs, and demos the same week you defend. We review once, then publish to the shelf.",
    mock: <SellRailMock />,
  },
  {
    fig: "2.0",
    label: "Discover",
    title: "Buy ready-made systems",
    copy: "Browse campus projects by stack, university, and license — real repos, not vaporware decks.",
    mock: <DiscoverRailMock />,
  },
  {
    fig: "3.0",
    label: "Earn",
    title: "Get paid on every download",
    copy: "Stripe today. African rails next. You keep the majority; we handle delivery and licenses.",
    mock: <EarnRailMock />,
  },
];

export default function HomePage() {
  const featured = demoProjects.slice(0, 3);
  const spotlight = demoProjects[0];

  return (
    <div className="overflow-x-hidden bg-background">
      {/* Hero */}
      <section className="relative border-b border-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsla(217,91%,60%,0.10),transparent_55%)]" />

        <div className="relative mx-auto max-w-4xl px-4 pb-12 pt-20 text-center sm:px-6 sm:pt-28">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: easeOutExpo }}
            className="text-sm text-muted"
          >
            The student product marketplace
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: easeOutExpo }}
            className="font-display mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-[3.5rem] md:leading-[1.1]"
          >
            Turn finished campus projects
            <br className="hidden sm:block" /> into products people buy
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: easeOutExpo }}
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg"
          >
            Purpose-built for students and developers. Sell source, docs, and demos
            after presentation — with the craft of a modern product system.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: easeOutExpo }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/marketplace">
              <Button size="lg">
                Explore Projects
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="lg" variant="secondary">
                Sell Your Project
              </Button>
            </Link>
          </motion.div>
        </div>

        <div className="relative px-4 pb-20 sm:px-6">
          <HeroProductMock />
        </div>
      </section>

      {/* Quiet proof */}
      <section className="border-b border-border">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-4 py-10 text-center sm:px-6 sm:py-12">
          <p className="text-sm text-muted">
            <span className="text-foreground">{STATS.projects}</span> projects ·{" "}
            <span className="text-foreground">{STATS.universities}</span> universities ·{" "}
            <span className="text-foreground">{STATS.creators}</span> creators
          </p>
        </div>
      </section>

      {/* Product rails — Linear Intake / Plan / Build pattern */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6 sm:py-28">
          <p className="text-sm text-muted">A new species of campus marketplace</p>
          <h2 className="font-display mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Purpose-built for shipping student work into the real world.
          </h2>
        </div>

        <div className="mx-auto max-w-6xl space-y-0 px-4 pb-8 sm:px-6 sm:pb-16">
          {rails.map((rail, i) => (
            <div
              key={rail.fig}
              className="grid items-center gap-10 border-t border-border py-16 lg:grid-cols-2 lg:gap-16 lg:py-20"
            >
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, ease: easeOutExpo }}
                className={i % 2 === 1 ? "lg:order-2" : undefined}
              >
                <p className="font-mono text-xs text-muted-foreground">FIG {rail.fig}</p>
                <p className="mt-1 text-sm font-medium text-primary">{rail.label}</p>
                <h3 className="font-display mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  {rail.title}
                </h3>
                <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">
                  {rail.copy}
                </p>
              </motion.div>
              <div className={i % 2 === 1 ? "lg:order-1" : undefined}>{rail.mock}</div>
            </div>
          ))}
        </div>
      </section>

      <BentoGrid />

      {/* Spotlight */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="mb-10 max-w-xl">
            <p className="font-mono text-xs text-muted-foreground">4.0 Spotlight</p>
            <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-foreground">
              Ready-made work, not slideware
            </h2>
          </div>
          <div className="grid items-stretch gap-3 lg:grid-cols-12">
            <div className="relative min-h-[320px] overflow-hidden rounded-xl border border-border lg:col-span-7">
              <Image
                src={spotlight.coverImage}
                alt={spotlight.title}
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 58vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <h3 className="font-display max-w-lg text-2xl font-semibold text-white">
                  {spotlight.title}
                </h3>
                <p className="mt-2 text-sm text-white/70">
                  {spotlight.seller.name} · {spotlight.seller.university}
                </p>
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-border bg-card p-7 sm:p-8 lg:col-span-5">
              <div>
                <p className="text-[15px] leading-relaxed text-muted">
                  {spotlight.shortDescription} Buyers get source, docs, and a clear license.
                </p>
                <ul className="mt-6 space-y-2.5 text-sm text-muted">
                  {spotlight.technologyStack.slice(0, 4).map((t) => (
                    <li key={t} className="flex items-center gap-2.5">
                      <span className="h-1 w-1 rounded-full bg-foreground/40" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href={`/projects/${spotlight.slug}`} className="mt-8 inline-flex">
                <Button>
                  View project
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs text-muted-foreground">5.0 Browse</p>
              <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-foreground">
                Shop by craft
              </h2>
            </div>
            <Link
              href="/marketplace"
              className="text-sm text-muted transition hover:text-foreground"
            >
              Open marketplace →
            </Link>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={`/marketplace?category=${cat.value}`}
                className="group flex items-center justify-between bg-card px-5 py-4 transition hover:bg-foreground/[0.03]"
              >
                <span className="text-sm text-foreground">{cat.label}</span>
                <ArrowUpRight className="h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-muted-foreground">6.0 Catalog</p>
              <h2 className="font-display mt-2 text-3xl font-semibold tracking-tight text-foreground">
                Fresh on the shelf
              </h2>
            </div>
            <Link href="/marketplace">
              <Button variant="outline">Browse all</Button>
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-24">
          <blockquote className="font-display text-2xl font-medium leading-snug tracking-tight text-foreground sm:text-3xl">
            “You’ll probably build a better product — just because your campus work finally has a real shelf.”
          </blockquote>
          <p className="mt-6 text-sm text-muted">Built for student creators on 4ward</p>
        </div>
      </section>

      {/* Quiet CTA */}
      <section className="border-b border-border px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Built for campus builders.
            <br />
            Available today.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted">
            List after you present. Keep ownership. Get paid when someone downloads your work.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/sign-up">
              <Button size="lg">Start selling</Button>
            </Link>
            <Link href="/marketplace">
              <Button size="lg" variant="secondary">
                Explore projects
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

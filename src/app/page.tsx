"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/projects/project-card";
import { BentoGrid } from "@/components/bento";
import { MeshGradient } from "@/components/ui/mesh-gradient";
import { GradientText } from "@/components/ui/gradient-text";
import { demoProjects } from "@/lib/demo-data";
import { CATEGORIES, STATS } from "@/lib/constants";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1800&q=80";

const steps = [
  {
    n: "01",
    title: "Ship it after the defense",
    copy: "Upload source, docs, demos, and screenshots the same week you present.",
  },
  {
    n: "02",
    title: "Get reviewed once",
    copy: "We check quality and originality, then publish to the marketplace.",
  },
  {
    n: "03",
    title: "Earn on every download",
    copy: "Buyers pay. You keep the majority. Stripe today, African rails next.",
  },
];

export default function HomePage() {
  const featured = demoProjects.slice(0, 3);
  const spotlight = demoProjects[0];

  return (
    <div className="overflow-x-hidden">
      {/* ── Hero: one composition ── */}
      <section className="relative min-h-[calc(100vh-4rem)] overflow-hidden grain">
        <div className="absolute inset-0">
          <Image
            src={HERO_IMAGE}
            alt="Students collaborating on software projects"
            fill
            priority
            className="animate-drift object-cover"
            sizes="100vw"
          />
          <div className="hero-wash absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-accent/15 mix-blend-soft-light" />
        </div>

        <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-end px-4 pb-16 pt-24 sm:px-6 sm:pb-20 lg:justify-center lg:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            <p className="font-display text-5xl font-extrabold tracking-tight text-foreground sm:text-6xl md:text-7xl">
              <GradientText animated>4ward</GradientText>
            </p>
            <h1 className="font-display mt-5 max-w-xl text-3xl font-semibold leading-[1.15] tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Turn finished campus projects into products people buy.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">
              The marketplace for students and developers to sell source code,
              documentation, and demos after presentation.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/marketplace">
                <Button size="lg">
                  Explore Projects
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/sell">
                <Button size="lg" variant="secondary">
                  Sell Your Project
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Proof line (not a stat strip) ── */}
      <section className="border-y border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <p className="max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
            <span className="font-medium text-foreground">{STATS.projects}</span> projects
            from{" "}
            <span className="font-medium text-foreground">{STATS.universities}</span>{" "}
            universities — built by students, bought by builders who need a head start.
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative overflow-hidden">
        <MeshGradient animated className="opacity-90" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              From presentation to payout
            </h2>
            <p className="mt-3 text-muted">
              Three steps. No monthly fee. You keep building; we handle discovery and delivery.
            </p>
          </div>

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="rounded-[28px] bg-gradient-to-br from-primary/45 via-border to-accent/35 p-px shadow-xl"
              >
                <div className="glass h-full rounded-[27px] p-7">
                  <span className="font-mono text-xs tracking-widest text-primary">{step.n}</span>
                  <h3 className="font-display mt-4 text-xl font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{step.copy}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <BentoGrid />

      {/* ── Spotlight project (gradient glass) ── */}
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid items-stretch gap-6 lg:grid-cols-12">
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="relative min-h-[360px] overflow-hidden rounded-3xl lg:col-span-7"
            >
              <Image
                src={spotlight.coverImage}
                alt={spotlight.title}
                fill
                className="object-cover"
                sizes="(max-width:1024px) 100vw, 58vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <p className="text-xs uppercase tracking-[0.2em] text-white/70">
                  Spotlight
                </p>
                <h3 className="font-display mt-2 max-w-lg text-2xl font-semibold text-white sm:text-3xl">
                  {spotlight.title}
                </h3>
                <p className="mt-2 max-w-md text-sm text-white/75">
                  {spotlight.seller.name} · {spotlight.seller.university}
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="glass-gradient flex flex-col justify-between rounded-3xl p-7 sm:p-8 lg:col-span-5"
            >
              <div>
                <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Ready-made work, not slideware
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
                  {spotlight.shortDescription} Buyers get source, docs, and a clear license —
                  so your thesis project keeps earning after the grade is posted.
                </p>
                <ul className="mt-6 space-y-2 text-sm text-muted">
                  {spotlight.technologyStack.slice(0, 4).map((t) => (
                    <li key={t} className="flex items-center gap-2">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <Link href={`/projects/${spotlight.slug}`} className="mt-8 inline-flex">
                <Button className="w-full sm:w-auto">
                  View project
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Categories as editorial list ── */}
      <section className="border-y border-border bg-foreground/[0.02]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-md">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground">
                Shop by craft
              </h2>
              <p className="mt-3 text-muted">
                Web, mobile, AI, security, IoT — find a stack that already matches your brief.
              </p>
            </div>
            <Link href="/marketplace" className="text-sm font-medium text-primary hover:underline">
              Open full marketplace →
            </Link>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={`/marketplace?category=${cat.value}`}
                className="glass group flex items-center justify-between rounded-2xl px-5 py-4 transition hover:border-primary/35"
              >
                <span className="text-sm font-medium text-foreground">{cat.label}</span>
                <ArrowUpRight className="h-4 w-4 text-muted transition group-hover:text-primary" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured listings ── */}
      <section className="gradient-mesh">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Fresh on the shelf
              </h2>
              <p className="mt-2 text-muted">Recent student-built products worth opening.</p>
            </div>
            <Link href="/marketplace">
              <Button variant="outline">Browse all</Button>
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((project, i) => (
              <ProjectCard key={project.id} project={project} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing CTA ── */}
      <section className="px-4 pb-20 pt-4 sm:px-6 sm:pb-28">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem]">
          <div className="absolute inset-0 animate-gradient-x bg-gradient-to-br from-primary via-sky-500 to-accent bg-[length:200%_200%] opacity-95 will-change-[background-position]" />
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-cyan-300/30 blur-3xl" />

          <div className="glass relative rounded-[2rem] border-white/20 bg-white/10 p-10 text-center sm:p-14">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Your next project can pay for next semester
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
              List after you present. Keep ownership. Get paid when someone downloads your work.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/sell">
                <Button
                  size="lg"
                  className="bg-white text-slate-900 hover:bg-white/90 hover:text-slate-900"
                >
                  Start selling
                </Button>
              </Link>
              <Link href="/marketplace">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/40 text-white hover:bg-white/10 hover:text-white"
                >
                  Explore projects
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

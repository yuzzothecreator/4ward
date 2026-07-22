"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { demoProjects } from "@/lib/demo-data";
import { formatPrice } from "@/lib/utils";
import { easeOutExpo } from "@/lib/motion";

/** Linear-style product surface: marketplace list inside a quiet app chrome */
export function HeroProductMock() {
  const reduce = useReducedMotion() ?? false;
  const rows = demoProjects.slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.8, delay: reduce ? 0 : 0.15, ease: easeOutExpo }}
      className="relative mx-auto w-full max-w-5xl"
      aria-hidden
    >
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_40px_80px_-20px_rgba(0,0,0,0.55)]">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-foreground/15" />
          <div className="ml-3 flex flex-1 items-center gap-4 text-xs text-muted">
            <span className="text-foreground">Marketplace</span>
            <span>Sell</span>
            <span>Dashboard</span>
          </div>
        </div>

        <div className="grid md:grid-cols-[200px_1fr]">
          {/* Sidebar */}
          <aside className="hidden border-r border-border p-4 md:block">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Browse
            </p>
            <ul className="space-y-1 text-xs text-muted">
              {["All projects", "Web Apps", "AI", "Mobile", "Security"].map((item, i) => (
                <li
                  key={item}
                  className={`rounded-md px-2 py-1.5 ${i === 0 ? "bg-foreground/5 text-foreground" : ""}`}
                >
                  {item}
                </li>
              ))}
            </ul>
          </aside>

          {/* Issue-list style rows */}
          <div className="min-w-0">
            <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
              <p className="text-xs text-muted">Published · {rows.length} shown</p>
              <Badge variant="secondary" className="text-[10px]">
                Live
              </Badge>
            </div>
            <ul>
              {rows.map((p, i) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: reduce ? 0 : 0.35 + i * 0.07, duration: 0.4, ease: easeOutExpo }}
                  className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0"
                >
                  <span className="font-mono text-[10px] text-muted-foreground">
                    4W-{1000 + i}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">{p.title}</p>
                    <p className="truncate text-[11px] text-muted">
                      {p.seller.name} · {p.technologyStack.slice(0, 2).join(", ")}
                    </p>
                  </div>
                  <Badge variant="outline" className="hidden shrink-0 sm:inline-flex">
                    {p.category.split("_")[0]}
                  </Badge>
                  <span className="shrink-0 text-xs font-medium text-foreground">
                    {formatPrice(p.price)}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Soft depth fade under mock */}
      <div className="pointer-events-none absolute -inset-x-8 -bottom-16 h-24 bg-gradient-to-b from-transparent to-background" />
    </motion.div>
  );
}

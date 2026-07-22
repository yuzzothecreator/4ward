"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check, FileUp, MessageSquare, Wallet } from "lucide-react";
import { easeOutExpo } from "@/lib/motion";

/** Mini product surfaces for Linear-style feature rails */
export function SellRailMock() {
  const reduce = useReducedMotion() ?? false;
  const steps = [
    { icon: FileUp, label: "Upload ZIP + docs", state: "Done" },
    { icon: MessageSquare, label: "Review queue", state: "In review" },
    { icon: Check, label: "Published to shelf", state: "Live" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduce ? 0 : 0.55, ease: easeOutExpo }}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_24px_48px_-24px_rgba(0,0,0,0.45)]"
      aria-hidden
    >
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs text-muted">New listing</p>
        <p className="mt-0.5 text-sm font-medium text-foreground">Campus Attendance API</p>
      </div>
      <ul className="divide-y divide-border">
        {steps.map((s, i) => (
          <motion.li
            key={s.label}
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: reduce ? 0 : 0.1 + i * 0.08, duration: 0.35, ease: easeOutExpo }}
            className="flex items-center gap-3 px-4 py-3"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/[0.04] text-muted">
              <s.icon className="h-3.5 w-3.5" />
            </span>
            <span className="flex-1 text-[13px] text-foreground">{s.label}</span>
            <span className="text-[11px] text-muted">{s.state}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

export function DiscoverRailMock() {
  const reduce = useReducedMotion() ?? false;
  const rows = [
    { id: "4W-1042", title: "Smart Library Kiosk", meta: "Flutter · ML" },
    { id: "4W-1041", title: "Exam Seat Allocator", meta: "Next.js · Postgres" },
    { id: "4W-1038", title: "Hostel Fee Tracker", meta: "React · Stripe" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduce ? 0 : 0.55, ease: easeOutExpo }}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_24px_48px_-24px_rgba(0,0,0,0.45)]"
      aria-hidden
    >
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-xs text-muted">Filters · Web · AI · Mobile</p>
        <span className="rounded-md bg-foreground/[0.05] px-2 py-0.5 text-[10px] text-muted">
          128 results
        </span>
      </div>
      <ul>
        {rows.map((r, i) => (
          <motion.li
            key={r.id}
            initial={{ opacity: 0, x: -6 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: reduce ? 0 : 0.1 + i * 0.08, duration: 0.35, ease: easeOutExpo }}
            className={`flex items-center gap-3 border-b border-border px-4 py-3 last:border-0 ${
              i === 0 ? "bg-foreground/[0.03]" : ""
            }`}
          >
            <span className="font-mono text-[10px] text-muted-foreground">{r.id}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] text-foreground">{r.title}</p>
              <p className="text-[11px] text-muted">{r.meta}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

export function EarnRailMock() {
  const reduce = useReducedMotion() ?? false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduce ? 0 : 0.55, ease: easeOutExpo }}
      className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_24px_48px_-24px_rgba(0,0,0,0.45)]"
      aria-hidden
    >
      <div className="border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-3.5 w-3.5 text-muted" />
          <p className="text-xs text-muted">Payouts</p>
        </div>
        <p className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground">
          TZS 3,210,000
        </p>
        <p className="mt-1 text-[11px] text-muted">Available · Payouts connected</p>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border">
        {[
          { label: "Sales", value: "47" },
          { label: "Views", value: "2.1k" },
          { label: "Conv.", value: "4.2%" },
        ].map((s) => (
          <div key={s.label} className="px-3 py-4 text-center">
            <p className="text-sm font-medium text-foreground">{s.value}</p>
            <p className="mt-0.5 text-[10px] text-muted">{s.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

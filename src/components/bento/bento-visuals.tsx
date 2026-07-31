"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { Check, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { easeOutExpo } from "@/lib/motion";

function useInViewAnim(reduce: boolean) {
  return !reduce;
}

/** Card 1 — AI workflow nodes */
export function AiWorkflowVisual() {
  const reduce = useReducedMotion() ?? false;
  const animate = useInViewAnim(reduce);

  const nodes = [
    { id: "upload", label: "Upload", x: 12, y: 28 },
    { id: "ai", label: "AI", x: 50, y: 18 },
    { id: "review", label: "Review", x: 50, y: 62 },
    { id: "publish", label: "Live", x: 88, y: 40 },
  ];

  return (
    <div className="relative h-full min-h-[148px] w-full p-3" aria-hidden>
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <motion.path
          d="M18 32 C34 20, 40 22, 50 22"
          fill="none"
          stroke="currentColor"
          className="text-primary/40"
          strokeWidth="0.6"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={animate ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }}
          transition={{ duration: reduce ? 0 : 1.2, ease: easeOutExpo }}
        />
        <motion.path
          d="M50 28 C50 40, 50 48, 50 56"
          fill="none"
          stroke="currentColor"
          className="text-accent/40"
          strokeWidth="0.6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduce ? 0 : 1, delay: reduce ? 0 : 0.3, ease: easeOutExpo }}
        />
        <motion.path
          d="M56 24 C70 24, 76 36, 84 40"
          fill="none"
          stroke="currentColor"
          className="text-primary/35"
          strokeWidth="0.6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduce ? 0 : 1.1, delay: reduce ? 0 : 0.45, ease: easeOutExpo }}
        />
        <motion.path
          d="M56 66 C70 60, 76 48, 84 44"
          fill="none"
          stroke="currentColor"
          className="text-accent/30"
          strokeWidth="0.6"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduce ? 0 : 1.1, delay: reduce ? 0 : 0.55, ease: easeOutExpo }}
        />
      </svg>

      {nodes.map((n, i) => (
        <motion.div
          key={n.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${n.x}%`, top: `${n.y}%` }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={
            reduce
              ? { opacity: 1, scale: 1 }
              : {
                  opacity: 1,
                  scale: 1,
                  y: [0, i % 2 === 0 ? -4 : 4, 0],
                }
          }
          transition={
            reduce
              ? { duration: 0 }
              : {
                  opacity: { delay: i * 0.12, duration: 0.4 },
                  scale: { delay: i * 0.12, duration: 0.4 },
                  y: { duration: 3.2 + i * 0.3, repeat: Infinity, ease: "easeInOut" },
                }
          }
        >
          <div
            className={cn(
              "rounded-full border border-primary/30 bg-card/90 px-2.5 py-1 text-[10px] font-medium text-foreground shadow-lg backdrop-blur-md",
              n.id === "ai" && "border-accent/40 shadow-[0_0_16px_rgba(6,182,212,0.35)]"
            )}
          >
            {n.label}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/** Card 2 — Analytics chart + count-up */
export function AnalyticsVisual() {
  const reduce = useReducedMotion() ?? false;
  const [revenue, setRevenue] = useState(reduce ? 18420 : 0);
  const [views, setViews] = useState(reduce ? 12400 : 0);

  useEffect(() => {
    if (reduce) return;
    const start = performance.now();
    const duration = 1600;
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setRevenue(Math.round(18420 * eased));
      setViews(Math.round(12400 * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduce]);

  const points = "0,56 20,48 40,52 60,28 80,34 100,12";

  return (
    <div className="flex h-full min-h-[148px] flex-col p-4" aria-hidden>
      <div className="mb-2 flex gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Revenue</p>
          <p className="font-mono text-lg font-semibold text-foreground">
            ${revenue.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Views</p>
          <p className="font-mono text-lg font-semibold text-primary">
            {views.toLocaleString()}
          </p>
        </div>
      </div>
      <svg className="mt-auto h-16 w-full" viewBox="0 0 100 60" preserveAspectRatio="none">
        <defs>
          <linearGradient id="bentoChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.polygon
          points={`0,60 ${points} 100,60`}
          fill="url(#bentoChartFill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduce ? 0 : 0.8 }}
        />
        <motion.polyline
          points={points}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: reduce ? 0 : 1.4, ease: easeOutExpo }}
        />
      </svg>
    </div>
  );
}

/** Card 3 — Collaboration avatars + messages */
export function CollaborationVisual() {
  const reduce = useReducedMotion() ?? false;
  const messages = [
    { who: "Sarah", text: "Is Socket.io included?" },
    { who: "You", text: "Yes — fully wired." },
    { who: "Sarah", text: "Purchasing now ✨" },
  ];

  const avatars = [
    "https://api.dicebear.com/7.x/avataaars/png?seed=Sarah",
    "https://api.dicebear.com/7.x/avataaars/png?seed=Mike",
    "https://api.dicebear.com/7.x/avataaars/png?seed=Amina",
  ];

  return (
    <div className="relative flex h-full min-h-[148px] flex-col gap-2 overflow-hidden p-3" aria-hidden>
      <div className="absolute right-3 top-3 flex -space-x-2">
        {avatars.map((src, i) => (
          <motion.div
            key={src}
            initial={{ opacity: 0, y: 8 }}
            animate={
              reduce
                ? { opacity: 1, y: 0 }
                : { opacity: 1, y: [0, -5, 0] }
            }
            transition={
              reduce
                ? { duration: 0 }
                : {
                    opacity: { delay: i * 0.15, duration: 0.4 },
                    y: { delay: i * 0.2, duration: 2.8 + i * 0.4, repeat: Infinity, ease: "easeInOut" },
                  }
            }
          >
            <Avatar className="h-8 w-8 ring-2 ring-card">
              <AvatarImage src={src} alt="" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-1.5">
        {messages.map((m, i) => (
          <motion.div
            key={`${m.who}-${i}`}
            initial={{ opacity: 0, x: m.who === "You" ? 12 : -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: reduce ? 0 : 0.4 + i * 0.45,
              duration: reduce ? 0 : 0.4,
              ease: easeOutExpo,
            }}
            className={cn(
              "max-w-[85%] rounded-2xl px-2.5 py-1.5 text-[11px] leading-snug",
              m.who === "You"
                ? "ml-auto bg-primary text-primary-foreground"
                : "bg-foreground/5 text-foreground"
            )}
          >
            {m.text}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/** Card 4 — Security shield pulse */
export function SecurityVisual() {
  const reduce = useReducedMotion() ?? false;

  return (
    <div className="relative flex h-full min-h-[148px] items-center justify-center" aria-hidden>
      {!reduce && (
        <>
          <motion.div
            className="absolute h-24 w-24 rounded-full bg-success/20"
            animate={{ scale: [1, 1.35, 1], opacity: [0.45, 0.1, 0.45] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute h-16 w-16 rounded-full bg-success/25"
            animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.15, 0.5] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          />
        </>
      )}
      <motion.div
        className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 text-success ring-1 ring-success/30 shadow-[0_0_28px_rgba(16,185,129,0.35)]"
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: reduce ? 0 : 0.5, ease: easeOutExpo }}
      >
        <Shield className="h-7 w-7" strokeWidth={1.75} />
        <motion.span
          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-success text-white shadow-md"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: reduce ? 0 : 0.35, type: "spring", stiffness: 260, damping: 16 }}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </motion.span>
      </motion.div>
    </div>
  );
}

/** Card 5 — Floating marketplace cards */
export function MarketplaceVisual() {
  const reduce = useReducedMotion() ?? false;
  const cards = [
    { title: "DarLink", price: "TZS 125k", color: "from-blue-500/40 to-cyan-500/20" },
    { title: "StudyBuddy AI", price: "TZS 95k", color: "from-violet-500/30 to-blue-500/20" },
    { title: "SecureVault", price: "TZS 195k", color: "from-emerald-500/30 to-teal-500/20" },
    { title: "AgriSense", price: "TZS 150k", color: "from-amber-500/30 to-orange-500/20" },
  ];

  return (
    <div className="relative flex h-full min-h-[148px] items-center overflow-hidden" aria-hidden>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-card to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-card to-transparent" />

      <motion.div
        className="flex gap-3 px-4"
        animate={reduce ? undefined : { x: [0, -160] }}
        transition={
          reduce
            ? undefined
            : { duration: 12, repeat: Infinity, ease: "linear", repeatType: "loop" }
        }
      >
        {[...cards, ...cards].map((c, i) => (
          <div
            key={`${c.title}-${i}`}
            className={cn(
              "w-36 shrink-0 overflow-hidden rounded-2xl border border-border bg-card/80 shadow-md",
              "backdrop-blur-sm"
            )}
          >
            <div className={cn("h-12 bg-gradient-to-br", c.color)} />
            <div className="flex items-center justify-between px-2.5 py-2">
              <span className="truncate text-[11px] font-medium text-foreground">{c.title}</span>
              <span className="text-[10px] text-primary">{c.price}</span>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/** Card 6 — Notification popup */
export function NotificationsVisual() {
  const reduce = useReducedMotion() ?? false;
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => {
      setShow(false);
      setTimeout(() => setShow(true), 400);
    }, 4200);
    return () => clearInterval(id);
  }, [reduce]);

  return (
    <div className="relative flex h-full min-h-[148px] items-center justify-center p-4" aria-hidden>
      <div className="absolute inset-4 rounded-xl bg-foreground/[0.02] ring-1 ring-border" />
      <AnimatePresence mode="wait">
        {show && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: reduce ? 0 : 0.45, ease: easeOutExpo }}
            className="relative z-[1] w-full max-w-[220px] rounded-2xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-xl"
          >
            <div className="flex gap-2.5">
              <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary shadow-[0_0_8px_var(--primary)]" />
              <div>
                <p className="text-xs font-semibold text-foreground">New sale</p>
                <p className="mt-0.5 text-[11px] leading-snug text-muted">
                  DarLink purchased — +TZS 125,000
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

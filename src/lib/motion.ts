import type { Transition, Variants } from "framer-motion";

/** Shared easing — Linear-like soft deceleration */
export const easeOutExpo: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

export const fadeScale: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.06,
    },
  },
};

export const cardTransition = (reduceMotion: boolean): Transition =>
  reduceMotion
    ? { duration: 0 }
    : { duration: 0.55, ease: easeOutExpo };

export const hoverLift = (reduceMotion: boolean) =>
  reduceMotion
    ? {}
    : {
        y: -4,
        transition: { duration: 0.25, ease: easeOutExpo },
      };

export const viewportOnce = {
  once: true,
  margin: "-60px" as const,
  amount: 0.25 as const,
};

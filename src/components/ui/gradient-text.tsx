import { cn } from "@/lib/utils";

type GradientTextProps = {
  children: React.ReactNode;
  className?: string;
  animated?: boolean;
};

/** Gradient / animated gradient text — brand blue → cyan */
export function GradientText({ children, className, animated = false }: GradientTextProps) {
  return (
    <span
      className={cn(
        "bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent",
        animated && "animate-gradient-text bg-[length:200%_auto] will-change-[background-position]",
        className
      )}
    >
      {children}
    </span>
  );
}

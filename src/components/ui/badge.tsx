import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/20 text-primary",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        success: "border-transparent bg-success/20 text-success",
        warning: "border-transparent bg-warning/20 text-warning",
        destructive: "border-transparent bg-destructive/20 text-destructive",
        outline: "border-border text-muted",
        neon: "border-accent/40 bg-accent/10 text-accent shadow-[0_0_10px_rgba(6,182,212,0.2)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 cursor-pointer whitespace-normal sm:whitespace-nowrap",
  {
    variants: {
      variant: {
        default:
          "bg-foreground text-background hover:bg-foreground/90",
        secondary:
          "bg-foreground/[0.04] text-foreground border border-border hover:bg-foreground/[0.08]",
        outline:
          "border border-border text-foreground hover:bg-foreground/[0.04]",
        ghost: "hover:bg-foreground/[0.06] text-muted hover:text-foreground",
        destructive: "bg-destructive text-primary-foreground hover:brightness-110",
        glow: "bg-primary text-primary-foreground shadow-[0_0_24px_var(--primary-glow)] hover:shadow-[0_0_36px_var(--primary-glow)]",
      },
      size: {
        default: "h-10 rounded-lg px-4 py-2",
        sm: "h-8 rounded-md px-3 text-[13px]",
        lg: "h-11 rounded-lg px-6 text-[15px]",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

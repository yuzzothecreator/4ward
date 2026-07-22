import { cn } from "@/lib/utils";

function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shrink-0 bg-white/10 h-[1px] w-full", className)} {...props} />;
}

export { Separator };

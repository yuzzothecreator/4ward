import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** Pass `false` to render without a link */
  href?: string | false;
  className?: string;
  /** Compact for navbar; larger for footer / auth */
  size?: "sm" | "md" | "lg";
  priority?: boolean;
  /** Hide the wordmark text (icon only) */
  iconOnly?: boolean;
};

const SIZES = {
  sm: { icon: 28, text: "text-[15px]" },
  md: { icon: 36, text: "text-lg" },
  lg: { icon: 48, text: "text-2xl" },
} as const;

/** Official 4ward mark + wordmark */
export function BrandLogo({
  href = "/",
  className,
  size = "sm",
  priority = false,
  iconOnly = false,
}: BrandLogoProps) {
  const dim = SIZES[size];
  const content = (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/logo-mark.png?v=3"
        alt=""
        width={dim.icon}
        height={dim.icon}
        priority={priority}
        unoptimized
        className="h-auto w-auto object-contain"
        style={{ width: dim.icon, height: dim.icon }}
      />
      {!iconOnly ? (
        <span className="inline-flex flex-col leading-none">
          <span
            className={cn(
              "font-semibold tracking-tight text-foreground",
              dim.text
            )}
          >
            <span className="text-primary">4</span>ward
          </span>
          {size !== "sm" ? (
            <span className="mt-0.5 text-[10px] font-normal tracking-wide text-muted-foreground sm:text-[11px]">
              Code. Projects.{" "}
              <span className="text-accent">Progress.</span>
            </span>
          ) : null}
        </span>
      ) : (
        <span className="sr-only">4ward</span>
      )}
    </span>
  );

  if (href === false) {
    return content;
  }

  return (
    <Link href={href} className="inline-flex shrink-0 items-center" aria-label="4ward home">
      {content}
    </Link>
  );
}

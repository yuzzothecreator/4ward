import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** Pass `false` to render without a link */
  href?: string | false;
  className?: string;
  /** Compact for navbar; larger for footer / auth */
  size?: "sm" | "md" | "lg";
  /** Hide the wordmark text (icon only) */
  iconOnly?: boolean;
};

const SIZES = {
  sm: {
    px: 32,
    mark: "h-7 w-7 sm:h-8 sm:w-8",
    gap: "gap-1.5 sm:gap-2",
    title: "text-sm sm:text-[15px]",
    tagline: "hidden" as const,
  },
  md: {
    px: 40,
    mark: "h-9 w-9 sm:h-10 sm:w-10",
    gap: "gap-2 sm:gap-2.5",
    title: "text-base sm:text-lg",
    tagline: "mt-0.5 text-[9px] sm:text-[10px]",
  },
  lg: {
    px: 56,
    mark: "h-11 w-11 sm:h-12 sm:w-12 md:h-14 md:w-14",
    gap: "gap-2.5 sm:gap-3",
    title: "text-xl sm:text-2xl",
    tagline: "mt-1 text-[10px] sm:text-xs",
  },
} as const;

/**
 * Solid brand mark using project primary blues at full opacity:
 * light #2563eb · dark #3b82f6
 */
function BrandMark({ className, px }: { className?: string; px: number }) {
  return (
    <span className={cn("relative inline-block shrink-0", className)}>
      <Image
        src="/logo-mark.png?v=5"
        alt=""
        width={px}
        height={px}
        className="h-full w-full object-contain dark:hidden"
        priority
        unoptimized
      />
      <Image
        src="/logo-mark-dark.png?v=5"
        alt=""
        width={px}
        height={px}
        className="hidden h-full w-full object-contain dark:block"
        priority
        unoptimized
      />
    </span>
  );
}

/** Official 4ward mark + wordmark */
export function BrandLogo({
  href = "/",
  className,
  size = "sm",
  iconOnly = false,
}: BrandLogoProps) {
  const dim = SIZES[size];
  const content = (
    <span
      className={cn(
        "inline-flex max-w-full items-center",
        dim.gap,
        className
      )}
    >
      <BrandMark className={dim.mark} px={dim.px} />
      {!iconOnly ? (
        <span className="inline-flex min-w-0 flex-col leading-none">
          <span
            className={cn(
              "font-semibold tracking-tight text-foreground",
              dim.title
            )}
          >
            <span className="text-primary">4</span>
            <span className="text-foreground">ward</span>
          </span>
          {dim.tagline !== "hidden" ? (
            <span
              className={cn(
                "font-normal tracking-wide text-muted-foreground",
                dim.tagline
              )}
            >
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
    <Link
      href={href}
      className="inline-flex max-w-full shrink-0 items-center"
      aria-label="4ward home"
    >
      {content}
    </Link>
  );
}

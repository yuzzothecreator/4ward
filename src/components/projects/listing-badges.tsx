import { Badge } from "@/components/ui/badge";
import { Briefcase, Code2, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LicenseMeta, ListingTypeMeta } from "@/lib/constants";
import {
  getLicenseMeta,
  getListingTypeMeta,
  isCommercialListing,
} from "@/lib/constants";

type License = "SOURCE_CODE" | "COMMERCIAL" | "EDUCATIONAL" | string;
type ListingType = "CAMPUS" | "MARKET" | string | undefined;

export function LicenseBadge({
  license,
  className,
  showIcon = true,
}: {
  license: License;
  className?: string;
  showIcon?: boolean;
}) {
  const meta: LicenseMeta = getLicenseMeta(license);
  const Icon =
    meta.value === "COMMERCIAL"
      ? Briefcase
      : meta.value === "EDUCATIONAL"
        ? GraduationCap
        : Code2;

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 border font-medium",
        meta.badgeClass,
        className
      )}
    >
      {showIcon ? <Icon className="h-3 w-3" /> : null}
      {meta.shortLabel}
    </Badge>
  );
}

export function ListingTypeBadge({
  listingType,
  license,
  className,
}: {
  listingType?: ListingType;
  /** Fallback when listingType missing: COMMERCIAL → Market */
  license?: License;
  className?: string;
}) {
  const resolved: "CAMPUS" | "MARKET" =
    listingType === "MARKET" || listingType === "CAMPUS"
      ? listingType
      : isCommercialListing({ listingType, license })
        ? "MARKET"
        : "CAMPUS";
  const meta: ListingTypeMeta = getListingTypeMeta(resolved);

  return (
    <Badge
      variant="outline"
      className={cn("gap-1 border font-semibold", meta.badgeClass, className)}
    >
      {resolved === "MARKET" ? (
        <Briefcase className="h-3 w-3" />
      ) : (
        <GraduationCap className="h-3 w-3" />
      )}
      {meta.label}
    </Badge>
  );
}

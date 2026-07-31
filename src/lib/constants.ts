export const CATEGORIES = [
  { value: "WEB_APPLICATIONS", label: "Web Applications", icon: "Globe" },
  { value: "MOBILE_APPLICATIONS", label: "Mobile Applications", icon: "Smartphone" },
  { value: "ARTIFICIAL_INTELLIGENCE", label: "Artificial Intelligence", icon: "Brain" },
  { value: "CYBERSECURITY", label: "Cybersecurity", icon: "Shield" },
  { value: "IOT", label: "IoT", icon: "Cpu" },
  { value: "BLOCKCHAIN", label: "Blockchain", icon: "Link" },
  { value: "DATA_SCIENCE", label: "Data Science", icon: "BarChart3" },
  { value: "DATABASE_SYSTEMS", label: "Database Systems", icon: "Database" },
  { value: "UI_UX_DESIGNS", label: "UI/UX Designs", icon: "Palette" },
] as const;

export const TECHNOLOGIES = [
  "React",
  "Next.js",
  "Node.js",
  "Python",
  "Flutter",
  "Laravel",
  "TypeScript",
  "Django",
  "Vue.js",
  "Angular",
  "Swift",
  "Kotlin",
  "TensorFlow",
  "PyTorch",
  "MongoDB",
  "PostgreSQL",
  "Firebase",
  "AWS",
  "Docker",
  "Tailwind CSS",
] as const;

export const LICENSE_TYPES = [
  {
    value: "SOURCE_CODE",
    label: "Source Code Access",
    shortLabel: "Source code",
    description:
      "Buyer gets the code for personal use and learning — not for selling as a product.",
    audience: "Campus · personal",
    badgeClass:
      "border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-300",
    cardClass: "border-sky-500/40 bg-sky-500/5",
  },
  {
    value: "COMMERCIAL",
    label: "Commercial License",
    shortLabel: "Commercial",
    description:
      "Buyer may use this in real products, business, or resale — priced for companies & pros.",
    audience: "Market · companies",
    badgeClass:
      "border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-300",
    cardClass: "border-amber-500/45 bg-amber-500/5",
  },
  {
    value: "EDUCATIONAL",
    label: "Educational License",
    shortLabel: "Educational",
    description:
      "For school, coursework, and presentations only — no commercial or company use.",
    audience: "Campus · academic",
    badgeClass:
      "border-cyan-500/40 bg-cyan-500/15 text-cyan-800 dark:text-cyan-300",
    cardClass: "border-cyan-500/40 bg-cyan-500/5",
  },
] as const;

export type LicenseMeta = (typeof LICENSE_TYPES)[number];

export const LISTING_TYPES = [
  {
    value: "CAMPUS",
    label: "Campus",
    description:
      "Student / academic project — presentation pricing and same-university exclusivity.",
    badgeClass:
      "border-cyan-500/40 bg-cyan-500/15 text-cyan-800 dark:text-cyan-300",
    defaultLicense: "EDUCATIONAL" as const,
    suggestedPrice: 75000,
  },
  {
    value: "MARKET",
    label: "Market",
    description:
      "Real commercial product or system — verified sellers only; open to any buyer, company-ready pricing.",
    badgeClass:
      "border-amber-500/50 bg-amber-500/15 text-amber-800 dark:text-amber-300",
    defaultLicense: "COMMERCIAL" as const,
    suggestedPrice: 1500000,
  },
] as const;

export type ListingTypeMeta = (typeof LISTING_TYPES)[number];

export function getLicenseMeta(license: string): LicenseMeta {
  return (
    LICENSE_TYPES.find((l) => l.value === license) || LICENSE_TYPES[0]
  );
}

export function getListingTypeMeta(type: string): ListingTypeMeta {
  return LISTING_TYPES.find((l) => l.value === type) || LISTING_TYPES[0];
}

/** Commercial / market listings look and behave differently from campus. */
export function isCommercialListing(input: {
  listingType?: string | null;
  license?: string | null;
}): boolean {
  if (input.listingType === "MARKET") return true;
  if (input.listingType === "CAMPUS") return false;
  return input.license === "COMMERCIAL";
}

export const PLATFORM_FEE_PERCENT = 15;
export const AFFILIATE_COMMISSION_PERCENT = 10;

export const STATS = {
  projects: "2,400+",
  creators: "850+",
  universities: "120+",
  sales: "TZS 2.9B+",
};

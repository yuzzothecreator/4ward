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
    description: "Full access to source code for personal use",
  },
  {
    value: "COMMERCIAL",
    label: "Commercial License",
    description: "Use in commercial products and resale rights",
  },
  {
    value: "EDUCATIONAL",
    label: "Educational License",
    description: "For learning and academic purposes only",
  },
] as const;

export const PLATFORM_FEE_PERCENT = 15;
export const AFFILIATE_COMMISSION_PERCENT = 10;

export const STATS = {
  projects: "2,400+",
  creators: "850+",
  universities: "120+",
  sales: "$1.2M+",
};

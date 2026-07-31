import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(120),
  description: z.string().min(50, "Description must be at least 50 characters"),
  shortDescription: z.string().max(200).optional(),
  category: z.enum([
    "WEB_APPLICATIONS",
    "MOBILE_APPLICATIONS",
    "ARTIFICIAL_INTELLIGENCE",
    "CYBERSECURITY",
    "IOT",
    "BLOCKCHAIN",
    "DATA_SCIENCE",
    "DATABASE_SYSTEMS",
    "UI_UX_DESIGNS",
  ]),
  price: z.coerce.number().min(0),
  pricingType: z.enum(["FREE", "PAID"]),
  license: z.enum(["SOURCE_CODE", "COMMERCIAL", "EDUCATIONAL"]),
  technologyStack: z.array(z.string()).min(1, "Select at least one technology"),
  demoUrl: z.string().url().optional().or(z.literal("")),
  githubRepo: z.string().url().optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  rating: z.coerce.number().min(1).max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters").max(1000),
  projectId: z.string().min(1),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(80),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-z0-9_-]+$/, "Only lowercase letters, numbers, _ and -"),
  bio: z.string().max(500).optional(),
  university: z.string().max(120).optional(),
  skills: z.array(z.string()).max(20),
  website: z.string().url().optional().or(z.literal("")),
  githubUrl: z.string().url().optional().or(z.literal("")),
});

export const messageSchema = z.object({
  receiverId: z.string(),
  projectId: z.string().optional(),
  content: z.string().min(1).max(2000),
});

export const reportSchema = z.object({
  projectId: z.string().optional(),
  reason: z.string().min(5),
  description: z.string().max(1000).optional(),
});

export const projectRequestSchema = z.object({
  title: z.string().min(8, "Title must be at least 8 characters").max(140),
  description: z
    .string()
    .min(40, "Describe what you need (at least 40 characters)")
    .max(4000),
  category: z.enum([
    "WEB_APPLICATIONS",
    "MOBILE_APPLICATIONS",
    "ARTIFICIAL_INTELLIGENCE",
    "CYBERSECURITY",
    "IOT",
    "BLOCKCHAIN",
    "DATA_SCIENCE",
    "DATABASE_SYSTEMS",
    "UI_UX_DESIGNS",
  ]),
  budgetMin: z.coerce.number().min(0).optional().nullable(),
  budgetMax: z.coerce.number().min(0).optional().nullable(),
  university: z.string().max(120).optional().nullable(),
  deadline: z.string().optional().nullable(),
});

export const projectOfferSchema = z.object({
  message: z.string().min(20, "Explain your offer (at least 20 characters)").max(2000),
  proposedPrice: z.coerce.number().min(0).optional().nullable(),
  deliveryDays: z.coerce.number().int().min(1).max(365).optional().nullable(),
  projectId: z.string().optional().nullable(),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;
export type ReviewFormValues = z.infer<typeof reviewSchema>;
export type ProfileFormValues = z.infer<typeof profileSchema>;
export type ProjectRequestFormValues = z.infer<typeof projectRequestSchema>;
export type ProjectOfferFormValues = z.infer<typeof projectOfferSchema>;

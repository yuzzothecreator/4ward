import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DemoProject } from "@/lib/demo-data";
import { demoProjects } from "@/lib/demo-data";
import { slugify } from "@/lib/utils";
import type { ProjectFormValues } from "@/lib/validations";
import {
  type AppRole,
  elevateRole,
  roleFromEmail,
} from "@/lib/rbac";

export type DemoUser = {
  name: string;
  email: string;
  username: string;
  university: string;
  role: AppRole;
  createdAt: string;
  /** Blue-tick from VERIFIED_CREATOR badge — kept in sync across UI */
  verified?: boolean;
  bio?: string;
  supportNote?: string;
  whatsapp?: string;
  website?: string;
  githubUrl?: string;
  skills?: string[];
};

export type PurchaseRecord = {
  id: string;
  projectId: string;
  slug: string;
  title: string;
  coverImage: string;
  price: number;
  sellerName: string;
  purchasedAt: string;
  downloadToken?: string;
};

type CartItem = {
  projectId: string;
  title: string;
  price: number;
  coverImage: string;
};

type AppState = {
  user: DemoUser | null;
  listings: DemoProject[];
  purchases: PurchaseRecord[];
  favorites: string[];
  cart: CartItem[];

  signUp: (data: {
    name: string;
    email: string;
    university?: string;
    intent?: "BUYER" | "SELLER";
  }) => DemoUser;
  signIn: (data: { email: string; name?: string }) => DemoUser;
  signOut: () => void;
  setRole: (role: AppRole) => void;
  setVerified: (verified: boolean) => void;
  promoteToSeller: () => void;
  /** Upsert marketplace projects from API (includes seller badges). */
  upsertListings: (projects: DemoProject[]) => void;

  addListing: (
    values: ProjectFormValues,
    opts?: {
      status?: DemoProject["status"];
      coverImage?: string;
      sourceFile?: string;
    }
  ) => DemoProject;
  getCatalog: () => DemoProject[];
  getProjectBySlug: (slug: string) => DemoProject | undefined;
  getMyListings: () => DemoProject[];

  addPurchase: (
    project: DemoProject,
    opts?: { downloadToken?: string; purchaseId?: string }
  ) => PurchaseRecord | null;
  hasPurchased: (projectId: string) => boolean;

  toggleFavorite: (projectId: string) => void;
  isFavorite: (projectId: string) => boolean;
  addToCart: (item: CartItem) => void;
  removeFromCart: (projectId: string) => void;
  clearCart: () => void;
};

function usernameFromEmail(email: string, name: string) {
  const base = email.split("@")[0] || name.toLowerCase().replace(/\s+/g, "");
  return base.replace(/[^a-z0-9_-]/gi, "").toLowerCase().slice(0, 24) || "creator";
}

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80";

function applyVerifiedBadge(
  badges: string[] | undefined,
  verified: boolean
): string[] {
  const next = new Set(badges || []);
  if (verified) next.add("VERIFIED_CREATOR");
  else next.delete("VERIFIED_CREATOR");
  return [...next];
}

function patchListingsForSeller(
  listings: DemoProject[],
  seller: { email: string; username: string },
  verified: boolean
): DemoProject[] {
  return listings.map((p) => {
    const match =
      p.seller.username === seller.username ||
      p.seller.id === seller.email ||
      p.seller.id === seller.username;
    if (!match) return p;
    return {
      ...p,
      seller: {
        ...p.seller,
        badges: applyVerifiedBadge(p.seller.badges, verified),
      },
    };
  });
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      listings: [],
      purchases: [],
      favorites: [],
      cart: [],

      signUp: ({ name, email, university, intent }) => {
        const normalized = email.trim().toLowerCase();
        const user: DemoUser = {
          name: name.trim(),
          email: normalized,
          username: usernameFromEmail(email, name),
          university: university?.trim() || "UDSM",
          role: roleFromEmail(normalized, intent === "SELLER" ? "SELLER" : "BUYER"),
          createdAt: new Date().toISOString(),
        };
        set({ user });
        return user;
      },

      signIn: ({ email, name }) => {
        const existing = get().user;
        const normalized = email.trim().toLowerCase();
        const user: DemoUser =
          existing?.email === normalized
            ? {
                ...existing,
                role: roleFromEmail(normalized, existing.role || "BUYER"),
              }
            : {
                name: name?.trim() || normalized.split("@")[0],
                email: normalized,
                username: usernameFromEmail(normalized, name || normalized),
                university: existing?.university || "UDSM",
                role: roleFromEmail(normalized, "BUYER"),
                createdAt: existing?.createdAt || new Date().toISOString(),
              };
        set({ user });
        return user;
      },

      signOut: () => {
        if (typeof window !== "undefined") {
          try {
            sessionStorage.removeItem("4ward_admin_token");
            sessionStorage.removeItem("4ward_admin_token_exp");
          } catch {
            /* ignore */
          }
        }
        set({ user: null });
      },

      setRole: (role) => {
        const user = get().user;
        if (!user) return;
        set({ user: { ...user, role } });
      },

      setVerified: (verified) => {
        const user = get().user;
        if (!user) return;
        set({
          user: { ...user, verified },
          listings: patchListingsForSeller(get().listings, user, verified),
        });
      },

      upsertListings: (projects) => {
        if (!projects.length) return;
        set((state) => {
          const byKey = new Map<string, DemoProject>();
          for (const p of state.listings) {
            byKey.set(p.id, p);
            byKey.set(`slug:${p.slug}`, p);
          }
          for (const p of projects) {
            byKey.set(p.id, p);
            byKey.set(`slug:${p.slug}`, p);
          }
          // Dedupe by id
          const seen = new Set<string>();
          const merged: DemoProject[] = [];
          for (const p of byKey.values()) {
            if (seen.has(p.id)) continue;
            seen.add(p.id);
            merged.push(p);
          }
          const user = state.user;
          return {
            listings: user?.verified
              ? patchListingsForSeller(merged, user, true)
              : merged,
          };
        });
      },

      promoteToSeller: () => {
        const user = get().user;
        if (!user) return;
        set({ user: { ...user, role: elevateRole(user.role, "SELLER") } });
      },

      addListing: (values, opts) => {
        const user = get().user;
        const wantsMarket =
          values.listingType === "MARKET" || values.license === "COMMERCIAL";
        if (wantsMarket && !user?.verified) {
          throw new Error(
            "Only verified sellers can list Market / commercial products."
          );
        }
        if (user) {
          set({ user: { ...user, role: elevateRole(user.role, "SELLER") } });
        }
        const status = opts?.status || "PUBLISHED";
        const pricingType =
          values.pricingType === "FREE" || values.price === 0 ? "FREE" : "PAID";
        const price = pricingType === "FREE" ? 0 : values.price;

        let slug = slugify(values.title);
        const catalog = get().getCatalog();
        if (catalog.some((p) => p.slug === slug)) {
          slug = `${slug}-${Date.now().toString(36)}`;
        }

        const project: DemoProject = {
          id: `user_${Date.now()}`,
          title: values.title,
          slug,
          description: values.description,
          shortDescription:
            values.shortDescription || values.description.slice(0, 140),
          category: values.category,
          price,
          pricingType,
          listingType: values.listingType || "CAMPUS",
          license: values.license,
          status,
          coverImage: opts?.coverImage || DEFAULT_COVER,
          images: [opts?.coverImage || DEFAULT_COVER],
          demoUrl: values.demoUrl || "",
          githubRepo: values.githubRepo || undefined,
          sourceFile: opts?.sourceFile,
          setupGuide: values.setupGuide,
          documentationUrl: values.documentationUrl || undefined,
          technologyStack: values.technologyStack,
          views: 0,
          downloads: 0,
          rating: 5,
          reviewCount: 0,
          seller: {
            id: user?.email || "local-seller",
            name: user?.name || "Student Creator",
            username: user?.username || "creator",
            avatar: `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(user?.email || "creator")}`,
            university: user?.university || "UDSM",
            badges: applyVerifiedBadge(
              ["RISING_DEVELOPER"],
              Boolean(user?.verified)
            ),
          },
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ listings: [project, ...state.listings] }));
        return project;
      },

      getCatalog: () => {
        const user = get().user;
        let listed = get().listings.filter(
          (p) => p.status === "PUBLISHED" || p.status === "APPROVED"
        );
        if (user?.verified) {
          listed = patchListingsForSeller(listed, user, true);
        }
        const ids = new Set(listed.map((p) => p.id));
        return [...listed, ...demoProjects.filter((p) => !ids.has(p.id))];
      },

      getProjectBySlug: (slug) => {
        return get().getCatalog().find((p) => p.slug === slug);
      },

      getMyListings: () => {
        const user = get().user;
        if (!user) return get().listings;
        return get().listings.filter(
          (p) => p.seller.username === user.username || p.seller.id === user.email
        );
      },

      addPurchase: (project, opts) => {
        if (get().purchases.some((p) => p.projectId === project.id)) {
          // Refresh token if a real fulfillment just completed
          if (opts?.downloadToken) {
            set((state) => ({
              purchases: state.purchases.map((p) =>
                p.projectId === project.id
                  ? {
                      ...p,
                      id: opts.purchaseId || p.id,
                      downloadToken: opts.downloadToken,
                    }
                  : p
              ),
            }));
          }
          return get().purchases.find((p) => p.projectId === project.id) || null;
        }
        const record: PurchaseRecord = {
          id: opts?.purchaseId || `pur_${Date.now()}`,
          projectId: project.id,
          slug: project.slug,
          title: project.title,
          coverImage: project.coverImage,
          price: project.price,
          sellerName: project.seller.name,
          purchasedAt: new Date().toISOString(),
          downloadToken: opts?.downloadToken,
        };
        set((state) => ({
          purchases: [record, ...state.purchases],
          cart: state.cart.filter((c) => c.projectId !== project.id),
        }));
        return record;
      },

      hasPurchased: (projectId) =>
        get().purchases.some((p) => p.projectId === projectId),

      toggleFavorite: (projectId) =>
        set((state) => ({
          favorites: state.favorites.includes(projectId)
            ? state.favorites.filter((id) => id !== projectId)
            : [...state.favorites, projectId],
        })),
      isFavorite: (projectId) => get().favorites.includes(projectId),
      addToCart: (item) =>
        set((state) => {
          if (state.cart.some((c) => c.projectId === item.projectId)) return state;
          return { cart: [...state.cart, item] };
        }),
      removeFromCart: (projectId) =>
        set((state) => ({
          cart: state.cart.filter((c) => c.projectId !== projectId),
        })),
      clearCart: () => set({ cart: [] }),
    }),
    {
      name: "4ward-store",
      merge: (persisted, current) => {
        const p = (persisted || {}) as Partial<AppState>;
        const user = p.user
          ? {
              ...p.user,
              role: roleFromEmail(p.user.email, p.user.role || "BUYER"),
            }
          : null;
        return { ...current, ...p, user };
      },
    }
  )
);

/** Filter any catalog (demo + user listings) */
export function filterCatalog(
  catalog: DemoProject[],
  filters: {
    category?: string;
    q?: string;
    tech?: string;
    university?: string;
    listingType?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
  }
) {
  return catalog.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
    if (filters.listingType && p.listingType !== filters.listingType) return false;
    if (filters.q) {
      const q = filters.q.toLowerCase();
      const hay = `${p.title} ${p.description} ${p.technologyStack.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (filters.tech && !p.technologyStack.includes(filters.tech)) return false;
    if (filters.university && p.seller.university !== filters.university) return false;
    if (filters.minPrice !== undefined && p.price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && p.price > filters.maxPrice) return false;
    if (filters.minRating !== undefined && p.rating < filters.minRating) return false;
    return true;
  });
}

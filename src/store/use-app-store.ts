import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DemoProject } from "@/lib/demo-data";
import { demoProjects } from "@/lib/demo-data";
import { slugify } from "@/lib/utils";
import type { ProjectFormValues } from "@/lib/validations";

export type DemoUser = {
  name: string;
  email: string;
  username: string;
  university: string;
  createdAt: string;
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

  signUp: (data: { name: string; email: string; university?: string }) => DemoUser;
  signIn: (data: { email: string; name?: string }) => DemoUser;
  signOut: () => void;

  addListing: (
    values: ProjectFormValues,
    opts?: { status?: DemoProject["status"]; coverImage?: string }
  ) => DemoProject;
  getCatalog: () => DemoProject[];
  getProjectBySlug: (slug: string) => DemoProject | undefined;
  getMyListings: () => DemoProject[];

  addPurchase: (project: DemoProject) => PurchaseRecord | null;
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

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      listings: [],
      purchases: [],
      favorites: [],
      cart: [],

      signUp: ({ name, email, university }) => {
        const user: DemoUser = {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          username: usernameFromEmail(email, name),
          university: university?.trim() || "University of Dar es Salaam",
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
            ? existing
            : {
                name: name?.trim() || normalized.split("@")[0],
                email: normalized,
                username: usernameFromEmail(normalized, name || normalized),
                university: existing?.university || "University of Dar es Salaam",
                createdAt: existing?.createdAt || new Date().toISOString(),
              };
        set({ user });
        return user;
      },

      signOut: () => set({ user: null }),

      addListing: (values, opts) => {
        const user = get().user;
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
          license: values.license,
          status,
          coverImage: opts?.coverImage || DEFAULT_COVER,
          images: [opts?.coverImage || DEFAULT_COVER],
          demoUrl: values.demoUrl || "",
          githubRepo: values.githubRepo || undefined,
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
            university: user?.university || "University of Dar es Salaam",
            badges: ["RISING_DEVELOPER"],
          },
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ listings: [project, ...state.listings] }));
        return project;
      },

      getCatalog: () => {
        const listed = get().listings.filter(
          (p) => p.status === "PUBLISHED" || p.status === "APPROVED"
        );
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

      addPurchase: (project) => {
        if (get().purchases.some((p) => p.projectId === project.id)) return null;
        const record: PurchaseRecord = {
          id: `pur_${Date.now()}`,
          projectId: project.id,
          slug: project.slug,
          title: project.title,
          coverImage: project.coverImage,
          price: project.price,
          sellerName: project.seller.name,
          purchasedAt: new Date().toISOString(),
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
    { name: "4ward-store" }
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
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
  }
) {
  return catalog.filter((p) => {
    if (filters.category && p.category !== filters.category) return false;
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

import { create } from "zustand";
import { persist } from "zustand/middleware";

type CartItem = {
  projectId: string;
  title: string;
  price: number;
  coverImage: string;
};

type AppState = {
  favorites: string[];
  cart: CartItem[];
  toggleFavorite: (projectId: string) => void;
  isFavorite: (projectId: string) => boolean;
  addToCart: (item: CartItem) => void;
  removeFromCart: (projectId: string) => void;
  clearCart: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      favorites: [],
      cart: [],
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

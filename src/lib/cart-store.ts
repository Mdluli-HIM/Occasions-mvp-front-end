import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Package, Provider } from "@/lib/api";

export type CartItem = {
  packageId: string;
  packageTitle: string;
  priceValue: number;
  providerId: string;
  providerName: string;
  providerSlug: string;
  photoUrl: string;
  guests: number;
  eventDate: string;
  startTime: string;
};

type CartState = {
  items: CartItem[];
  addItem: (pkg: Package, provider: Provider) => void;
  removeItem: (packageId: string) => void;
  updateItem: (packageId: string, updates: Partial<CartItem>) => void;
  clear: () => void;
  hasPackage: (packageId: string) => boolean;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (pkg, provider) => {
        if (get().items.some((i) => i.packageId === pkg.id)) return;
        set((state) => ({
          items: [
            ...state.items,
            {
              packageId: pkg.id,
              packageTitle: pkg.title,
              priceValue: pkg.priceValue,
              providerId: provider.id,
              providerName: provider.name,
              providerSlug: provider.slug,
              photoUrl: provider.media[0]?.url ?? "",
              guests: 1,
              eventDate: "",
              startTime: "",
            },
          ],
        }));
      },
      removeItem: (packageId) =>
        set((state) => ({
          items: state.items.filter((i) => i.packageId !== packageId),
        })),
      updateItem: (packageId, updates) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.packageId === packageId ? { ...i, ...updates } : i
          ),
        })),
      clear: () => set({ items: [] }),
      hasPackage: (packageId) => get().items.some((i) => i.packageId === packageId),
    }),
    { name: "occasions-cart" }
  )
);

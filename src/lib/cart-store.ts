import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Package, Provider } from "@/lib/api";
import { calculatePackageTotal, normalizePricingType, type PricingType } from "@/lib/pricing";

export type CartEventContext = { id: string; title: string; eventDate: string; startTime: string; guests: number; area: string };
export type CartItem = {
  itemId: string; packageId: string; packageTitle: string; priceValue: number; minPriceValue: number;
  pricingType: PricingType; unitLabel: string; quantity: number; minGuests: number | null; maxGuests: number | null;
  providerId: string; providerName: string; providerSlug: string; photoUrl: string; serviceSlug: string;
  eventId: string | null; eventTitle: string; guests: number; eventDate: string; startTime: string;
};
type CartUpdates = Partial<Pick<CartItem, "guests" | "eventDate" | "startTime" | "eventId" | "eventTitle" | "priceValue" | "minPriceValue" | "serviceSlug" | "pricingType" | "unitLabel" | "quantity" | "minGuests" | "maxGuests">>;
type CartState = {
  items: CartItem[];
  addItem: (pkg: Package, provider: Provider, event?: CartEventContext) => void;
  removeItem: (itemId: string) => void;
  updateItem: (itemId: string, updates: CartUpdates) => void;
  clear: () => void;
  hasPackage: (packageId: string, eventId?: string | null) => boolean;
};

export function cartItemId(packageId: string, eventId: string | null = null) {
  return `${encodeURIComponent(packageId)}:${eventId === null ? "standalone" : `event:${encodeURIComponent(eventId)}`}`;
}
export function cartItemTotal(item: Pick<CartItem, "priceValue" | "minPriceValue" | "guests"> & Partial<Pick<CartItem, "pricingType" | "quantity" | "unitLabel">>) {
  return calculatePackageTotal(item, item.guests, item.quantity ?? 1);
}

// Legacy carts remain standalone; the cart refreshes current prices before checkout.
export function migrateCartState(persisted: unknown): { items: CartItem[] } {
  const raw = persisted && typeof persisted === "object" && "items" in persisted ? persisted.items : [];
  if (!Array.isArray(raw)) return { items: [] };
  const items: CartItem[] = [];
  for (const value of raw) {
    if (!value || typeof value !== "object" || typeof value.packageId !== "string") continue;
    const eventId = typeof value.eventId === "string" && value.eventId ? value.eventId : null;
    const itemId = cartItemId(value.packageId, eventId);
    if (items.some((item) => item.itemId === itemId)) continue;
    const text = (key: string) => typeof value[key] === "string" ? value[key] : "";
    const amount = (key: string) => typeof value[key] === "number" && Number.isFinite(value[key]) && value[key] >= 0 ? value[key] : 0;
    items.push({
      itemId, eventId, packageId: value.packageId, packageTitle: text("packageTitle"),
      priceValue: amount("priceValue"), minPriceValue: amount("minPriceValue"),
      pricingType: normalizePricingType(value.pricingType), unitLabel: text("unitLabel"),
      quantity: Number.isInteger(value.quantity) && value.quantity >= 1 && value.quantity <= 10000 ? value.quantity : 1,
      minGuests: Number.isInteger(value.minGuests) && value.minGuests >= 1 && value.minGuests <= 10000 ? value.minGuests : null,
      maxGuests: Number.isInteger(value.maxGuests) && value.maxGuests >= 1 && value.maxGuests <= 10000 ? value.maxGuests : null,
      providerId: text("providerId"), providerName: text("providerName"), providerSlug: text("providerSlug"),
      photoUrl: text("photoUrl"), serviceSlug: text("serviceSlug"), eventTitle: eventId ? text("eventTitle") : "",
      guests: Number.isInteger(value.guests) && value.guests >= 1 && value.guests <= 10000 ? value.guests : 1,
      eventDate: text("eventDate"), startTime: text("startTime"),
    });
  }
  return { items };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (pkg, provider, event) => {
        const eventId = event?.id ?? null;
        if (get().hasPackage(pkg.id, eventId)) return;
        set((state) => ({ items: [...state.items, {
          itemId: cartItemId(pkg.id, eventId), packageId: pkg.id, packageTitle: pkg.title,
          priceValue: pkg.priceValue, minPriceValue: pkg.minPriceValue,
          pricingType: normalizePricingType(pkg.pricingType), unitLabel: pkg.unitLabel ?? "", quantity: 1,
          minGuests: pkg.minGuests ?? null, maxGuests: pkg.maxGuests ?? null,
          providerId: provider.id, providerName: provider.name, providerSlug: provider.slug,
          photoUrl: pkg.photoUrl || provider.media[0]?.url || "", serviceSlug: provider.serviceSlug,
          eventId, eventTitle: event?.title ?? "", guests: event?.guests ?? 1,
          eventDate: event?.eventDate ?? "", startTime: event?.startTime ?? "",
        }] }));
      },
      removeItem: (itemId) => set((state) => ({ items: state.items.filter((item) => item.itemId !== itemId) })),
      updateItem: (itemId, updates) => set((state) => {
        const current = state.items.find((item) => item.itemId === itemId);
        if (!current) return state;
        const updated = { ...current, ...updates };
        updated.itemId = cartItemId(updated.packageId, updated.eventId);
        if (state.items.some((item) => item.itemId === updated.itemId && item.itemId !== itemId)) return state;
        return { items: state.items.map((item) => item.itemId === itemId ? updated : item) };
      }),
      clear: () => set({ items: [] }),
      hasPackage: (packageId, eventId = null) => get().items.some((item) => item.packageId === packageId && item.eventId === eventId),
    }),
    { name: "occasions-cart", version: 2, migrate: migrateCartState }
  )
);

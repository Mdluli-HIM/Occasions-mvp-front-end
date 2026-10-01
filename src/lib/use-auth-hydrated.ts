"use client";

import { useSyncExternalStore } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { useCartStore } from "@/lib/cart-store";

function subscribeAuth(onChange: () => void) {
  const start = useAuthStore.persist.onHydrate(onChange);
  const finish = useAuthStore.persist.onFinishHydration(onChange);
  return () => { start(); finish(); };
}
function subscribeCart(onChange: () => void) {
  const start = useCartStore.persist.onHydrate(onChange);
  const finish = useCartStore.persist.onFinishHydration(onChange);
  return () => { start(); finish(); };
}
const authSnapshot = () => useAuthStore.persist.hasHydrated();
const cartSnapshot = () => useCartStore.persist.hasHydrated();
const serverSnapshot = () => false;

export function useAuthHydrated(): boolean {
  return useSyncExternalStore(subscribeAuth, authSnapshot, serverSnapshot);
}
export function useCartHydrated(): boolean {
  return useSyncExternalStore(subscribeCart, cartSnapshot, serverSnapshot);
}

"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { useModeStore } from "@/lib/mode-store";
import { useAuthHydrated } from "@/lib/use-auth-hydrated";

export function usePlannerAuth() {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setMode = useModeStore((state) => state.setMode);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    // Visiting a planner page expresses planning intent, including before login.
    setMode("planning");
    if (!token || !user) router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
  }, [hydrated, token, user, router, pathname, setMode]);

  return { token, ready: hydrated && !!token && !!user };
}

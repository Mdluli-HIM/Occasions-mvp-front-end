"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { useModeStore } from "@/lib/mode-store";

// Everything under /provider needs a logged-in user. Logged-out visitors go to
// /login and come back here afterwards. Visiting these URLs directly also puts
// the app into providing mode so the header matches.
export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const setMode = useModeStore((s) => s.setMode);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    if (!user) router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    else setMode("providing");
  }, [mounted, user, router, pathname, setMode]);

  if (!mounted || !user) return null;

  return <main className="max-w-7xl mx-auto w-full px-6 py-10">{children}</main>;
}

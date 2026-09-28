"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";
import { useModeStore } from "@/lib/mode-store";
import { clsx } from "clsx";

const PROVIDER_LINKS = [
  { href: "/provider/listings", label: "Listings" },
  { href: "/provider/bookings", label: "Bookings" },
];

export function SiteHeader() {
  const count = useCartStore((s) => s.items.length);
  const { user } = useAuthStore();
  const { mode, setMode } = useModeStore();
  const router = useRouter();
  const pathname = usePathname();

  const providing = !!user && mode === "providing";

  function switchMode() {
    if (providing) {
      setMode("planning");
      router.push("/");
    } else {
      setMode("providing");
      router.push("/provider/listings");
    }
  }

  return (
    <header className="border-b border-black/10 bg-white">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <Link href="/" className="text-2xl font-extrabold text-coral">
          Occasions
        </Link>

        {providing && (
          <nav className="flex items-center gap-6">
            {PROVIDER_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "text-sm font-medium pb-1 border-b-2 transition-colors",
                  pathname.startsWith(link.href)
                    ? "border-ink text-ink"
                    : "border-transparent text-black/60 hover:text-ink"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        <div className="flex items-center gap-5">
          {!providing && (
            <Link href="/cart" className="relative text-ink hover:text-coral transition-colors">
              <ShoppingBag size={22} />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-coral text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
          )}

          {user && (
            <button
              onClick={switchMode}
              className="text-sm font-medium text-ink hover:text-coral transition-colors"
            >
              {providing ? "Switch to planning" : "Switch to providing"}
            </button>
          )}

          {user ? (
            <Link
              href="/profile"
              className="flex items-center gap-2 text-sm font-medium text-ink hover:text-coral transition-colors"
            >
              <span className="h-7 w-7 rounded-full bg-coral-soft text-coral flex items-center justify-center text-xs font-semibold">
                {user.name.charAt(0).toUpperCase()}
              </span>
              {user.name.split(" ")[0]}
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium text-ink hover:text-coral transition-colors"
            >
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

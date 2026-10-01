"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";
import { useModeStore } from "@/lib/mode-store";
import { clsx } from "clsx";
import { useMessageUnread } from "@/components/messages/use-message-unread";

const PLANNING_LINKS = [
  { href: "/events/new", label: "Plan an event" },
  { href: "/events", label: "My events" },
  { href: "/messages", label: "Messages" },
];

const PROVIDER_LINKS = [
  { href: "/provider/listings", label: "Listings" },
  { href: "/provider/bookings", label: "Bookings" },
  { href: "/messages", label: "Messages" },
];

export function SiteHeader() {
  const count = useCartStore((s) => s.items.length);
  const { user } = useAuthStore();
  const { mode, setMode } = useModeStore();
  const router = useRouter();
  const pathname = usePathname();
  const { count: unreadMessages } = useMessageUnread();

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
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-3 gap-y-3 px-4 py-4 sm:flex-nowrap sm:gap-6 sm:px-6">
        <Link href="/" className="shrink-0 text-xl font-extrabold text-coral sm:text-2xl">
          Occasions
        </Link>

        <nav aria-label={providing ? "Provider navigation" : "Planning navigation"} className="order-last flex w-full items-center gap-6 border-t border-black/5 pt-3 sm:order-none sm:w-auto sm:border-0 sm:pt-0">
            {(providing ? PROVIDER_LINKS : PLANNING_LINKS).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={clsx(
                  "text-sm font-medium pb-1 border-b-2 transition-colors",
                  (link.href === "/events" ? pathname.startsWith("/events") && pathname !== "/events/new" : pathname.startsWith(link.href))
                    ? "border-ink text-ink"
                    : "border-transparent text-black/60 hover:text-ink"
                )}
              >
                {link.label}
                {link.href === "/messages" && unreadMessages > 0 && (
                  <span className="ml-1.5 inline-flex min-w-4 items-center justify-center rounded-full bg-coral px-1 text-[10px] leading-4 text-white" aria-label={`${unreadMessages} unread messages`}>
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </Link>
            ))}
        </nav>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-3 sm:flex-initial sm:gap-5">
          {!providing && (
            <Link href="/cart" aria-label="Your cart" className="relative shrink-0 text-ink hover:text-coral transition-colors">
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
              className="shrink-0 whitespace-nowrap text-xs font-medium text-ink transition-colors hover:text-coral sm:text-sm"
            >
              {providing ? "Switch to planning" : "Switch to providing"}
            </button>
          )}

          {user ? (
            <Link
              href="/profile"
              className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink transition-colors hover:text-coral"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-coral-soft text-xs font-semibold text-coral">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="max-w-16 truncate sm:max-w-32">{user.name.split(" ")[0]}</span>
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

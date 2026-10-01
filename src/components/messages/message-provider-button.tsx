"use client";

import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useAuthHydrated } from "@/lib/use-auth-hydrated";

export function MessageProviderButton({ slug, name }: { slug: string; name: string }) {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);
  const destination = `/messages?provider=${encodeURIComponent(slug)}`;
  const href = hydrated && token ? destination : `/login?redirect=${encodeURIComponent(destination)}`;

  return (
    <div className="mt-6 space-y-3">
      <Link
        href={href}
        aria-label={`Message ${name}`}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-black/5 px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral"
      >
        <MessageCircle aria-hidden="true" size={18} />
        Message provider
      </Link>
      <p className="text-xs leading-5 text-black/55">Ask about packages or your event before booking.</p>
    </div>
  );
}

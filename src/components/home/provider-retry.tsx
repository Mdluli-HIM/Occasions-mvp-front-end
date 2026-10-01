"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function ProvidersUnavailable() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <section className="rounded-2xl border border-black/10 bg-white px-6 py-10 text-center space-y-3" aria-labelledby="providers-unavailable-title">
      <h2 id="providers-unavailable-title" className="text-lg font-semibold text-ink">Providers temporarily unavailable</h2>
      <p className="text-sm text-ink/60">We couldn&apos;t load provider listings. Please try again shortly.</p>
      <button type="button" disabled={pending} aria-busy={pending} onClick={() => startTransition(() => router.refresh())} className="rounded-full bg-coral px-5 py-2.5 text-sm font-medium text-white hover:bg-coral-hover transition-colors disabled:opacity-60">
        {pending ? "Loading providers…" : "Try again"}
      </button>
    </section>
  );
}

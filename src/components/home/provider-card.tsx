"use client";

import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import type { Provider } from "@/lib/api";
import { getServiceLabel } from "@/lib/taxonomy";
import { addRecentlyViewed } from "@/lib/recently-viewed";
import { providerPriceLabel } from "@/lib/pricing";

export function ProviderCard({
  provider: p,
  className,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  priority = false,
  eventId,
}: {
  provider: Provider;
  className?: string;
  sizes?: string;
  priority?: boolean;
  eventId?: string;
}) {
  const serviceLabel = getServiceLabel(p.serviceSlug, p.category);
  const photo = p.media[0]?.url ?? "/next.svg";
  const priceLabels = providerPriceLabel(p.packages ?? []);

  return (
    <Link
      href={`/providers/${p.slug}${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ""}`}
      onClick={() => addRecentlyViewed(p.slug)}
      className={clsx("group block", className)}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100">
        <Image
          src={photo}
          alt={p.name}
          fill
          sizes={sizes}
          priority={priority}
          // Uploaded photos live on the API server; Next 16 won't optimise images
          // from a local address without extra config, so serve those as-is.
          unoptimized={photo.startsWith("http")}
          className="object-cover group-hover:scale-105 transition-transform"
        />
      </div>
      <div className="mt-2 space-y-0.5">
        <p className="font-medium text-sm text-ink">{p.name}</p>
        <p className="text-gray-500 text-sm">{serviceLabel}</p>
        {priceLabels.map((label) => (
          <p key={label} className="text-sm text-ink">{label}</p>
        ))}
      </div>
    </Link>
  );
}

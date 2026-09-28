import Image from "next/image";
import Link from "next/link";
import type { Provider } from "@/lib/api";
import { SERVICES } from "@/lib/taxonomy";

export function ProviderGrid({ providers }: { providers: Provider[] }) {
  if (providers.length === 0) {
    return (
      <p className="text-gray-500 py-12 text-center">
        No providers found for this area yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {providers.map((p) => {
        const serviceLabel =
          SERVICES.find((s) => s.slug === p.serviceSlug)?.label ?? p.category;
        const photo = p.media[0]?.url ?? "/next.svg";

        return (
          <Link
            key={p.id}
            href={`/providers/${p.slug}`}
            className="group block"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-100">
              <Image
                src={photo}
                alt={p.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="mt-2 space-y-0.5">
              <p className="font-medium text-sm">{p.name}</p>
              <p className="text-gray-500 text-sm">{serviceLabel}</p>
              {p.priceLabel && (
                <p className="text-sm">
                  From <span className="font-medium">{p.priceLabel}</span>
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

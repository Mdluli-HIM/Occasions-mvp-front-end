"use client";

import Image from "next/image";
import type { Package, Provider } from "@/lib/api";
import { useCartStore } from "@/lib/cart-store";
import { Check, Plus } from "lucide-react";

export function PackageList({
  provider,
  packages,
}: {
  provider: Provider;
  packages: Package[];
}) {
  const { addItem, removeItem, hasPackage } = useCartStore();

  if (packages.length === 0) {
    return <p className="text-ink/60">No packages listed yet.</p>;
  }

  return (
    <div className="space-y-3">
      {packages.map((pkg) => {
        const inCart = hasPackage(pkg.id);
        return (
          <div
            key={pkg.id}
            className="flex gap-4 rounded-2xl border border-black/10 bg-white p-4"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-black/5">
              <Image
                src={pkg.photoUrl || provider.media[0]?.url || "/next.svg"}
                alt={pkg.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-ink">{pkg.title}</h3>
              <p className="text-sm text-ink/60 line-clamp-2">{pkg.description}</p>
              <p className="text-sm text-ink mt-1">
                <span className="font-medium">
                  R {pkg.priceValue.toLocaleString("en-ZA")} ZAR
                </span>{" "}
                / guest
                {pkg.minPriceValue > 0 && (
                  <span className="text-ink/50">
                    {" "}
                    · Minimum R {pkg.minPriceValue.toLocaleString("en-ZA")} ZAR to book
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() =>
                inCart ? removeItem(pkg.id) : addItem(pkg, provider)
              }
              className={`self-center flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors duration-150 ${
                inCart
                  ? "bg-coral-soft text-coral"
                  : "bg-ink text-white hover:bg-black/80"
              }`}
            >
              {inCart ? (
                <>
                  <Check size={14} /> Added
                </>
              ) : (
                <>
                  <Plus size={14} /> Add
                </>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

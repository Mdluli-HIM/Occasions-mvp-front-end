import type { Provider } from "@/lib/api";
import { ProviderCard } from "@/components/home/provider-card";

export function ProviderGrid({ providers }: { providers: Provider[] }) {
  if (providers.length === 0) {
    return (
      <p className="text-gray-500 py-12 text-center">
        No providers found for this search yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {providers.map((p, i) => (
        <ProviderCard key={p.id} provider={p} priority={i < 4} />
      ))}
    </div>
  );
}

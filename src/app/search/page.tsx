import { Suspense } from "react";
import { SearchBar } from "@/components/search/search-bar";
import { ProviderRow } from "@/components/home/provider-row";
import { fetchProviders, ProviderSearchError, type Provider } from "@/lib/api";
import { groupProvidersByService } from "@/lib/provider-sections";
import Link from "next/link";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    area?: string;
    services?: string;
    minPrice?: string;
    maxPrice?: string;
    pricingType?: string;
    unitLabel?: string;
    eventId?: string;
  }>;
}) {
  const params = await searchParams;
  let providers: Provider[] = [];
  let searchError = "";
  try { providers = await fetchProviders(params); }
  catch (error) { searchError = error instanceof ProviderSearchError ? error.message : "Couldn't load providers. Check your connection and try again."; }
  const sections = groupProvidersByService(providers);

  return (
    <main className="mx-auto w-full min-w-0 max-w-7xl px-6 py-10 space-y-8">
      <Suspense>
        <SearchBar showBudget />
      </Suspense>
      {params.eventId && (
        <p className="rounded-2xl bg-coral-soft px-4 py-3 text-sm text-ink">
          Choosing services for your event. <Link href={`/events/${encodeURIComponent(params.eventId)}`} className="font-medium text-coral">Back to event</Link>
        </p>
      )}
      {searchError ? <p role="alert" className="rounded-2xl bg-coral-soft px-4 py-3 text-sm text-ink">{searchError} Adjust your filters or reload this page.</p> : <p className="text-sm text-black/55">
        {providers.length} {providers.length === 1 ? "provider" : "providers"}
      </p>}
      {searchError ? null : sections.length === 0 ? (
        <p className="py-12 text-center text-gray-500">
          No providers match your search. Try a different area, category or budget.
        </p>
      ) : (
        <div className="space-y-10">
          {sections.map((section, i) => (
            <ProviderRow
              key={section.serviceSlug}
              title={section.label}
              providers={section.providers}
              eventId={params.eventId}
              priority={i === 0}
            />
          ))}
        </div>
      )}
    </main>
  );
}

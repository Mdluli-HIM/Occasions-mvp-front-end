import { Suspense } from "react";
import { SearchBar } from "@/components/search/search-bar";
import { ProviderRow } from "@/components/home/provider-row";
import { fetchLocationCoverage, fetchProviders, ProviderSearchError, type Provider } from "@/lib/api";
import { locationLabel, resolveArea, sameArea, type LocationCoverage } from "@/lib/locations";
import { groupProvidersByService } from "@/lib/provider-sections";
import Link from "next/link";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    area?: string;
    province?: string;
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
  let coverage: LocationCoverage | null = null;
  const [providerResult, locationResult] = await Promise.allSettled([fetchProviders(params), fetchLocationCoverage()]);
  if (providerResult.status === "fulfilled") providers = providerResult.value;
  else searchError = providerResult.reason instanceof ProviderSearchError ? providerResult.reason.message : "Couldn't load providers. Check your connection and try again.";
  if (locationResult.status === "fulfilled") coverage = locationResult.value;
  const location = resolveArea(params.area);
  const region = coverage?.provinces.find(item => item.id === (location?.provinceId ?? params.province));
  const waitingForLaunch = region && !region.isLaunched;
  const uncoveredTown = location && region?.isLaunched && !region.areas.some(item => sameArea(item.value, location.value));
  const emptyTitle = waitingForLaunch ? `${region.label} is coming soon` : uncoveredTown ? `We’re building coverage in ${location.town}` : "No providers match these filters";
  const emptyDescription = waitingForLaunch
    ? "We’re growing our provider network one region at a time. You can still plan your event, and explore the areas available today."
    : uncoveredTown ? "There are no live providers serving this town yet. Explore the available areas while we grow our provider network."
      : "Try a different service, location or budget to find a provider for your occasion.";
  const availableQuery = new URLSearchParams();
  if (params.eventId) availableQuery.set("eventId", params.eventId);
  const availableUrl = `/search${availableQuery.size ? `?${availableQuery}` : ""}`;
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
        {providers.length} {providers.length === 1 ? "provider" : "providers"}{location ? ` serving ${locationLabel(location.value)}` : region ? ` in ${region.label}` : " across available areas"}
      </p>}
      {searchError ? null : sections.length === 0 ? (
        <div className="mx-auto max-w-xl space-y-4 py-12 text-center">
          <h1 className="text-xl font-semibold text-ink">{emptyTitle}</h1>
          <p className="text-sm leading-6 text-ink/60">{emptyDescription}</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-medium">
            <Link href={availableUrl} className="underline underline-offset-4">Explore available services</Link>
            {(waitingForLaunch || uncoveredTown) && <Link href="/signup?role=provider" className="text-coral underline underline-offset-4">Join as a provider</Link>}
          </div>
        </div>
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

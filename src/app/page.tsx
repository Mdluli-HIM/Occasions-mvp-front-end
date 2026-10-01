import { Suspense } from "react";
import { SearchBar } from "@/components/search/search-bar";
import { ServiceTiles } from "@/components/home/service-tiles";
import { RecentlyViewedRow } from "@/components/home/recently-viewed-row";
import { ProviderRow } from "@/components/home/provider-row";
import { ProvidersUnavailable } from "@/components/home/provider-retry";
import { fetchHomeSections, HomeSectionsError, type HomeSection } from "@/lib/api";

export default async function HomePage() {
  let sections: HomeSection[] = [];
  let providersUnavailable = false;
  try {
    sections = await fetchHomeSections();
  } catch (error) {
    providersUnavailable = true;
    console.warn("Homepage providers unavailable", { status: error instanceof HomeSectionsError ? error.status : 0 });
  }

  return (
    <main className="mx-auto w-full min-w-0 max-w-7xl px-6 py-10 space-y-12">
      <h1 className="sr-only">Find services for your occasion</h1>
      <Suspense>
        <SearchBar showEventPlanner />
      </Suspense>

      <ServiceTiles />
      <RecentlyViewedRow />

      {providersUnavailable ? (
        <ProvidersUnavailable />
      ) : sections.length === 0 ? (
        <p className="text-gray-500 py-12 text-center">No providers have listed yet.</p>
      ) : (
        sections.map((section, i) => (
          <ProviderRow
            key={section.serviceSlug}
            title={section.label}
            titleHref={`/search?services=${section.serviceSlug}`}
            providers={section.providers}
            priority={i === 0}
          />
        ))
      )}
    </main>
  );
}

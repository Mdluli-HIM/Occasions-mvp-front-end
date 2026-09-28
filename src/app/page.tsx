import { Suspense } from "react";
import { SearchBar } from "@/components/search/search-bar";
import { ServiceTiles } from "@/components/home/service-tiles";
import { RecentlyViewedRow } from "@/components/home/recently-viewed-row";
import { ProviderRow } from "@/components/home/provider-row";
import { fetchHomeSections } from "@/lib/api";

export default async function HomePage() {
  const sections = await fetchHomeSections();

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
      <Suspense>
        <SearchBar />
      </Suspense>

      <ServiceTiles />
      <RecentlyViewedRow />

      {sections.length === 0 ? (
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

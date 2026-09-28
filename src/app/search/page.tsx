import { Suspense } from "react";
import { SearchBar } from "@/components/search/search-bar";
import { ProviderGrid } from "@/components/home/provider-grid";
import { fetchProviders } from "@/lib/api";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    area?: string;
    services?: string;
    minPrice?: string;
    maxPrice?: string;
  }>;
}) {
  const params = await searchParams;
  const providers = await fetchProviders(params);

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      <Suspense>
        <SearchBar />
      </Suspense>
      <p className="text-sm text-black/55">
        {providers.length} {providers.length === 1 ? "provider" : "providers"}
      </p>
      <ProviderGrid providers={providers} />
    </main>
  );
}

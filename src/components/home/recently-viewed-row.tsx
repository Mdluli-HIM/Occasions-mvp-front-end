"use client";

import { useEffect, useState } from "react";
import { fetchProvidersBySlugs, type Provider } from "@/lib/api";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import { ProviderRow } from "@/components/home/provider-row";

export function RecentlyViewedRow() {
  const [providers, setProviders] = useState<Provider[]>([]);

  useEffect(() => {
    fetchProvidersBySlugs(getRecentlyViewed())
      .then(setProviders)
      .catch(() => {});
  }, []);

  if (providers.length === 0) return null;
  return <ProviderRow title="Recently viewed" providers={providers} />;
}

"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LIMPOPO_AREAS, SERVICES } from "@/lib/taxonomy";
import { SelectDropdown } from "@/components/ui/select-dropdown";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { FiltersModal } from "@/components/search/filters-modal";
import { Search, SlidersHorizontal } from "lucide-react";

export function SearchBar() {
  const router = useRouter();
  const params = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const area = params.get("area") ?? "";
  const services = params.get("services")?.split(",").filter(Boolean) ?? [];
  const minPrice = params.get("minPrice") ?? "";
  const maxPrice = params.get("maxPrice") ?? "";

  function updateParams(updates: Record<string, string>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value);
      else next.delete(key);
    }
    router.push(`/search?${next.toString()}`);
  }

  const areaOptions = LIMPOPO_AREAS.map((a) => ({ value: a, label: a }));
  const serviceOptions = SERVICES.map((s) => ({ value: s.slug, label: s.label }));
  const activeFilterCount = (minPrice ? 1 : 0) + (maxPrice ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white px-2 py-2 shadow-sm w-fit mx-auto">
        <SelectDropdown
          placeholder="All Limpopo areas"
          options={areaOptions}
          value={area}
          onChange={(value) => updateParams({ area: value })}
        />

        <div className="h-6 w-px bg-black/10" />

        <MultiSelectDropdown
          label="Service"
          placeholder="All services"
          options={serviceOptions}
          selected={services}
          onChange={(values) => updateParams({ services: values.join(",") })}
        />

        <button
          onClick={() => router.push(`/search?${params.toString()}`)}
          className="rounded-full bg-coral p-3 text-white hover:bg-coral-hover transition-colors duration-150"
          aria-label="Search"
        >
          <Search size={16} />
        </button>
      </div>

      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => setFiltersOpen(true)}
          className="flex items-center gap-2 rounded-full border border-black/15 bg-white px-4 py-2 text-sm font-medium text-ink hover:border-ink transition-colors duration-150"
        >
          <SlidersHorizontal size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-ink text-white text-xs w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      <FiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        minPrice={minPrice}
        maxPrice={maxPrice}
        onApply={(min, max) => updateParams({ minPrice: min, maxPrice: max })}
      />
    </div>
  );
}

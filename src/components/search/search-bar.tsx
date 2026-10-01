"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LIMPOPO_AREAS, SERVICES } from "@/lib/taxonomy";
import { SelectDropdown } from "@/components/ui/select-dropdown";
import { MultiSelectDropdown } from "@/components/ui/multi-select-dropdown";
import { FiltersModal } from "@/components/search/filters-modal";
import { BudgetButton } from "@/components/search/budget-button";
import { PlanEventButton } from "@/components/events/plan-event-button";
import { Search, SlidersHorizontal } from "lucide-react";

export function SearchBar({ showEventPlanner = false, showBudget = false }: { showEventPlanner?: boolean; showBudget?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const area = params.get("area") ?? "";
  const services = params.get("services")?.split(",").filter(Boolean) ?? [];
  const minPrice = params.get("minPrice") ?? "";
  const maxPrice = params.get("maxPrice") ?? "";
  const pricingType = params.get("pricingType") ?? (minPrice || maxPrice ? "per_guest" : "");
  const unitLabel = params.get("unitLabel") ?? "";
  const applyPricing = (min: string, max: string, type: string, unit: string, selectedArea: string, selectedServices: string[]) => updateParams({ minPrice: min, maxPrice: max, pricingType: type, unitLabel: unit, area: selectedArea, services: selectedServices.join(",") });

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
  const activeFilterCount = (minPrice || maxPrice ? 1 : 0) + (pricingType ? 1 : 0) + (unitLabel ? 1 : 0);

  return (
    <div className="sticky top-0 z-30 space-y-3 bg-offwhite">
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

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          aria-haspopup="dialog"
          aria-expanded={filtersOpen}
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
        {showBudget && <BudgetButton minPrice={minPrice} maxPrice={maxPrice} pricingType={pricingType} unitLabel={unitLabel} area={area} services={services} onApply={applyPricing} />}
        {showEventPlanner && <PlanEventButton />}
      </div>

      <FiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        minPrice={minPrice}
        maxPrice={maxPrice}
        pricingType={pricingType}
        unitLabel={unitLabel}
        area={area}
        services={services}
        onApply={applyPricing}
      />
    </div>
  );
}

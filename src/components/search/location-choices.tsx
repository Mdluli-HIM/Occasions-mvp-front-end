"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, MapPin } from "lucide-react";
import { locationLabel, PROVINCES, resolveArea, sameArea, type LocationCoverage, type ProvinceId } from "@/lib/locations";

export function locationProviderCount(coverage: { providerCount: number; serviceCounts: Record<string, number> }, services: string[]) {
  return services.length ? [...new Set(services)].reduce((count, service) => count + (Object.hasOwn(coverage.serviceCounts, service) ? coverage.serviceCounts[service] : 0), 0) : coverage.providerCount;
}

export function LocationChoices({ coverage, loading, error, retry, province, area, services, onChange }: {
  coverage: LocationCoverage | null;
  loading: boolean;
  error: string;
  retry: () => void;
  province: string;
  area: string;
  services: string[];
  onChange: (province: string, area: string) => void;
}) {
  const selectedLocation = resolveArea(area);
  const [browsing, setBrowsing] = useState<ProvinceId | null>(selectedLocation?.provinceId ?? PROVINCES.find(item => item.id === province)?.id ?? null);
  const browsingProvince = browsing ?? coverage?.launchProvinceIds[0] ?? "limpopo";
  const region = coverage?.provinces.find(item => item.id === browsingProvince);
  const towns = region?.areas.filter(item => locationProviderCount(item, services) > 0) ?? [];
  const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral";

  if (loading) return <p role="status" className="py-5 text-sm text-ink/60">Loading available locations…</p>;
  if (error || !coverage) return <p role="status" className="py-5 text-sm leading-6 text-ink/60">{error || "Available locations couldn't be loaded."} <button type="button" onClick={retry} className={`font-medium text-ink underline ${focus}`}>Retry</button></p>;

  return <div className="space-y-5">
    <p className="text-xs leading-5 text-ink/60">Selected location: <span className="font-medium text-ink">{area ? locationLabel(area) : PROVINCES.find(item => item.id === province)?.label ?? "All available areas"}</span></p>
    <button type="button" aria-pressed={!province && !area} onClick={() => onChange("", "")} className={`occasions-dropdown-option flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium ${focus}`}>
      <span className="flex items-center gap-2"><MapPin size={16} aria-hidden="true" />All available areas</span>
      {!province && !area && <Check size={16} className="text-coral" aria-hidden="true" />}
    </button>
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink/55">Browse provinces · South Africa</p>
      {services.length > 0 && <p className="mb-3 text-xs leading-5 text-ink/55">Province counts include all services. Available towns below match your selected services.</p>}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {coverage.provinces.map(item => <button key={item.id} type="button" aria-pressed={browsingProvince === item.id} onClick={() => setBrowsing(item.id)} className={`rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${focus} ${browsingProvince === item.id ? "border-ink bg-offwhite" : "border-black/10 hover:border-ink"}`}>
          <span className="block font-medium">{item.label}</span>
          <span className="mt-1 block text-xs text-ink/55">{item.isLaunched ? item.providerCount > 0 ? `${item.providerCount} provider${item.providerCount === 1 ? "" : "s"}` : "Building coverage" : "Coming soon"}</span>
        </button>)}
      </div>
    </div>
    {region && <div className="border-t border-black/10 pt-4">
      <p className="mb-2 text-sm font-semibold">{region.label}</p>
      {!region.isLaunched ? <div className="space-y-2 text-sm leading-6 text-ink/60">
        <p>We’re starting in {coverage.provinces.filter(item => item.isLaunched).map(item => item.label).join(" and ") || "our first launch areas"}. {region.label} is coming soon as we grow our provider network.</p>
        <Link href="/signup?role=provider" className={`inline-block font-medium text-ink underline underline-offset-4 ${focus}`}>Offer services here? Join as a provider</Link>
      </div> : towns.length === 0 ? <div className="text-sm leading-6 text-ink/60">
        <p>{services.length ? "These services aren’t available here yet. Choose another service or explore the available areas." : "We’re recruiting providers here. Available towns will appear as listings go live."}</p>
        <Link href="/signup?role=provider" className={`mt-2 inline-block font-medium text-ink underline underline-offset-4 ${focus}`}>Join as a provider</Link>
      </div> : <div className="max-h-64 space-y-1 overflow-y-auto overflow-x-hidden pr-1">
        <button type="button" aria-pressed={province === region.id && !area} onClick={() => onChange(region.id, "")} className={`occasions-dropdown-option flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm ${focus}`}>
          <span>All available areas in {region.label}</span>
          {province === region.id && !area && <Check size={16} className="text-coral" aria-hidden="true" />}
        </button>
        {towns.map(town => <button key={town.value} type="button" aria-pressed={sameArea(area, town.value)} onClick={() => onChange(region.id, town.value)} className={`occasions-dropdown-option flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm ${focus}`}>
          <span>{town.town}</span>
          <span className="flex items-center gap-2 text-xs">{locationProviderCount(town, services)} {locationProviderCount(town, services) === 1 ? "provider" : "providers"}{sameArea(area, town.value) && <Check size={16} className="text-coral" aria-hidden="true" />}</span>
        </button>)}
      </div>}
    </div>}
  </div>;
}

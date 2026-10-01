"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Armchair, Camera, Check, Flower2, Music, Snowflake, Sparkles, Tent, Toilet, Utensils, X } from "lucide-react";
import { fetchProviders, type Provider } from "@/lib/api";
import { isValidPriceRange } from "@/lib/price-range";
import { countMatchingProviders, priceSamples, unitOptions } from "@/lib/search-price-data";
import { SERVICES } from "@/lib/taxonomy";
import type { LocationCoverage } from "@/lib/locations";
import { LocationChoices } from "@/components/search/location-choices";
import { PriceRangeSlider } from "@/components/search/price-range-slider";

export type PricingFilterProps = {
  minPrice: string;
  maxPrice: string;
  pricingType: string;
  unitLabel: string;
  province: string;
  area: string;
  services: string[];
  coverage: LocationCoverage | null;
  coverageLoading: boolean;
  coverageError: string;
  retryCoverage: () => void;
  onApply: (minimum: string, maximum: string, pricingType: string, unitLabel: string, area: string, services: string[], province: string) => void;
};

const pricingChoices = [
  { value: "", label: "Any type" },
  { value: "per_guest", label: "Per guest" },
  { value: "fixed", label: "Per package" },
  { value: "per_unit", label: "Per unit" },
];
const serviceIcons = [Utensils, Tent, Flower2, Music, Camera, Armchair, Toilet, Snowflake, Sparkles];
const focusClass = "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral";
const chipClass = `inline-flex min-h-12 items-center gap-2 rounded-full border px-4 py-3 text-sm transition-colors duration-150 ${focusClass}`;
const normalizeUnit = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

export function PricingFilterDialog({ title, onClose, clearAll = false, ...props }: PricingFilterProps & { title: string; onClose: () => void; clearAll?: boolean }) {
  const [minimum, setMinimum] = useState(props.minPrice);
  const [maximum, setMaximum] = useState(props.maxPrice);
  const [basis, setBasis] = useState(props.pricingType || (clearAll ? "" : "per_guest"));
  const [unit, setUnit] = useState(props.unitLabel);
  const [area, setArea] = useState(props.area);
  const [province, setProvince] = useState(props.province);
  const [services, setServices] = useState(props.services);
  const [otherUnit, setOtherUnit] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [catalog, setCatalog] = useState<{ key: string; providers: Provider[]; error: boolean } | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const initialFocusRef = useRef<HTMLInputElement>(null);
  const unitRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const queryKey = JSON.stringify([province, area, services]);
  const currentCatalog = catalog?.key === queryKey ? catalog : null;
  const providers = currentCatalog?.providers;
  const prices = useMemo(() => priceSamples(providers ?? [], basis, unit), [providers, basis, unit]);
  const units = useMemo(() => unitOptions(providers ?? []), [providers]);
  const matchingCount = providers && !currentCatalog?.error ? countMatchingProviders(providers, basis, unit, minimum, maximum) : null;
  const loading = !currentCatalog;
  const priceLabel = basis === "fixed" ? "per package" : basis === "per_unit" ? `per ${normalizeUnit(unit) || "unit"}` : "per guest";
  const canAdjust = !!basis && (basis !== "per_unit" || !!normalizeUnit(unit)) && !loading;
  const customUnit = otherUnit || (!!unit && !units.includes(normalizeUnit(unit)));

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    const bodyPadding = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth) document.body.style.paddingRight = `${bodyPadding + scrollbarWidth}px`;
    dialog.showModal();
    initialFocusRef.current?.focus({ preventScroll: true });
    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const [selectedProvince, selectedArea, selectedServices] = JSON.parse(queryKey) as [string, string, string[]];
    // Fetch the catalog without a budget so applying a range never narrows its track.
    fetchProviders({ province: selectedProvince, area: selectedArea, services: selectedServices.join(",") }, controller.signal)
      .then(result => { if (!controller.signal.aborted) setCatalog({ key: queryKey, providers: result, error: false }); })
      .catch(() => { if (!controller.signal.aborted) setCatalog({ key: queryKey, providers: [], error: true }); });
    return () => controller.abort();
  }, [queryKey, retry]);

  function resetRange() { setMinimum(""); setMaximum(""); setError(""); }
  function chooseBasis(value: string) {
    setBasis(value);
    setUnit("");
    setOtherUnit(false);
    resetRange();
  }
  function chooseUnit(value: string) { setUnit(value); setOtherUnit(false); resetRange(); }
  function clearDraft() {
    resetRange();
    if (clearAll) { setBasis(""); setUnit(""); setOtherUnit(false); setArea(""); setProvince(""); setServices([]); }
  }
  function apply() {
    const min = minimum.trim(); const max = maximum.trim();
    const label = basis === "per_unit" ? normalizeUnit(unit) : "";
    if (!isValidPriceRange(min, max)) return setError("Adjust the handles so the maximum is at least the minimum, or clear the budget.");
    if (basis && !pricingChoices.some(choice => choice.value === basis)) return setError("Choose a pricing type.");
    if ((min || max) && !basis) return setError("Choose a pricing type before applying a budget.");
    if (basis === "per_unit" && (((min || max) && !label) || (label && (!/^[a-z0-9][a-z0-9 -]*$/.test(label) || label.length > 30)))) {
      unitRef.current?.focus();
      return setError("Choose a unit to compare, such as table or chair (up to 30 characters).");
    }
    props.onApply(min ? String(Number(min)) : "", max ? String(Number(max)) : "", basis, label, area, services, province);
    onClose();
  }

  return (
    <dialog ref={dialogRef} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}
      onCancel={event => { event.preventDefault(); onClose(); }}
      onKeyDown={event => {
        if (event.key !== "Tab") return;
        const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), a[href]")).filter(control => control.tabIndex >= 0 && control.getClientRects().length > 0);
        const first = controls[0]; const last = controls.at(-1); const active = document.activeElement;
        if (first && last && (!event.currentTarget.contains(active) || (event.shiftKey ? active === first : active === last))) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
      }}
      onClick={event => { if (event.target !== event.currentTarget) return; const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose(); }}
      className="fixed inset-0 m-auto h-[min(820px,calc(100dvh_-_2rem))] max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_1.5rem)] max-w-3xl overflow-hidden rounded-3xl border border-black/10 bg-white p-0 text-ink shadow-2xl backdrop:bg-black/35">
      <form noValidate onSubmit={event => { event.preventDefault(); apply(); }} className="flex h-full min-h-0 flex-col">
        <header className="relative flex min-h-20 shrink-0 items-center justify-center border-b border-black/10 px-16 py-5">
          <h2 id={`${id}-title`} className="text-xl font-semibold">{title === "Budget" ? "Apply budget" : title}</h2>
          <button type="button" onClick={onClose} aria-label={`Close ${title.toLowerCase()}`} className={`absolute right-4 flex h-10 w-10 items-center justify-center rounded-full hover:bg-offwhite ${focusClass}`}><X size={22} aria-hidden="true" /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 sm:px-9">
          <p id={`${id}-description`} className="sr-only">{clearAll ? "Choose pricing, services, and location." : "Choose a pricing type and budget."} Changes apply when you use the button at the bottom.</p>
          <section className="border-b border-black/10 py-7 sm:py-8">
            <fieldset>
              <legend className="mb-5 text-xl font-semibold sm:text-2xl">Pricing type</legend>
              <div className="grid grid-cols-2 gap-1 rounded-2xl border border-black/15 p-1 sm:grid-cols-4">
                {pricingChoices.map(choice => (
                  <label key={choice.value} className="relative cursor-pointer">
                    <input ref={basis === choice.value ? initialFocusRef : undefined} type="radio" name={`${id}-basis`} value={choice.value} checked={basis === choice.value} onChange={() => chooseBasis(choice.value)} className="peer sr-only" />
                    <span className="flex min-h-14 items-center justify-center rounded-xl border-2 border-transparent px-2 py-3 text-center text-sm font-medium transition-colors duration-150 hover:bg-offwhite peer-checked:border-ink peer-checked:bg-offwhite peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-coral">{choice.label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {basis === "per_unit" && <fieldset className="mt-6">
              <legend className="mb-3 text-sm font-medium">Unit to compare</legend>
              <div className="flex flex-wrap gap-2">
                {units.map(value => <button type="button" key={value} aria-pressed={normalizeUnit(unit) === value && !otherUnit} onClick={() => chooseUnit(value)} className={`${chipClass} ${normalizeUnit(unit) === value && !otherUnit ? "border-ink bg-offwhite" : "border-black/15 hover:border-ink"}`}>{value}<Check size={15} aria-hidden="true" className={normalizeUnit(unit) === value && !otherUnit ? "" : "hidden"} /></button>)}
                <button type="button" aria-pressed={customUnit} onClick={() => { setOtherUnit(true); setUnit(""); resetRange(); }} className={`${chipClass} ${customUnit ? "border-ink bg-offwhite" : "border-black/15 hover:border-ink"}`}>Other unit</button>
              </div>
              {customUnit && <div className="mt-4"><label htmlFor={`${id}-unit`} className="mb-2 block text-sm">Unit name</label><input ref={unitRef} id={`${id}-unit`} value={unit} maxLength={30} onChange={event => { setUnit(event.target.value); resetRange(); }} placeholder="e.g. table or chair" className={`min-h-12 w-full rounded-xl border border-black/20 px-4 text-base ${focusClass}`} /></div>}
              <p className="mt-3 text-sm leading-6 text-ink/60">Choose the same unit for a fair price comparison.</p>
            </fieldset>}
          </section>
          <section className={clearAll ? "border-b border-black/10 py-7 sm:py-8" : "py-7 sm:py-8"} aria-labelledby={`${id}-range-title`}>
            <h3 id={`${id}-range-title`} className="text-xl font-semibold sm:text-2xl">Price range</h3>
            <p className="mb-3 mt-2 text-sm leading-6 text-ink/60">{basis ? `Listed rates ${priceLabel}${basis === "per_guest" ? "; minimum booking charges may apply" : ""}.` : "Choose a pricing type to compare similar packages."}</p>
            {loading && <p role="status" className="mb-3 text-sm text-ink/60">Loading package prices…</p>}
            {currentCatalog?.error && <p role="status" className="mb-3 text-sm leading-6 text-ink/60">Package prices are unavailable. You can still apply your filters. <button type="button" onClick={() => { setCatalog(null); setRetry(value => value + 1); }} className={`font-medium text-ink underline ${focusClass}`}>Retry</button></p>}
            {basis === "per_unit" && !normalizeUnit(unit) && <p className="mb-3 text-sm text-ink/60">Select a unit above to adjust the range.</p>}
            <PriceRangeSlider key={`${basis}:${normalizeUnit(unit)}`} prices={prices} minimum={minimum} maximum={maximum} suffix={priceLabel} disabled={!canAdjust} onChange={(min, max) => { setMinimum(min); setMaximum(max); setError(""); }} />
          </section>
          {clearAll && <>
            <section className="border-b border-black/10 py-7 sm:py-8" aria-labelledby={`${id}-services-title`}>
              <h3 id={`${id}-services-title`} className="mb-5 text-xl font-semibold sm:text-2xl">Services</h3>
              <div className="flex flex-wrap gap-3">
                <button type="button" aria-pressed={services.length === 0} onClick={() => setServices([])} className={`${chipClass} ${services.length === 0 ? "border-ink bg-offwhite" : "border-black/15 hover:border-ink"}`}>Any service</button>
                {SERVICES.map((service, index) => { const Icon = serviceIcons[index]; const selected = services.includes(service.slug); return <button type="button" key={service.slug} aria-pressed={selected} onClick={() => setServices(current => selected ? current.filter(value => value !== service.slug) : SERVICES.filter(value => current.includes(value.slug) || value.slug === service.slug).map(value => value.slug))} className={`${chipClass} ${selected ? "border-ink bg-offwhite" : "border-black/15 hover:border-ink"}`}><Icon size={20} aria-hidden="true" />{service.label}{selected && <Check size={15} aria-hidden="true" />}</button>; })}
              </div>
            </section>
            <section className="py-7 sm:py-8" aria-labelledby={`${id}-location-title`}>
              <h3 id={`${id}-location-title`} className="mb-5 text-xl font-semibold sm:text-2xl">Location</h3>
              <LocationChoices coverage={props.coverage} loading={props.coverageLoading} error={props.coverageError} retry={props.retryCoverage} province={province} area={area} services={services} onChange={(selectedProvince, selectedArea) => { setProvince(selectedProvince); setArea(selectedArea); }} />
            </section>
          </>}
        </div>
        <footer className="shrink-0 border-t border-black/10 bg-white px-5 py-4 sm:px-9 sm:py-5">
          {error && <p id={`${id}-error`} role="alert" className="mb-3 text-sm text-red-700">{error}</p>}
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={clearDraft} className={`min-h-12 shrink-0 text-sm font-semibold underline underline-offset-4 ${focusClass}`}>{clearAll ? "Clear all" : "Clear budget"}</button>
            <button type="submit" className={`min-h-12 rounded-xl bg-ink px-5 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:bg-black sm:px-7 ${focusClass}`}>{clearAll ? matchingCount === null ? "Show results" : `Show ${matchingCount} provider${matchingCount === 1 ? "" : "s"}` : "Apply budget"}</button>
          </div>
        </footer>
      </form>
    </dialog>
  );
}

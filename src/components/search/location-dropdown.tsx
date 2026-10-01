"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { PROVINCES, resolveArea, type LocationCoverage } from "@/lib/locations";
import { LocationChoices } from "@/components/search/location-choices";

export function LocationDropdown(props: {
  coverage: LocationCoverage | null;
  loading: boolean;
  error: string;
  retry: () => void;
  province: string;
  area: string;
  services: string[];
  onChange: (province: string, area: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const label = resolveArea(props.area)?.town ?? PROVINCES.find(item => item.id === props.province)?.label ?? (props.area || "All available areas");
  useEffect(() => {
    if (!open) return;
    const outside = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("mousedown", outside);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", outside); document.removeEventListener("keydown", escape); };
  }, [open]);
  return <div ref={ref} className="relative min-w-0">
    <button ref={trigger} type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)} className="flex max-w-[170px] items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral sm:max-w-[250px] sm:px-4">
      <span className="truncate">{label}</span><ChevronDown size={14} className="shrink-0 text-ink/50" aria-hidden="true" />
    </button>
    {open && <div id={id} aria-label="Choose a location" className="absolute left-0 top-full z-50 mt-3 max-h-[min(650px,calc(100dvh_-_260px))] w-[min(420px,calc(100vw_-_4rem))] overflow-y-auto overscroll-contain rounded-2xl border border-black/10 bg-white p-4 shadow-xl sm:max-h-[min(650px,calc(100dvh_-_180px))]" onBlur={event => { if (event.relatedTarget && !event.currentTarget.parentElement?.contains(event.relatedTarget)) setOpen(false); }}>
      <div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">Choose a location</h2><button type="button" aria-label="Close locations" onClick={() => { setOpen(false); trigger.current?.focus(); }} className="rounded-full p-1 hover:bg-offwhite focus-visible:outline-coral"><X size={18} /></button></div>
      <LocationChoices {...props} onChange={(province, area) => { props.onChange(province, area); setOpen(false); trigger.current?.focus(); }} />
    </div>}
  </div>;
}

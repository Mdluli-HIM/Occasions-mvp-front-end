"use client";

import { useId, useMemo, useState } from "react";
import {
  createPriceDomain, createPriceHistogram, formatRand, isValidPriceRange,
  parsePriceBound, updatePriceRange,
} from "@/lib/price-range";

type PriceRangeSliderProps = {
  prices: number[];
  minimum: string;
  maximum: string;
  onChange: (minimum: string, maximum: string) => void;
  disabled?: boolean;
  suffix: string;
};

export function PriceRangeSlider({ prices, minimum, maximum, onChange, disabled = false, suffix }: PriceRangeSliderProps) {
  const id = useId();
  // Hold the incoming limits while dragging, so the track does not shrink under a thumb.
  // The dialog keys this component by pricing basis and unit when those change.
  const [initialBounds] = useState(() => [parsePriceBound(minimum), parsePriceBound(maximum)].filter((value): value is number => value !== null));
  const [scaleAnchor, setScaleAnchor] = useState(0);
  const [focusedHandle, setFocusedHandle] = useState<"minimum" | "maximum" | null>(null);
  const domain = useMemo(() => createPriceDomain([...prices, ...initialBounds, scaleAnchor], minimum, maximum), [prices, initialBounds, scaleAnchor, minimum, maximum]);
  const bins = useMemo(() => createPriceHistogram(prices, domain), [prices, domain]);
  const lower = parsePriceBound(minimum) ?? domain.minimum;
  const upper = parsePriceBound(maximum) ?? domain.maximum;
  const lowerPercent = ((lower - domain.minimum) / (domain.maximum - domain.minimum)) * 100;
  const upperPercent = ((upper - domain.minimum) / (domain.maximum - domain.minimum)) * 100;
  const largestBin = Math.max(0, ...bins.map(bin => bin.count));
  const packageCount = bins.reduce((sum, bin) => sum + bin.count, 0);
  const validRange = isValidPriceRange(minimum, maximum);
  const topHandle = focusedHandle ?? (lower === upper && lower > 0 ? "minimum" : "maximum");

  function change(handle: "minimum" | "maximum", value: number) {
    // Retain the track after service/location changes or catalog refreshes.
    setScaleAnchor(current => Math.max(current, domain.maximum));
    const next = updatePriceRange(domain, minimum, maximum, handle, value);
    onChange(next.minimum, next.maximum);
  }

  return (
    <div className={disabled ? "opacity-50" : undefined}>
      <p id={`${id}-instructions`} className="text-sm leading-6 text-ink/60">
        {disabled ? "Select your pricing options to adjust the budget once prices have loaded." : "Drag the handles to set your budget."}
        {!disabled && <span className="sr-only"> Arrow keys adjust by R1.</span>}
      </p>
      <div className="relative mt-7 pb-5 pt-2">
        <div className="mx-4 flex h-24 items-end gap-[3px]" aria-hidden="true">
          {largestBin > 0 && bins.map((bin, index) => (
            <div key={index} className={`min-w-0 flex-1 rounded-t-[3px] transition-colors duration-150 ${bin.maximum >= lower && bin.minimum <= upper && !disabled ? "bg-coral" : "bg-black/10"}`}
              style={{ height: bin.count ? `${Math.max(5, (bin.count / largestBin) * 100)}%` : 0 }} />
          ))}
          {largestBin === 0 && <p className="w-full self-center text-center text-xs leading-5 text-ink/50">No package prices to display yet. You can still choose a budget.</p>}
        </div>
        <div className="pointer-events-none absolute bottom-5 left-4 right-4 h-[3px] bg-black/10" aria-hidden="true">
          <div className="absolute h-full bg-coral" style={{ left: `${lowerPercent}%`, width: `${Math.max(0, upperPercent - lowerPercent)}%` }} />
        </div>
        <input type="range" min={domain.minimum} max={domain.maximum} step={1} value={lower} disabled={disabled}
          aria-label={`Minimum price ${suffix}`} aria-valuemin={domain.minimum} aria-valuemax={upper}
          aria-valuetext={`${formatRand(lower)} ${suffix}`} aria-describedby={`${id}-instructions${validRange ? "" : ` ${id}-error`}`}
          onChange={event => change("minimum", Number(event.target.value))}
          onFocus={() => setFocusedHandle("minimum")} onBlur={() => setFocusedHandle(null)}
          className={`budget-range absolute bottom-[5px] left-0 h-8 w-full ${topHandle === "minimum" ? "z-20" : "z-10"}`} />
        <input type="range" min={domain.minimum} max={domain.maximum} step={1} value={upper} disabled={disabled}
          aria-label={`Maximum price ${suffix}`} aria-valuemin={lower} aria-valuemax={domain.maximum}
          aria-valuetext={maximum.trim() ? `${formatRand(upper)} ${suffix}` : "No upper price limit"} aria-describedby={`${id}-instructions${validRange ? "" : ` ${id}-error`}`}
          onChange={event => change("maximum", Number(event.target.value))}
          onFocus={() => setFocusedHandle("maximum")} onBlur={() => setFocusedHandle(null)}
          className={`budget-range absolute bottom-[5px] left-0 h-8 w-full ${topHandle === "maximum" ? "z-20" : "z-10"}`} />
      </div>
      <p className="sr-only">Price distribution from {packageCount} package{packageCount === 1 ? "" : "s"}.</p>
      <div className="mt-4 flex items-center justify-between gap-5">
        <div className="min-w-0 flex-1"><p className="mb-2 text-center text-xs font-medium text-ink/60">Minimum</p><output className="block rounded-full border border-black/15 px-3 py-3 text-center text-sm font-semibold sm:px-5">{formatRand(lower)}</output></div>
        <span aria-hidden="true" className="mt-6 h-px w-6 shrink-0 bg-black/20" />
        <div className="min-w-0 flex-1"><p className="mb-2 text-center text-xs font-medium text-ink/60">Maximum</p><output className="block rounded-full border border-black/15 px-3 py-3 text-center text-sm font-semibold sm:px-5">{maximum.trim() ? formatRand(upper) : "No limit"}</output></div>
      </div>
      {!validRange && <p id={`${id}-error`} role="alert" className="mt-3 text-sm text-red-700">This price range is invalid. Adjust the handles or clear your budget.</p>}
      <style jsx>{`
        .budget-range { appearance: none; -webkit-appearance: none; margin: 0; padding: 0; background: transparent; pointer-events: none; outline: none; }
        .budget-range::-webkit-slider-runnable-track { height: 3px; background: transparent; }
        .budget-range::-moz-range-track { height: 3px; background: transparent; }
        .budget-range::-webkit-slider-thumb { appearance: none; -webkit-appearance: none; width: 32px; height: 32px; margin-top: -14.5px; border: 1px solid #d1d1d1; border-radius: 50%; background: white; box-shadow: 0 2px 8px #00000012; pointer-events: auto; cursor: grab; touch-action: pan-y; }
        .budget-range::-moz-range-thumb { width: 30px; height: 30px; border: 1px solid #d1d1d1; border-radius: 50%; background: white; box-shadow: 0 2px 8px #00000012; pointer-events: auto; cursor: grab; touch-action: pan-y; }
        .budget-range:active::-webkit-slider-thumb { cursor: grabbing; }
        .budget-range:active::-moz-range-thumb { cursor: grabbing; }
        .budget-range:focus-visible::-webkit-slider-thumb { outline: 3px solid #ff5a40; outline-offset: 3px; }
        .budget-range:focus-visible::-moz-range-thumb { outline: 3px solid #ff5a40; outline-offset: 3px; }
        .budget-range:disabled::-webkit-slider-thumb { pointer-events: none; cursor: default; }
        .budget-range:disabled::-moz-range-thumb { pointer-events: none; cursor: default; }
        @media (prefers-reduced-motion: reduce) { .budget-range { transition: none; } }
      `}</style>
    </div>
  );
}

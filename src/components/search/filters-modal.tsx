"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

export function FiltersModal({
  open,
  onClose,
  minPrice,
  maxPrice,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  minPrice: string;
  maxPrice: string;
  onApply: (minPrice: string, maxPrice: string) => void;
}) {
  const [min, setMin] = useState(minPrice);
  const [max, setMax] = useState(maxPrice);

  useEffect(() => {
    setMin(minPrice);
    setMax(maxPrice);
  }, [minPrice, maxPrice, open]);

  if (!open) return null;

  function clearAll() {
    setMin("");
    setMax("");
  }

  function apply() {
    onApply(min, max);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <h2 className="font-semibold text-ink">Filters</h2>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-black/5 text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6 space-y-8">
          <div>
            <h3 className="font-semibold text-ink mb-1">Price per guest</h3>
            <p className="text-sm text-ink/50 mb-4">Prices in ZAR</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-ink/60">Minimum</label>
                <input
                  type="number"
                  min={0}
                  value={min}
                  onChange={(e) => setMin(e.target.value)}
                  placeholder="R0"
                  className="w-full rounded-full border border-black/15 px-4 py-2.5 text-sm text-ink outline-none focus:border-coral mt-1"
                />
              </div>
              <div className="text-ink/30 pt-5">—</div>
              <div className="flex-1">
                <label className="text-xs font-medium text-ink/60">Maximum</label>
                <input
                  type="number"
                  min={0}
                  value={max}
                  onChange={(e) => setMax(e.target.value)}
                  placeholder="Any"
                  className="w-full rounded-full border border-black/15 px-4 py-2.5 text-sm text-ink outline-none focus:border-coral mt-1"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-black/10 pt-6">
            <h3 className="font-semibold text-ink mb-1">Time of day</h3>
            {/*
              Not wired to real availability data yet — providers only have
              a single daily working-hours window, not per-slot booked/open
              status, so filtering by this would silently return nothing
              useful. UI kept here to match the reference design; wire this
              up once package-level availability exists.
            */}
            <p className="text-sm text-ink/50 mb-4">Coming soon</p>
            {["Morning", "Afternoon", "Evening"].map((label) => (
              <label
                key={label}
                className="flex items-center gap-3 py-2 text-ink/40 cursor-not-allowed"
              >
                <input type="checkbox" disabled className="h-4 w-4 rounded" />
                {label}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-black/10 px-6 py-4">
          <button
            onClick={clearAll}
            className="text-sm font-medium text-ink underline hover:no-underline"
          >
            Clear all
          </button>
          <button
            onClick={apply}
            className="rounded-full bg-ink text-white font-medium px-6 py-3 text-sm hover:bg-black/80 transition-colors duration-150"
          >
            Show results
          </button>
        </div>
      </div>
    </div>
  );
}

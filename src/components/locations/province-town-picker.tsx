"use client";

import { useState } from "react";
import { AREA_SUGGESTIONS, PROVINCES, createArea, resolveArea, sameArea, type ProvinceId } from "@/lib/locations";

const inputClass = "w-full rounded-xl border border-black/15 bg-white px-4 py-3.5 text-base text-ink outline-none focus:border-coral focus:ring-1 focus:ring-coral disabled:bg-black/5 disabled:text-black/50";

export function ProvinceTownPicker({ id, value, onChange, disabled = false }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const resolved = resolveArea(value);
  const suggestion = AREA_SUGGESTIONS.find((area) => sameArea(area.value, value));
  const [provinceId, setProvinceId] = useState<ProvinceId>(resolved?.provinceId ?? "limpopo");
  const [custom, setCustom] = useState(!!value && !suggestion);
  const [townDraft, setTownDraft] = useState(resolved?.town ?? value);
  const [previousValue, setPreviousValue] = useState(value);

  // An asynchronously loaded saved area updates both controls without changing it.
  if (previousValue !== value) {
    setPreviousValue(value);
    setProvinceId(resolved?.provinceId ?? provinceId);
    setCustom(!!value && !suggestion);
    setTownDraft(resolved?.town ?? value);
  }

  function choose(value: string) {
    setPreviousValue(value);
    onChange(value);
  }

  const towns = AREA_SUGGESTIONS.filter((area) => area.provinceId === provinceId);
  const choice = custom ? "__custom" : suggestion?.value ?? "";

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor={`${id}-province`} className="text-sm font-medium text-ink">Province</label>
          <select id={`${id}-province`} value={provinceId} disabled={disabled} className={inputClass}
            onChange={(event) => {
              setProvinceId(event.target.value as ProvinceId);
              setCustom(false);
              setTownDraft("");
              choose("");
            }}>
            {PROVINCES.map((province) => <option key={province.id} value={province.id}>{province.label}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label htmlFor={`${id}-town`} className="text-sm font-medium text-ink">Town or city</label>
          <select id={`${id}-town`} value={choice} disabled={disabled} className={inputClass}
            onChange={(event) => {
              const next = event.target.value;
              setCustom(next === "__custom");
              setTownDraft("");
              choose(next === "__custom" ? "" : next);
            }}>
            <option value="">Choose a town or city</option>
            {towns.map((area) => <option key={area.value} value={area.value}>{area.town}</option>)}
            <option value="__custom">Another town or city</option>
          </select>
        </div>
      </div>
      {custom && <div className="space-y-2">
        <label htmlFor={`${id}-custom-town`} className="text-sm font-medium text-ink">Town or city name</label>
        <input id={`${id}-custom-town`} value={townDraft} disabled={disabled} maxLength={80} className={inputClass}
          aria-describedby={`${id}-custom-hint`} placeholder="Enter your town or city"
          onChange={(event) => {
            setTownDraft(event.target.value);
            choose(createArea(event.target.value, provinceId)?.value ?? "");
          }} />
        <p id={`${id}-custom-hint`} className="text-sm leading-relaxed text-black/50">Use the town name; your chosen province is added automatically.</p>
      </div>}
    </div>
  );
}

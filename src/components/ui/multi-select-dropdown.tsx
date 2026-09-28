"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type Option = { value: string; label: string };

export function MultiSelectDropdown({
  label,
  placeholder,
  options,
  selected,
  onChange,
}: {
  label: string;
  placeholder: string;
  options: Option[];
  selected: string[];
  onChange: (values: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<string[]>(selected);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setDraft(selected), [selected]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setDraft(selected);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [selected]);

  function toggle(value: string) {
    setDraft((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function apply() {
    onChange(draft);
    setOpen(false);
  }

  const displayText =
    selected.length === 0
      ? placeholder
      : selected.length === 1
      ? options.find((o) => o.value === selected[0])?.label ?? placeholder
      : `${selected.length} selected`;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-ink hover:bg-black/5 transition-colors duration-150"
      >
        {displayText}
        <ChevronDown size={14} className="text-ink/50" />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 w-72 rounded-2xl border border-black/10 bg-white shadow-xl p-3 z-50">
          <p className="text-xs font-semibold tracking-wide text-ink/50 uppercase px-2 pb-2">
            {label} · Select multiple
          </p>

          <button
            type="button"
            onClick={() => setDraft([])}
            className={`group w-full flex items-center justify-between rounded-xl px-3 py-2.5 mb-1 text-sm font-medium transition-all duration-150 ease-out hover:bg-ink hover:text-white hover:translate-x-1 ${
              draft.length === 0 ? "bg-ink text-white" : "text-ink"
            }`}
          >
            <span>Any {label.toLowerCase()}</span>
            {draft.length === 0 && (
              <Check size={14} className="text-coral group-hover:text-white" />
            )}
          </button>

          <div className="max-h-64 overflow-y-auto">
            {options.map((opt) => {
              const checked = draft.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className="group w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-ink transition-all duration-150 ease-out hover:bg-ink hover:text-white hover:translate-x-1"
                >
                  <span>{opt.label}</span>
                  {checked && (
                    <Check size={14} className="text-coral group-hover:text-white" />
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={apply}
            className="w-full mt-2 rounded-full bg-coral text-white font-medium py-3 hover:bg-coral-hover transition-colors duration-150"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

function Check({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12" className={className} fill="none">
      <path
        d="M2 6.2 4.6 9 10 3"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  const selectionKey = JSON.stringify(selected);
  const [previousSelectionKey, setPreviousSelectionKey] = useState(selectionKey);
  const ref = useRef<HTMLDivElement>(null);

  if (selectionKey !== previousSelectionKey) {
    setPreviousSelectionKey(selectionKey);
    setDraft(selected);
  }

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
        className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-ink hover:bg-black/5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
      >
        {displayText}
        <ChevronDown size={14} className="text-ink/50" />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 w-72 rounded-2xl border border-black/10 bg-white shadow-xl p-3 z-50">
          <p className="text-xs font-semibold tracking-wide text-ink/50 uppercase px-2 pb-2">
            {label} · Select multiple
          </p>

          <div className="pr-1">
            <button
              type="button"
              aria-pressed={draft.length === 0}
              onClick={() => setDraft([])}
              className="occasions-dropdown-option flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm mb-1 font-medium"
            >
              <span>Any {label.toLowerCase()}</span>
              {draft.length === 0 && (
                <Check size={14} className="shrink-0 text-coral" />
              )}
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto overflow-x-hidden pr-1">
            {options.map((opt) => {
              const checked = draft.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={checked}
                  onClick={() => toggle(opt.value)}
                  className="occasions-dropdown-option flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm"
                >
                  <span>{opt.label}</span>
                  {checked && (
                    <Check size={14} className="shrink-0 text-coral" />
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
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 12 12" className={className} fill="none">
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

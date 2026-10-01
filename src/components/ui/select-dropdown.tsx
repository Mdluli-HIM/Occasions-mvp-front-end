"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

type Option = { value: string; label: string };

export function SelectDropdown({
  placeholder,
  options,
  value,
  onChange,
}: {
  placeholder: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayText = options.find((o) => o.value === value)?.label ?? placeholder;

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
        <div className="absolute top-full mt-2 left-0 w-72 rounded-2xl border border-black/10 bg-white shadow-xl p-2 z-50">
          <div className="pr-1">
            <button
              type="button"
              aria-pressed={value === ""}
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className="occasions-dropdown-option flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium"
            >
              <span>{placeholder}</span>
              {value === "" && <Check size={14} className="shrink-0 text-coral" />}
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto overflow-x-hidden pr-1">
            {options.map((opt) => {
              const active = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className="occasions-dropdown-option flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm"
                >
                  <span>{opt.label}</span>
                  {active && <Check size={14} className="shrink-0 text-coral" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Check({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 12 12"
      className={className}
      fill="none"
    >
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

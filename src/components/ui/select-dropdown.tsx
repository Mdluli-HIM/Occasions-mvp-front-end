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
        className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-ink hover:bg-black/5 transition-colors duration-150"
      >
        {displayText}
        <ChevronDown size={14} className="text-ink/50" />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 w-72 rounded-2xl border border-black/10 bg-white shadow-xl p-2 z-50">
          <button
            type="button"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
            className="group w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium text-ink hover:bg-ink hover:text-white hover:translate-x-1 transition-all duration-150 ease-out"
          >
            <span>{placeholder}</span>
            {value === "" && <Check size={14} className="text-coral" />}
          </button>

          <div className="max-h-72 overflow-y-auto">
            {options.map((opt) => {
              const active = value === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className="group w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-ink hover:bg-ink hover:text-white hover:translate-x-1 transition-all duration-150 ease-out"
                >
                  <span>{opt.label}</span>
                  {active && <Check size={14} className="text-coral group-hover:text-white" />}
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

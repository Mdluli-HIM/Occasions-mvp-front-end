"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";
import { PricingFilterDialog, type PricingFilterProps } from "@/components/search/pricing-filter-dialog";

export function BudgetButton(props: PricingFilterProps) {
  const [open, setOpen] = useState(false);
  const hasBudget = !!props.minPrice || !!props.maxPrice;
  return <>
    <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral">
      <Wallet size={16} aria-hidden="true" /> Apply budget
      {hasBudget && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-coral" />}
    </button>
    {open && <PricingFilterDialog {...props} title="Budget" onClose={() => setOpen(false)} />}
  </>;
}

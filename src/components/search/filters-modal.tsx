"use client";

import { PricingFilterDialog, type PricingFilterProps } from "@/components/search/pricing-filter-dialog";

export function FiltersModal({ open, onClose, ...props }: PricingFilterProps & { open: boolean; onClose: () => void }) {
  return open ? <PricingFilterDialog {...props} title="Filters" clearAll onClose={onClose} /> : null;
}

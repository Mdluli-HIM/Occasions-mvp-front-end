export type PricingType = "per_guest" | "fixed" | "per_unit";
export type PriceablePackage = {
  priceValue: number;
  minPriceValue?: number;
  pricingType?: PricingType | null;
  unitLabel?: string | null;
};

export const PRICING_OPTIONS: { value: PricingType; label: string }[] = [
  { value: "per_guest", label: "Per guest" },
  { value: "fixed", label: "Fixed package price" },
  { value: "per_unit", label: "Per unit" },
];

export function normalizePricingType(value: unknown): PricingType {
  return value === "fixed" || value === "per_unit" ? value : "per_guest";
}

export function pricingSuffix(type: PricingType | null | undefined, unitLabel?: string | null) {
  switch (normalizePricingType(type)) {
    case "fixed": return "/ package";
    case "per_unit": return `/ ${unitLabel?.trim() || "unit"}`;
    default: return "/ guest";
  }
}

export function formatPackagePrice(pkg: PriceablePackage) {
  return `R ${pkg.priceValue.toLocaleString("en-ZA")} ZAR ${pricingSuffix(pkg.pricingType, pkg.unitLabel)}`;
}

export function billedQuantity(type: PricingType | null | undefined, guests: number, quantity = 1) {
  const basis = normalizePricingType(type);
  return basis === "fixed" ? 1 : basis === "per_unit" ? quantity : guests;
}

export function calculatePackageTotal(pkg: PriceablePackage, guests: number, quantity = 1) {
  const billed = billedQuantity(pkg.pricingType, guests, quantity);
  const minimum = normalizePricingType(pkg.pricingType) === "per_guest" ? pkg.minPriceValue ?? 0 : 0;
  if (!Number.isInteger(guests) || guests < 1 || guests > 10000 || !Number.isInteger(billed) || billed < 1 || billed > 10000
    || !Number.isInteger(pkg.priceValue) || pkg.priceValue < 1 || pkg.priceValue > 2147483647
    || !Number.isInteger(minimum) || minimum < 0 || minimum > 2147483647) return Number.NaN;
  const total = Math.max(
    pkg.priceValue * billed,
    minimum,
  );
  return Number.isSafeInteger(total) && total >= 0 && total <= 2147483647 ? total : Number.NaN;
}

export function providerPriceLabel(packages: PriceablePackage[]): string[] {
  const rates = new Map<string, PriceablePackage>();
  for (const pkg of packages) {
    const type = normalizePricingType(pkg.pricingType);
    const key = `${type}:${type === "per_unit" ? pkg.unitLabel?.trim().toLowerCase() || "unit" : ""}`;
    const current = rates.get(key);
    if (!current || pkg.priceValue < current.priceValue) rates.set(key, pkg);
  }
  return [...rates.values()].map((pkg) => `From ${formatPackagePrice(pkg)}`);
}

export function guestCapacityProblem(pkg: { minGuests?: number | null; maxGuests?: number | null }, guests: number): string | null {
  if (pkg.minGuests && guests < pkg.minGuests) return `This package needs at least ${pkg.minGuests} attendees.`;
  if (pkg.maxGuests && guests > pkg.maxGuests) return `This package supports up to ${pkg.maxGuests} attendees. Choose a package that covers your event.`;
  return null;
}

export function bookingPricingDescription(booking: {
  pricingType?: PricingType | null;
  unitLabel?: string | null;
  unitPrice?: number | null;
  quantity?: number | null;
  minimumCharge?: number | null;
  guests: number;
}) {
  const type = normalizePricingType(booking.pricingType);
  const rate = typeof booking.unitPrice === "number" ? `R ${booking.unitPrice.toLocaleString("en-ZA")} ZAR` : null;
  const quantity = booking.quantity ?? (type === "per_guest" ? booking.guests : 1);
  if (type === "fixed") return rate ? `Fixed package price: ${rate}` : "Fixed package price at booking";
  if (type === "per_unit") return `Quantity: ${quantity} (${booking.unitLabel || "unit"})${rate ? ` · ${rate} ${pricingSuffix(type, booking.unitLabel)}` : ""}`;
  return `${quantity} guests${rate ? ` × ${rate}` : " · per-guest pricing at booking"}${booking.minimumCharge ? ` · minimum R ${booking.minimumCharge.toLocaleString("en-ZA")}` : ""}`;
}

// These helpers work on the unbudgeted results for the current area/services.
// Each sample is an actual package rate; a provider may have several samples.
export type SearchPricePackage = {
  priceValue: number;
  pricingType?: string | null;
  unitLabel?: string | null;
};

export type SearchPriceProvider = {
  packages: readonly SearchPricePackage[];
};

const maximumAmount = 2147483647;
const pricingTypes = ["per_guest", "fixed", "per_unit"];

function packageBasis(pkg: SearchPricePackage) {
  // Legacy packages predate the explicit basis and were priced per guest.
  return pkg.pricingType == null ? "per_guest" : pkg.pricingType;
}

function validRate(value: number) {
  return Number.isInteger(value) && value >= 1 && value <= maximumAmount;
}

function normalizedUnit(value: string | null | undefined): string | null {
  const unit = (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  return unit.length > 0 && unit.length <= 30 && /^[a-z0-9][a-z0-9 -]*$/.test(unit) ? unit : null;
}

function matchingPackage(pkg: SearchPricePackage, basis: string, unit: string | null) {
  return validRate(pkg.priceValue)
    && (!basis || packageBasis(pkg) === basis)
    && (!unit || normalizedUnit(pkg.unitLabel) === unit);
}

export function priceSamples(providers: readonly SearchPriceProvider[], basis: string, unit: string): number[] {
  if (!pricingTypes.includes(basis)) return [];
  const selectedUnit = basis === "per_unit" ? normalizedUnit(unit) : null;
  if (basis === "per_unit" && !selectedUnit) return [];
  return providers.flatMap(provider => provider.packages
    .filter(pkg => matchingPackage(pkg, basis, selectedUnit))
    .map(pkg => pkg.priceValue));
}

export function unitOptions(providers: readonly SearchPriceProvider[]): string[] {
  const units = new Set<string>();
  for (const provider of providers) {
    for (const pkg of provider.packages) {
      if (packageBasis(pkg) !== "per_unit") continue;
      const unit = normalizedUnit(pkg.unitLabel);
      if (unit) units.add(unit);
    }
  }
  return [...units].sort((a, b) => a.localeCompare(b, "en-ZA"));
}

function bound(value: string): number | null | undefined {
  const amount = value.trim();
  if (!amount) return undefined;
  if (!/^\d+$/.test(amount)) return null;
  const parsed = Number(amount);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= maximumAmount ? parsed : null;
}

// The same package must match every term, just like the backend's packages.some.
// An unfiltered result can include a provider that has not added packages yet.
export function countMatchingProviders(
  providers: readonly SearchPriceProvider[],
  basis: string,
  unit: string,
  min: string,
  max: string,
): number {
  if (basis && !pricingTypes.includes(basis)) return 0;
  const minimum = bound(min);
  const maximum = bound(max);
  if (minimum === null || maximum === null) return 0;
  const hasBudget = minimum !== undefined || maximum !== undefined;
  if (hasBudget && !basis) return 0;
  if (minimum !== undefined && maximum !== undefined && minimum > maximum) return 0;
  const hasUnit = unit.trim().length > 0;
  const selectedUnit = hasUnit ? normalizedUnit(unit) : null;
  if (hasUnit && (basis !== "per_unit" || !selectedUnit)) return 0;
  if (hasBudget && basis === "per_unit" && !selectedUnit) return 0;
  if (!basis && !hasBudget && !hasUnit) return providers.length;
  return providers.filter(provider => provider.packages.some(pkg =>
    matchingPackage(pkg, basis, selectedUnit)
      && (minimum === undefined || pkg.priceValue >= minimum)
      && (maximum === undefined || pkg.priceValue <= maximum),
  )).length;
}

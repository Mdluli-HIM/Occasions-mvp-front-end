export const PRICE_MAX = 2147483647;

export type PriceDomain = { minimum: number; maximum: number };
export type PriceHistogramBin = { minimum: number; maximum: number; count: number };
export type PriceRange = { minimum: string; maximum: string };

export function isValidPrice(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= PRICE_MAX;
}

/** An empty bound means the customer has not set a limit. */
export function parsePriceBound(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return null;
  const amount = Number(trimmed);
  return isValidPrice(amount) ? amount : null;
}

export function isValidPriceRange(minimum: string, maximum: string) {
  const lower = parsePriceBound(minimum);
  const upper = parsePriceBound(maximum);
  return (!minimum.trim() || lower !== null) && (!maximum.trim() || upper !== null)
    && (lower === null || upper === null || lower <= upper);
}

function ceilingPrice(value: number) {
  if (value <= 10) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const increment = magnitude / 2;
  return Math.min(PRICE_MAX, Math.ceil(value / increment) * increment);
}

/** Existing URL limits also extend the domain; opening a dialog never clips them. */
export function createPriceDomain(prices: readonly number[], minimum = "", maximum = ""): PriceDomain {
  const rates = prices.filter(price => isValidPrice(price) && price > 0);
  const bounds = [parsePriceBound(minimum), parsePriceBound(maximum)].filter((value): value is number => value !== null);
  let highest = rates.length ? 10 : 5000;
  for (const value of [...rates, ...bounds]) highest = Math.max(highest, value);
  return { minimum: 0, maximum: ceilingPrice(highest) };
}

/** Counts actual package rates only, never a decorative or estimated distribution. */
export function createPriceHistogram(prices: readonly number[], domain: PriceDomain, binCount = 32): PriceHistogramBin[] {
  if (!isValidPrice(domain.minimum) || !isValidPrice(domain.maximum) || domain.maximum <= domain.minimum) return [];
  const count = Number.isInteger(binCount) && binCount >= 1 && binCount <= 100 ? binCount : 32;
  const width = (domain.maximum - domain.minimum) / count;
  const bins = Array.from({ length: count }, (_, index) => ({
    minimum: domain.minimum + index * width,
    maximum: index === count - 1 ? domain.maximum : domain.minimum + (index + 1) * width,
    count: 0,
  }));
  for (const price of prices) {
    if (!isValidPrice(price) || price <= 0 || price < domain.minimum || price > domain.maximum) continue;
    const index = Math.min(count - 1, Math.floor((price - domain.minimum) / width));
    bins[index].count += 1;
  }
  return bins;
}

export function updatePriceRange(domain: PriceDomain, minimum: string, maximum: string, handle: "minimum" | "maximum", value: number): PriceRange {
  if (!isValidPrice(value) || !isValidPrice(domain.minimum) || !isValidPrice(domain.maximum) || domain.minimum >= domain.maximum) return { minimum, maximum };
  const currentLower = parsePriceBound(minimum) ?? domain.minimum;
  const currentUpper = parsePriceBound(maximum) ?? domain.maximum;
  const bounded = Math.min(domain.maximum, Math.max(domain.minimum, value));
  const lower = handle === "minimum" ? Math.min(bounded, currentUpper) : currentLower;
  const upper = handle === "maximum" ? Math.max(bounded, currentLower) : currentUpper;
  return {
    minimum: handle === "minimum"
      ? lower === domain.minimum ? "" : String(lower)
      : parsePriceBound(minimum) === null ? "" : String(currentLower),
    maximum: handle === "maximum"
      ? upper === domain.maximum ? "" : String(upper)
      : parsePriceBound(maximum) === null ? "" : String(currentUpper),
  };
}

export function formatRand(value: number) {
  return `R ${value.toLocaleString("en-ZA")}`;
}

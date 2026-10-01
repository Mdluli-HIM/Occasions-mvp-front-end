/** National location names. Keep the original Limpopo values compatible with saved bookings. */
export const PROVINCES = [
  { id: "limpopo", label: "Limpopo" },
  { id: "gauteng", label: "Gauteng" },
  { id: "western-cape", label: "Western Cape" },
  { id: "eastern-cape", label: "Eastern Cape" },
  { id: "kwazulu-natal", label: "KwaZulu-Natal" },
  { id: "mpumalanga", label: "Mpumalanga" },
  { id: "north-west", label: "North West" },
  { id: "free-state", label: "Free State" },
  { id: "northern-cape", label: "Northern Cape" },
] as const;

export type ProvinceId = (typeof PROVINCES)[number]["id"];
export type AreaLocation = { value: string; town: string; provinceId: ProvinceId; provinceLabel: string };

const townsByProvince: Record<ProvinceId, readonly string[]> = {
  limpopo: ["Polokwane", "Tzaneen", "Mokopane", "Thohoyandou", "Louis Trichardt (Makhado)", "Phalaborwa", "Lephalale", "Musina", "Bela-Bela", "Modimolle", "Giyani", "Groblersdal"],
  gauteng: ["Johannesburg", "Pretoria", "Centurion", "Soweto", "Midrand", "Sandton", "Benoni", "Boksburg", "Kempton Park", "Vereeniging"],
  "western-cape": ["Cape Town", "Stellenbosch", "Paarl", "George", "Worcester", "Mossel Bay"],
  "eastern-cape": ["Gqeberha", "East London", "Mthatha", "Makhanda", "Komani", "Jeffreys Bay"],
  "kwazulu-natal": ["Durban", "Pietermaritzburg", "Richards Bay", "Newcastle", "Ballito", "Port Shepstone"],
  mpumalanga: ["Mbombela", "eMalahleni", "Middelburg", "Secunda", "Ermelo", "White River"],
  "north-west": ["Rustenburg", "Mahikeng", "Potchefstroom", "Klerksdorp", "Brits", "Vryburg"],
  "free-state": ["Bloemfontein", "Welkom", "Bethlehem", "Sasolburg", "Kroonstad", "Parys"],
  "northern-cape": ["Kimberley", "Upington", "Kuruman", "Springbok", "De Aar"],
};

export const AREA_SUGGESTIONS: AreaLocation[] = PROVINCES.flatMap((province) =>
  townsByProvince[province.id].map((town) => ({
    value: province.id === "limpopo" ? town : `${town}, ${province.label}`,
    town,
    provinceId: province.id,
    provinceLabel: province.label,
  })),
);

const clean = (value: string) => value.trim().replace(/\s+/g, " ");
const key = (value: string) => clean(value).toLocaleLowerCase("en-ZA");

export function isProvinceId(value: unknown): value is ProvinceId {
  return typeof value === "string" && PROVINCES.some((province) => province.id === value);
}

/** Suggestions aren't a boundary: providers can name any town within a province. */
export function createArea(townInput: string, provinceId: ProvinceId): AreaLocation | null {
  const province = PROVINCES.find((item) => item.id === provinceId);
  const town = clean(townInput);
  if (!province || town.length < 2 || town.length > 80 || !/^[\p{L}\p{N}][\p{L}\p{N} .()'’&\/-]*$/u.test(town)) return null;
  const townKey = key(town);
  const known = AREA_SUGGESTIONS.find((area) => area.provinceId === provinceId && key(area.town) === townKey);
  if (known) return known;
  if (provinceId === "limpopo" && ["makhado", "louis trichardt"].includes(townKey)) {
    return AREA_SUGGESTIONS.find((area) => area.value === "Louis Trichardt (Makhado)")!;
  }
  const formatted = town.toLocaleLowerCase("en-ZA").replace(/(^|[\s\/-])\p{L}/gu, (part) => part.toLocaleUpperCase("en-ZA"));
  return { value: `${formatted}, ${province.label}`, town: formatted, provinceId, provinceLabel: province.label };
}

export function resolveArea(input: unknown): AreaLocation | null {
  if (typeof input !== "string" || input.length > 120) return null;
  const value = clean(input);
  const legacy = AREA_SUGGESTIONS.find((area) => area.provinceId === "limpopo" && key(area.value) === key(value));
  if (legacy) return legacy;
  if (["makhado", "louis trichardt"].includes(key(value))) return createArea(value, "limpopo");
  const comma = value.lastIndexOf(",");
  if (comma < 0) return null;
  const provinceName = key(value.slice(comma + 1));
  const province = PROVINCES.find((item) => key(item.label) === provinceName || item.id === provinceName);
  return province ? createArea(value.slice(0, comma), province.id) : null;
}

export function normalizeArea(value: unknown): string | null {
  return resolveArea(value)?.value ?? null;
}

export function sameArea(first: unknown, second: unknown): boolean {
  const canonical = normalizeArea(first);
  return canonical !== null && canonical === normalizeArea(second);
}

export function areaAliases(value: string): string[] {
  const area = resolveArea(value);
  if (!area) return [];
  const aliases = [area.value, `${area.town}, ${area.provinceLabel}`];
  if (area.value === "Louis Trichardt (Makhado)") aliases.push("Makhado", "Louis Trichardt", "Makhado, Limpopo", "Louis Trichardt, Limpopo");
  return [...new Set(aliases)];
}

export function locationLabel(value: string): string {
  const area = resolveArea(value);
  return area ? `${area.town}, ${area.provinceLabel}` : value;
}

export type AreaCoverage = { value: string; town: string; provinceId: ProvinceId; providerCount: number; serviceCounts: Record<string, number> };
export type ProvinceCoverage = { id: ProvinceId; label: string; isLaunched: boolean; providerCount: number; serviceCounts: Record<string, number>; areas: AreaCoverage[] };
export type LocationCoverage = { launchProvinceIds: ProvinceId[]; providerCount: number; provinces: ProvinceCoverage[] };

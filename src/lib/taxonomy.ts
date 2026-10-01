export const LIMPOPO_AREAS = [
  "Polokwane",
  "Tzaneen",
  "Mokopane",
  "Thohoyandou",
  "Louis Trichardt (Makhado)",
  "Phalaborwa",
  "Lephalale",
  "Musina",
  "Bela-Bela",
  "Modimolle",
  "Giyani",
  "Groblersdal",
] as const;

export const SERVICES = [
  { slug: "catering", label: "Catering" },
  { slug: "tents", label: "Tents & Marquees" },
  { slug: "decor", label: "Décor" },
  { slug: "sound-dj", label: "Sound & DJ" },
  { slug: "photography", label: "Photography" },
  { slug: "chairs-tables", label: "Chairs & Tables" },
  { slug: "mobile-toilets", label: "Mobile Toilets" },
  { slug: "mobile-fridges", label: "Mobile Fridges" },
  { slug: "other", label: "Other" },
] as const;

export type LimpopoArea = (typeof LIMPOPO_AREAS)[number];
export type ServiceSlug = (typeof SERVICES)[number]["slug"];

export function getServiceLabel(serviceSlug: string, category?: string): string {
  if (serviceSlug === "other") return category?.trim() || "Other";
  return SERVICES.find((s) => s.slug === serviceSlug)?.label ?? category ?? "Other";
}

export const EVENT_TYPES = [
  { slug: "wedding", label: "Wedding", description: "Bring your celebration together", services: ["catering", "tents", "decor", "sound-dj", "photography", "chairs-tables"] },
  { slug: "birthday", label: "Birthday", description: "A party for someone special", services: ["catering", "decor", "sound-dj", "chairs-tables"] },
  { slug: "baby-shower", label: "Baby shower", description: "Celebrate a new arrival", services: ["catering", "decor", "photography", "chairs-tables"] },
  { slug: "corporate", label: "Corporate event", description: "Meetings, launches and team gatherings", services: ["catering", "sound-dj", "chairs-tables", "photography"] },
  { slug: "graduation", label: "Graduation", description: "Celebrate a milestone", services: ["catering", "decor", "photography", "chairs-tables"] },
  { slug: "funeral", label: "Funeral or memorial", description: "Plan a thoughtful gathering", services: ["catering", "tents", "chairs-tables", "mobile-toilets"] },
  { slug: "family-gathering", label: "Family gathering", description: "Make time together memorable", services: ["catering", "tents", "chairs-tables", "mobile-fridges"] },
  { slug: "other", label: "Other", description: "Tell us what you are planning", services: [] },
] as const;

export function suggestedServices(type: string): string[] {
  return [...(EVENT_TYPES.find((event) => event.slug === type)?.services ?? [])];
}

export function getEventTypeLabel(type: string, customEventType = ""): string {
  if (type === "other") return customEventType.trim() || "Other event";
  return EVENT_TYPES.find((event) => event.slug === type)?.label ?? "Event";
}

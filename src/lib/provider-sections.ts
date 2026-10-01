import type { HomeSection, Provider } from "./api";
import { SERVICES } from "./taxonomy";

export function groupProvidersByService(providers: Provider[]): HomeSection[] {
  const sections: HomeSection[] = SERVICES.map((service) => ({
    serviceSlug: service.slug,
    label: service.label,
    providers: [],
  }));
  const byService = new Map(sections.map((section) => [section.serviceSlug, section]));
  const other = byService.get("other")!;

  for (const provider of providers) {
    // Keep older or custom categories visible in the final Other section.
    const section = byService.get(provider.serviceSlug) ?? other;
    section.providers.push(provider);
  }

  return sections.filter((section) => section.providers.length > 0);
}

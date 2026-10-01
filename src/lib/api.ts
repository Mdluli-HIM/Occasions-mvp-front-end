import type { PricingType } from "@/lib/pricing";
import type { EventSummary } from "@/lib/event-api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type Package = {
  id: string;
  providerId: string;
  title: string;
  description: string;
  photoUrl: string;
  priceValue: number;
  minPriceValue: number;
  pricingType: PricingType;
  unitLabel: string;
  inclusions: string[];
  exclusions: string[];
  minGuests: number | null;
  maxGuests: number | null;
  durationMinutes: number;
};

export type Qualification = {
  id: string;
  title: string;
  detail: string;
};

export type Provider = {
  id: string;
  slug: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  areasServed: string[];
  providerType: "individual" | "company" | null;
  profileName: string;
  profileBio: string;
  profilePhotoUrl: string;
  yearsExperience: number | null;
  serviceSlug: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  rating: number;
  reviewCount: number;
  guestRequirements: string;
  accessibilityNote: string;
  cancellationNote: string;
  media: { id: string; url: string }[];
  packages: Package[];
  qualifications: Qualification[];
};

export type Booking = {
  id: string;
  eventId: string | null;
  event: EventSummary | null;
  serviceSlug: string;
  providerId: string;
  packageId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guests: number;
  eventDate: string;
  startTime: string;
  totalPrice: number;
  pricingType: PricingType | null;
  unitLabel: string | null;
  unitPrice: number | null;
  quantity: number | null;
  minimumCharge: number | null;
  status: "Pending" | "Confirmed" | "Cancelled" | "Completed";
  package: Package;
  provider: Provider;
};

export class ProviderSearchError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = "ProviderSearchError"; }
}

export async function fetchProviders(params: {
  area?: string;
  services?: string;
  minPrice?: string;
  maxPrice?: string;
  pricingType?: string;
  unitLabel?: string;
}, signal?: AbortSignal): Promise<Provider[]> {
  const qs = new URLSearchParams();
  if (params.area) qs.set("area", params.area);
  if (params.services) qs.set("services", params.services);
  if (params.minPrice) qs.set("minPrice", params.minPrice);
  if (params.maxPrice) qs.set("maxPrice", params.maxPrice);
  // Older budget URLs represented per-guest rates. Preserve that meaning.
  if (params.pricingType || params.minPrice || params.maxPrice) qs.set("pricingType", params.pricingType || "per_guest");
  if (params.unitLabel) qs.set("unitLabel", params.unitLabel);

  const res = await fetch(`${API_URL}/api/providers?${qs.toString()}`, {
    cache: "no-store",
    signal,
  });
  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null);
    const message = res.status === 400 && body && typeof body === "object" && "error" in body && typeof body.error === "string" ? body.error : "Providers are temporarily unavailable. Please try again.";
    throw new ProviderSearchError(res.status, message);
  }
  return res.json();
}

export async function fetchProvider(slug: string, signal?: AbortSignal): Promise<Provider | null> {
  const res = await fetch(`${API_URL}/api/providers/${encodeURIComponent(slug)}`, { cache: "no-store", signal });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch provider");
  return res.json();
}

export class BookingAccessError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = "BookingAccessError";
  }
}

async function bookingAccessError(response: Response, fallback: string) {
  const body: unknown = await response.json().catch(() => null);
  const message =
    body !== null &&
    typeof body === "object" &&
    "error" in body &&
    typeof body.error === "string" &&
    body.error.trim()
      ? body.error
      : fallback;
  return new BookingAccessError(response.status, message);
}

export async function fetchBooking(
  id: string,
  token: string,
  signal?: AbortSignal
): Promise<Booking | null> {
  const res = await fetch(`${API_URL}/api/bookings/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal,
  });
  if (res.status === 404) return null;
  if (!res.ok) throw await bookingAccessError(res, "Could not load your booking");
  return res.json();
}

export async function checkoutCart(data: {
  token: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  items: {
    packageId: string;
    eventId?: string | null;
    guests: number;
    quantity: number;
    expectedPricingType: PricingType;
    expectedUnitLabel: string;
    expectedUnitPrice: number;
    expectedMinimumCharge: number;
    eventDate: string;
    startTime: string;
  }[];
}): Promise<{ checkoutId: string; bookings: Booking[] }> {
  const { token, ...body } = data;
  const res = await fetch(`${API_URL}/api/bookings/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const message = typeof err.error === "string" ? err.error : "Please check the date, time and guests for each service.";
    throw new BookingAccessError(res.status, message);
  }
  return res.json();
}

export async function fetchCheckoutBookings(
  checkoutId: string,
  token: string,
  signal?: AbortSignal
): Promise<Booking[]> {
  const res = await fetch(`${API_URL}/api/bookings/checkout/${encodeURIComponent(checkoutId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
    signal,
  });
  if (!res.ok) throw await bookingAccessError(res, "Could not load your checkout");
  return res.json();
}

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: "customer" | "provider";
};

export async function signup(data: {
  email: string;
  password: string;
  name: string;
  phone: string;
  role?: "customer" | "provider";
}): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, role: data.role ?? "customer" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.error === "string" ? err.error : "Signup failed");
  }
  return res.json();
}

export async function login(data: {
  email: string;
  password: string;
}): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.error === "string" ? err.error : "Login failed");
  }
  return res.json();
}

export type HomeSection = {
  serviceSlug: string;
  label: string;
  providers: Provider[];
};

export class HomeSectionsError extends Error {
  constructor(public readonly status: number) {
    super("Provider listings are temporarily unavailable.");
    this.name = "HomeSectionsError";
  }
}

function isHomeProvider(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const provider = value as Record<string, unknown>;
  return ["id", "slug", "name", "category", "serviceSlug"].every((key) => typeof provider[key] === "string")
    && Array.isArray(provider.media) && provider.media.every((photo: unknown) => {
      if (!photo || typeof photo !== "object") return false;
      return "url" in photo && typeof photo.url === "string";
    })
    && Array.isArray(provider.packages) && provider.packages.every((pkg: unknown) => {
      if (!pkg || typeof pkg !== "object") return false;
      return "priceValue" in pkg && typeof pkg.priceValue === "number" && Number.isFinite(pkg.priceValue) && pkg.priceValue >= 0;
    });
}

function isHomeSection(value: unknown): value is HomeSection {
  if (!value || typeof value !== "object") return false;
  return "serviceSlug" in value && typeof value.serviceSlug === "string"
    && "label" in value && typeof value.label === "string"
    && "providers" in value && Array.isArray(value.providers) && value.providers.every(isHomeProvider);
}

export async function fetchHomeSections(limit = 8): Promise<HomeSection[]> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/providers/home?limit=${limit}`, { cache: "no-store" });
  } catch {
    throw new HomeSectionsError(0);
  }
  if (!res.ok) throw new HomeSectionsError(res.status);
  const data: unknown = await res.json().catch(() => { throw new HomeSectionsError(res.status); });
  if (!data || typeof data !== "object" || !("sections" in data)
    || !Array.isArray(data.sections) || !data.sections.every(isHomeSection)) {
    throw new HomeSectionsError(res.status);
  }
  return data.sections;
}

export async function fetchProvidersBySlugs(slugs: string[]): Promise<Provider[]> {
  if (slugs.length === 0) return [];
  const res = await fetch(
    `${API_URL}/api/providers?slugs=${encodeURIComponent(slugs.join(","))}`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function fetchMyBookings(token: string, signal?: AbortSignal): Promise<Booking[]> {
  const res = await fetch(`${API_URL}/api/bookings/me`, {
    signal,
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  if (!res.ok) throw await bookingAccessError(res, "Could not load your bookings");
  return res.json();
}

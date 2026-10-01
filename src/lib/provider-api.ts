import { useAuthStore } from "@/lib/auth-store";
import type { EventSummary } from "@/lib/event-api";
import type { PricingType } from "@/lib/pricing";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type ListingStatus = "draft" | "live";
export type ProviderType = "individual" | "company" | null;

export type MyPackage = {
  id: string;
  title: string;
  description: string;
  photoUrl: string;
  pricingType: PricingType;
  unitLabel: string;
  inclusions: string[];
  exclusions: string[];
  minGuests: number | null;
  maxGuests: number | null;
  priceValue: number;
  minPriceValue: number;
  durationMinutes: number;
};

export type PackageInput = {
  title: string;
  description: string;
  photoUrl: string;
  pricingType: PricingType;
  unitLabel: string;
  inclusions: string[];
  exclusions: string[];
  minGuests: number | null;
  maxGuests: number | null;
  priceValue: number;
  minPriceValue: number;
  durationMinutes: number;
};

export type MyListing = {
  profilePhotoUrl: string;
  id: string;
  slug: string;
  name: string;
  providerType: ProviderType;
  profileName: string;
  profileBio: string;
  yearsExperience: number | null;
  category: string;
  tagline: string;
  description: string;
  areasServed: string[];
  serviceSlug: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  status: ListingStatus;
  contactPhone: string;
  contactWhatsapp: string;
  guestRequirements: string;
  accessibilityNote: string;
  cancellationNote: string;
  media: { id: string; url: string; sortOrder: number }[];
  packages: MyPackage[];
};

export type ListingInput = {
  name: string;
  providerType: ProviderType;
  profileName: string;
  profileBio: string;
  yearsExperience: number | null;
  category: string;
  tagline: string;
  description: string;
  areasServed: string[];
  serviceSlug: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  contactPhone: string;
  contactWhatsapp: string;
  guestRequirements: string;
  accessibilityNote: string;
  cancellationNote: string;
};

export type BookingStatus = "Pending" | "Confirmed" | "Cancelled" | "Completed";

export type ProviderBooking = {
  id: string;
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
  status: BookingStatus;
  createdAt: string;
  eventId: string | null;
  event: EventSummary | null;
  serviceSlug: string;
  package: { title: string; priceValue: number; durationMinutes: number };
};

async function authed<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store" });

  // Expired or invalid token: clear the session so the route guard sends them to /login.
  if (res.status === 401 && useAuthStore.getState().token === token) useAuthStore.getState().logout();

  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const body = await res.json();
      if (typeof body.error === "string") message = body.error;
      else if (body.error && typeof body.error === "object") {
        const problems = [
          ...(Array.isArray(body.error.formErrors) ? body.error.formErrors : []),
          ...Object.values(body.error.fieldErrors ?? {}).flat(),
        ].filter((problem): problem is string => typeof problem === "string");
        if (problems.length > 0) message = problems[0];
      }
    } catch {}
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Returns null when the user has no listing yet (drives the empty state).
export async function getMyListing(): Promise<MyListing | null> {
  try {
    return await authed<MyListing>("/api/providers/me/listing");
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

export const saveMyListing = (data: ListingInput) =>
  authed<MyListing>("/api/providers/me/listing", {
    method: "PUT",
    body: JSON.stringify(data),
  });

export const setListingStatus = (status: ListingStatus) =>
  authed<MyListing>("/api/providers/me/listing/status", {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export function uploadListingPhoto(file: File) {
  const form = new FormData();
  form.append("photo", file);
  return authed<{ id: string; url: string; sortOrder: number }>(
    "/api/providers/me/listing/media",
    { method: "POST", body: form }
  );
}

export function uploadProfilePhoto(file: File) {
  const form = new FormData();
  form.append("photo", file);
  return authed<{ url: string }>("/api/providers/me/listing/profile-photo", {
    method: "POST",
    body: form,
  });
}

export const deleteProfilePhoto = () =>
  authed<void>("/api/providers/me/listing/profile-photo", { method: "DELETE" });

export const deleteListingPhoto = (mediaId: string) =>
  authed<void>(`/api/providers/me/listing/media/${mediaId}`, { method: "DELETE" });

export function getMyBookings(params: { status?: BookingStatus; when?: "upcoming" | "past" } = {}, signal?: AbortSignal) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.when) qs.set("when", params.when);
  const query = qs.toString();
  return authed<ProviderBooking[]>(`/api/providers/me/bookings${query ? `?${query}` : ""}`, { signal });
}

export const updateBookingStatus = (id: string, status: "Confirmed" | "Cancelled" | "Completed") =>
  authed<ProviderBooking>(`/api/providers/me/bookings/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

export const createPackage = (data: PackageInput) =>
  authed<MyPackage>("/api/providers/me/listing/packages", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updatePackage = (id: string, data: Partial<PackageInput>) =>
  authed<MyPackage>(`/api/providers/me/listing/packages/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deletePackage = (id: string) =>
  authed<void>(`/api/providers/me/listing/packages/${id}`, { method: "DELETE" });

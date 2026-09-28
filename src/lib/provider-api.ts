import { useAuthStore } from "@/lib/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export type ListingStatus = "draft" | "live";

export type MyPackage = {
  id: string;
  title: string;
  description: string;
  priceValue: number;
  minPriceValue: number;
  durationMinutes: number;
};

export type PackageInput = {
  title: string;
  description: string;
  priceValue: number;
  minPriceValue: number;
  durationMinutes: number;
};

export type MyListing = {
  id: string;
  slug: string;
  name: string;
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

export type BookingStatus = "Pending" | "Confirmed" | "Cancelled";

export type ProviderBooking = {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guests: number;
  eventDate: string;
  startTime: string;
  totalPrice: number;
  status: BookingStatus;
  createdAt: string;
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
  if (res.status === 401) useAuthStore.getState().logout();

  if (!res.ok) {
    let message = "Something went wrong. Please try again.";
    try {
      const body = await res.json();
      if (typeof body.error === "string") message = body.error;
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

export const deleteListingPhoto = (mediaId: string) =>
  authed<void>(`/api/providers/me/listing/media/${mediaId}`, { method: "DELETE" });

export function getMyBookings(params: { status?: BookingStatus; when?: "upcoming" | "past" } = {}) {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.when) qs.set("when", params.when);
  const query = qs.toString();
  return authed<ProviderBooking[]>(`/api/providers/me/bookings${query ? `?${query}` : ""}`);
}

export const updateBookingStatus = (id: string, status: "Confirmed" | "Cancelled") =>
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

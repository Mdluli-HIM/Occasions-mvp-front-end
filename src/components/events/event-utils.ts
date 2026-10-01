import type { Booking } from "@/lib/api";
import { EventApiError } from "@/lib/event-api";
import { useAuthStore } from "@/lib/auth-store";

export function todayInSouthAfrica(): string {
  const parts = new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.valueOf()) && date.getUTCFullYear() === year
    && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}

export function formatEventDate(value: string): string {
  if (!isCalendarDate(value)) return value;
  return new Intl.DateTimeFormat("en-ZA", {
    timeZone: "Africa/Johannesburg", day: "numeric", month: "long", year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`));
}

export function bookingService(booking: Booking): string {
  return booking.serviceSlug || booking.provider.serviceSlug;
}

export function bookingStatusLabel(status: string): string {
  return status === "Pending" ? "Requested" : status;
}

export function eventRequestError(error: unknown, fallback: string): string {
  if (error instanceof EventApiError && error.status === 401) useAuthStore.getState().logout();
  return error instanceof Error ? error.message : fallback;
}

export function isCancelledRequest(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function browseEventLink(eventId: string, area: string, services: string[]): string {
  return `/search?${new URLSearchParams({ area, services: services.join(","), eventId })}`;
}

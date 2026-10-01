import type { Booking } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type EventSummary = {
  id: string;
  title: string;
  eventType: string;
  customEventType: string;
  area: string;
  eventDate: string;
  startTime: string;
  guests: number;
  notes: string;
};

export type EventInput = Omit<EventSummary, "id"> & {
  serviceSlugs: string[];
  otherService: string;
};

export type EventProgress = {
  needed: number;
  reserved: number;
  confirmed: number;
  completed: number;
  allReserved: boolean;
  allConfirmed: boolean;
  eventCompleted: boolean;
};

export type EventBrief = EventSummary & {
  serviceSlugs: string[];
  otherService: string;
  createdAt: string;
  updatedAt: string;
  bookings: Booking[];
  progress: EventProgress;
};

export class EventApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "EventApiError";
  }
}

async function eventRequest<T>(endpoint: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}/api/events${endpoint}`, {
    ...options,
    cache: "no-store",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const error = body?.error;
    const firstField = error?.fieldErrors
      ? Object.values(error.fieldErrors).flat().find((message) => typeof message === "string")
      : undefined;
    const message = typeof error === "string" ? error
      : typeof firstField === "string" ? firstField
      : response.status === 401 ? "Please log in again to manage your events."
      : response.status === 404 ? "This event could not be found."
      : "Could not save or load your event. Please try again.";
    throw new EventApiError(response.status, message);
  }
  return response.json();
}

export function getEvents(token: string, signal?: AbortSignal): Promise<EventBrief[]> {
  return eventRequest("", token, { signal });
}

export function getEvent(id: string, token: string, signal?: AbortSignal): Promise<EventBrief> {
  return eventRequest(`/${encodeURIComponent(id)}`, token, { signal });
}

export function createEvent(data: EventInput, token: string): Promise<EventBrief> {
  return eventRequest("", token, { method: "POST", body: JSON.stringify(data) });
}

export function updateEvent(id: string, data: EventInput, token: string): Promise<EventBrief> {
  return eventRequest(`/${encodeURIComponent(id)}`, token, { method: "PUT", body: JSON.stringify(data) });
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { bookingPricingDescription } from "@/lib/pricing";
import { clsx } from "clsx";
import { useAuthStore } from "@/lib/auth-store";
import { useAuthHydrated } from "@/lib/use-auth-hydrated";
import { getEventTypeLabel } from "@/lib/event-types";
import { CalendarDays, Mail, MessageCircle, Phone, Users } from "lucide-react";
import {
  ApiError,
  getMyBookings,
  updateBookingStatus,
  type BookingStatus,
  type ProviderBooking,
} from "@/lib/provider-api";

type Tab = "all" | BookingStatus;

const TABS: { key: Tab; label: string }[] = [
  { key: "Pending", label: "Pending" },
  { key: "Confirmed", label: "Confirmed" },
  { key: "Cancelled", label: "Cancelled" },
  { key: "Completed", label: "Completed" },
  { key: "all", label: "All" },
];

const STATUS_STYLES: Record<BookingStatus, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Confirmed: "bg-green-100 text-green-800",
  Cancelled: "bg-black/5 text-black/55",
  Completed: "bg-blue-100 text-blue-800",
};

const rand = (n: number) => `R${n.toLocaleString("en-ZA")}`;

function formatDate(eventDate: string) {
  const d = new Date(`${eventDate}T00:00:00`);
  return isNaN(d.getTime())
    ? eventDate
    : d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

// SA numbers like 082 123 4567 -> 27821234567 for wa.me links.
function whatsappLink(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const intl = digits.startsWith("0") ? `27${digits.slice(1)}` : digits;
  return /^27\d{9}$/.test(intl) ? `https://wa.me/${intl}` : null;
}

export default function BookingsPage() {
  const { token, user } = useAuthStore();
  const hydrated = useAuthHydrated();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; bookings?: ProviderBooking[]; error?: string; noListing?: boolean } | null>(null);
  const [tab, setTab] = useState<Tab>("Pending");
  const [mutationError, setMutationError] = useState<{ key: string; message: string } | null>(null);
  const [busyState, setBusyState] = useState<{ key: string; id: string } | null>(null);
  const key = JSON.stringify([token, user?.id, attempt]);
  const current = hydrated && token && user && result?.key === key ? result : null;
  const bookings = current?.bookings ?? null;
  const noListing = current?.noListing ?? false;
  const error = current?.error || (mutationError?.key === key ? mutationError.message : "");
  const busyId = busyState?.key === key ? busyState.id : null;

  useEffect(() => {
    if (!hydrated || !token || !user) return;
    const controller = new AbortController();
    let ignore = false;
    const currentAuth = () => !ignore && !controller.signal.aborted && useAuthStore.getState().token === token && useAuthStore.getState().user?.id === user.id;
    getMyBookings({}, controller.signal).then((loaded) => { if (currentAuth()) setResult({ key, bookings: loaded }); }).catch((error) => {
      if (!currentAuth()) return;
      if (error instanceof ApiError && error.status === 404) setResult({ key, noListing: true });
      else setResult({ key, error: error instanceof ApiError ? error.message : "Could not load bookings. Please try again." });
    });
    return () => { ignore = true; controller.abort(); };
  }, [hydrated, token, user, key]);

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());

  const counts = useMemo(() => {
    const c: Record<Tab, number> = { all: 0, Pending: 0, Confirmed: 0, Cancelled: 0, Completed: 0 };
    for (const b of bookings ?? []) {
      c.all++;
      c[b.status]++;
    }
    return c;
  }, [bookings]);

  const visible = useMemo(
    () => (bookings ?? []).filter((b) => tab === "all" || b.status === tab),
    [bookings, tab]
  );

  async function changeStatus(booking: ProviderBooking, status: "Confirmed" | "Cancelled" | "Completed") {
    if (busyId || !token || !user) return;
    if (status === "Cancelled") {
      const verb = booking.status === "Pending" ? "Decline" : "Cancel";
      if (!window.confirm(`${verb} the booking from ${booking.guestName}? This can't be undone.`)) return;
    }
    if (status === "Completed" && !window.confirm(`Mark the service for ${booking.guestName} as completed?`)) return;
    setBusyState({ key, id: booking.id });
    setMutationError({ key, message: "" });
    const currentAuth = () => useAuthStore.getState().token === token && useAuthStore.getState().user?.id === user.id;
    try {
      const updated = await updateBookingStatus(booking.id, status);
      if (!currentAuth()) return;
      setResult((previous) => previous?.key === key ? { ...previous, bookings: previous.bookings?.map((item) => item.id === booking.id ? { ...item, status: updated.status } : item) } : previous);
    } catch (error) {
      if (currentAuth()) setMutationError({ key, message: error instanceof ApiError ? error.message : "Could not update the booking. Please try again." });
    } finally {
      if (currentAuth()) setBusyState(null);
    }
  }

  if (noListing) {
    return (
      <div className="py-20 text-center">
        <h1 className="mb-3 text-3xl font-bold text-ink">Bookings</h1>
        <p className="mb-6 text-black/60">Create a listing first, then customers can book you.</p>
        <Link
          href="/provider/listings/new"
          className="inline-block rounded-full bg-coral px-6 py-3 font-semibold text-white hover:bg-coral-hover transition-colors"
        >
          Create listing
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-8 text-3xl font-bold text-ink">Bookings</h1>

      <div className="mb-8 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={clsx(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              tab === t.key
                ? "border-ink bg-ink text-white"
                : "border-black/15 bg-white text-ink hover:border-ink"
            )}
          >
            {t.label} {bookings && <span className="opacity-60">{counts[t.key]}</span>}
          </button>
        ))}
      </div>

      {error && <div className="mb-6 rounded-xl bg-coral-soft px-4 py-3 text-sm text-coral"><p role="alert">{error}</p>{!bookings && <button type="button" className="mt-2 font-semibold" onClick={() => setAttempt((n) => n + 1)}>Try again</button>}</div>}

      {!bookings && !error ? (
        <p className="text-black/50">Loading bookings…</p>
      ) : !bookings ? null : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-black/20 bg-white px-4 py-14 text-center text-sm text-black/50">
          {tab === "all" ? "No bookings yet." : `No ${tab.toLowerCase()} bookings.`}
        </p>
      ) : (
        <div className="space-y-4">
          {visible.map((b) => {
            const isPast = b.eventDate < today;
            const wa = whatsappLink(b.guestPhone);
            const busy = busyId === b.id;
            return (
              <div key={b.id} className="rounded-2xl border border-black/10 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-ink">{b.package.title}</h2>
                    <p className="mt-0.5 text-sm text-black/55">
                      {b.guestName} · {rand(b.totalPrice)}
                    </p>
                  </div>
                  <span className={clsx("shrink-0 rounded-full px-3 py-1 text-xs font-semibold", STATUS_STYLES[b.status])}>
                    {b.status}
                  </span>
                </div>

                <p className="mt-3 text-sm text-ink/70">{bookingPricingDescription(b)}</p>
                {b.event && <div className="mt-4 rounded-xl bg-coral-soft p-4 text-sm text-ink space-y-1"><p className="font-semibold">Event: {b.event.title}</p><p>{getEventTypeLabel(b.event.eventType, b.event.customEventType)} · {b.event.area}</p><p>{formatDate(b.event.eventDate)} · {b.event.startTime} · {b.event.guests} guests</p>{b.event.notes && <p className="whitespace-pre-wrap text-ink/70">{b.event.notes}</p>}</div>}
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink">
                  <span className="flex items-center gap-2">
                    <CalendarDays size={16} className="text-black/40" />
                    {formatDate(b.eventDate)} · {b.startTime}
                    {isPast && <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-black/55">Past</span>}
                  </span>
                  <span className="flex items-center gap-2">
                    <Users size={16} className="text-black/40" />
                    {b.guests} event {b.guests === 1 ? "attendee" : "attendees"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  <a href={`tel:${b.guestPhone}`} className="flex items-center gap-1.5 text-black/60 hover:text-coral">
                    <Phone size={14} /> {b.guestPhone}
                  </a>
                  {wa && (
                    <a href={wa} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-black/60 hover:text-coral">
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  )}
                  <a href={`mailto:${b.guestEmail}`} className="flex items-center gap-1.5 text-black/60 hover:text-coral">
                    <Mail size={14} /> {b.guestEmail}
                  </a>
                </div>

                {(b.status === "Pending" || b.status === "Confirmed") && (
                  <div className="mt-5 flex gap-3">
                    {b.status === "Pending" && (
                      <button
                        onClick={() => changeStatus(b, "Confirmed")}
                        disabled={busyId !== null}
                        className="rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-hover transition-colors disabled:opacity-50"
                      >
                        {busy ? "Saving…" : "Confirm"}
                      </button>
                    )}
                    {b.status === "Confirmed" && b.eventDate <= today && <button onClick={() => changeStatus(b, "Completed")} disabled={busyId !== null} className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-black/80 disabled:opacity-50">{busy ? "Saving…" : "Mark completed"}</button>}
                    <button
                      onClick={() => changeStatus(b, "Cancelled")}
                      disabled={busyId !== null}
                      className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-medium text-ink hover:border-ink transition-colors disabled:opacity-50"
                    >
                      {b.status === "Pending" ? "Decline" : "Cancel booking"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

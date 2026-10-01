"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { bookingPricingDescription } from "@/lib/pricing";
import { useRouter } from "next/navigation";
import {
  BookingAccessError,
  fetchBooking,
  fetchCheckoutBookings,
  type Booking,
} from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { useAuthHydrated } from "@/lib/use-auth-hydrated";
import { formatTime12h } from "@/lib/time-slots";

type PageProps = { kind: "booking" | "checkout"; id: string };
type LoadResult =
  | { requestKey: string; status: "ready"; bookings: Booking[] }
  | { requestKey: string; status: "not-found" }
  | { requestKey: string; status: "error"; message: string; network: boolean };

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Confirmed: "bg-green-100 text-green-800",
  Cancelled: "bg-black/5 text-black/55",
  Completed: "bg-blue-100 text-blue-800",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
        STATUS_STYLES[status] ?? "bg-coral-soft text-coral"
      }`}
    >
      {status}
    </span>
  );
}

function bookingCopy(booking: Booking) {
  switch (booking.status) {
    case "Pending":
      return {
        title: "Booking request sent",
        description: `${booking.provider.name} will confirm your booking shortly.`,
      };
    case "Confirmed":
      return {
        title: "Booking confirmed",
        description: `${booking.provider.name} has confirmed your booking.`,
      };
    case "Completed":
      return { title: "Booking completed", description: `${booking.provider.name} has marked this service as completed.` };
    case "Cancelled":
      return {
        title: "Booking cancelled",
        description: "This booking has been cancelled.",
      };
    default:
      return {
        title: "Booking details",
        description: "Your current booking details are shown below.",
      };
  }
}

function formatPrice(value: number) {
  return `R ${value.toLocaleString("en-ZA")} ZAR`;
}

export default function CustomerBookingPage({ kind, id }: PageProps) {
  const router = useRouter();
  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.user?.id ?? null);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<LoadResult | null>(null);
  const returnPath = `/${kind === "booking" ? "bookings" : "checkout"}/${encodeURIComponent(id)}`;
  const requestKey = JSON.stringify([kind, id, token, userId, attempt]);

  useEffect(() => {
    if (!hydrated || (token && userId)) return;
    const redirect = returnPath + window.location.search + window.location.hash;
    router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
  }, [hydrated, token, userId, returnPath, router]);

  useEffect(() => {
    if (!hydrated || !token || !userId) return;

    const controller = new AbortController();
    let ignore = false;
    const isCurrent = () => {
      const auth = useAuthStore.getState();
      return (
        !ignore &&
        !controller.signal.aborted &&
        auth.token === token &&
        auth.user?.id === userId
      );
    };

    async function loadBookings() {
      try {
        const bookings =
          kind === "booking"
            ? await fetchBooking(id, token!, controller.signal).then((booking) =>
                booking ? [booking] : []
              )
            : await fetchCheckoutBookings(id, token!, controller.signal);
        if (!isCurrent()) return;
        setResult(
          bookings.length
            ? { requestKey, status: "ready", bookings }
            : { requestKey, status: "not-found" }
        );
      } catch (error) {
        if (!isCurrent()) return;
        if (error instanceof BookingAccessError && error.status === 401) {
          useAuthStore.getState().logout();
          const redirect = returnPath + window.location.search + window.location.hash;
          router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
          return;
        }
        if (error instanceof BookingAccessError && error.status === 404) {
          setResult({ requestKey, status: "not-found" });
          return;
        }
        setResult({
          requestKey,
          status: "error",
          network: error instanceof TypeError,
          message:
            error instanceof BookingAccessError
              ? error.message
              : "We couldn't load your booking details. Check your connection and try again.",
        });
      }
    }

    void loadBookings();
    return () => {
      ignore = true;
      controller.abort();
    };
  }, [hydrated, token, userId, kind, id, requestKey, returnPath, router]);

  // Never render a previous account's or route's data while a new request starts.
  const current = hydrated && token && userId && result?.requestKey === requestKey
    ? result
    : null;

  if (!current) {
    return (
      <main className="max-w-lg mx-auto px-6 py-10" aria-busy="true">
        <div className="rounded-2xl border border-black/10 bg-white p-6 space-y-2" role="status">
          <h1 className="text-xl font-bold text-ink">
            {hydrated && (!token || !userId) ? "Taking you to log in…" : "Loading your booking…"}
          </h1>
          <p className="text-ink/60 text-sm">Your booking details will appear here.</p>
        </div>
      </main>
    );
  }

  if (current.status !== "ready") {
    const notFound = current.status === "not-found";
    return (
      <main className="max-w-lg mx-auto px-6 py-10">
        <div className="rounded-2xl border border-black/10 bg-white p-6 space-y-4">
          <h1 className="text-xl font-bold text-ink">
            {notFound ? "Booking not found" : current.network ? "Connection problem" : "Could not load your booking"}
          </h1>
          <p className="text-ink/70 text-sm" role={notFound ? "status" : "alert"}>
            {notFound
              ? "These booking details aren't available for this account. Sign in with the account that placed the booking."
              : current.message}
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setAttempt((value) => value + 1)}
              className="rounded-full bg-coral px-5 py-2.5 text-sm font-medium text-white hover:bg-coral-hover transition-colors"
            >
              Try again
            </button>
            <Link href="/profile" className="text-sm font-medium text-coral">
              Your bookings
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { bookings } = current;
  const booking = bookings[0];
  const total = bookings.reduce((sum, item) => sum + item.totalPrice, 0);
  const singleCopy = bookingCopy(booking);
  const uniformStatus = bookings.every((item) => item.status === booking.status)
    ? booking.status
    : null;
  const serviceCount = `${bookings.length} service${bookings.length === 1 ? "" : "s"}`;

  return (
    <main className="max-w-lg mx-auto px-6 py-10 space-y-6">
      {kind === "booking" ? (
        <div className="rounded-2xl border border-black/10 bg-white p-6 space-y-4">
          <StatusBadge status={booking.status} />
          <h1 className="text-xl font-bold text-ink">{singleCopy.title}</h1>
          <p className="text-ink/70 text-sm">{singleCopy.description}</p>
          {booking.event && <Link href={`/events/${encodeURIComponent(booking.event.id)}`} className="inline-block text-sm font-medium text-coral">View event: {booking.event.title}</Link>}
          <dl className="border-t border-black/10 pt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">Package</dt>
              <dd className="text-ink font-medium text-right">{booking.package.title}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">Date</dt>
              <dd className="text-ink">{booking.eventDate}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">Time</dt>
              <dd className="text-ink">{formatTime12h(booking.startTime)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/60">Event attendees</dt>
              <dd className="text-ink">{booking.guests}</dd>
            </div>
            <div className="flex justify-between gap-4"><dt className="text-ink/60">Pricing</dt><dd className="text-ink text-right">{bookingPricingDescription(booking)}</dd></div>
            <div className="flex justify-between gap-4 font-semibold pt-2 border-t border-black/10 text-ink">
              <dt>Booking total</dt>
              <dd>{formatPrice(booking.totalPrice)}</dd>
            </div>
          </dl>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            <StatusBadge status={uniformStatus ?? "Mixed statuses"} />
            <h1 className="text-xl font-bold text-ink">
              {serviceCount}{uniformStatus === "Pending" ? " requested" : uniformStatus === "Confirmed" ? " confirmed" : uniformStatus === "Cancelled" ? " cancelled" : uniformStatus === "Completed" ? " completed" : " in your checkout"}
            </h1>
            <p className="text-ink/70 text-sm">
              {uniformStatus === "Pending"
                ? "Each provider will confirm their booking shortly."
                : uniformStatus === "Confirmed"
                  ? "Your providers have confirmed these bookings."
                  : uniformStatus === "Completed"
                    ? "Your providers have marked these services as completed."
                  : uniformStatus === "Cancelled"
                    ? "These bookings have been cancelled."
                    : "Check each service below for its current booking status."}
            </p>
          </div>
          <div className="space-y-3">
            {bookings.map((item) => (
              <div key={item.id} className="rounded-2xl border border-black/10 bg-white p-4 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{item.package.title}</p>
                    <p className="text-sm text-ink/60">{item.provider.name}</p>
                  </div>
                  <StatusBadge status={item.status} />
                </div>
                {item.event && <Link href={`/events/${encodeURIComponent(item.event.id)}`} className="inline-block text-sm font-medium text-coral">Event: {item.event.title}</Link>}
                <p className="text-sm text-ink/60">{bookingPricingDescription(item)}</p>
                <p className="text-xs text-ink/60">Event attendees: {item.guests}</p>
                <div className="flex flex-wrap justify-between gap-2 text-sm text-ink/70 pt-1">
                  <span>{item.eventDate} · {formatTime12h(item.startTime)}</span>
                  <span className="font-medium text-ink">{formatPrice(item.totalPrice)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-black/10 bg-white p-5 flex items-center justify-between gap-4 font-semibold text-ink">
            <span>Booking total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </>
      )}
      <p className="text-xs text-ink/50">Booking totals show service values. No payment has been collected through Occasions.</p>
      <Link href="/profile" className="inline-block text-sm font-medium text-coral">
        View your bookings
      </Link>
    </main>
  );
}

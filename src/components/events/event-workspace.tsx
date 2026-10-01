"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, Check, MapPin, Pencil, RefreshCw, ShoppingBag, Users } from "lucide-react";
import { clsx } from "clsx";
import { fetchProviders, type Booking, type Provider } from "@/lib/api";
import { getEvent, type EventBrief } from "@/lib/event-api";
import { getEventTypeLabel } from "@/lib/event-types";
import { getServiceLabel } from "@/lib/taxonomy";
import { locationLabel, sameArea } from "@/lib/locations";
import { useLocationCoverage } from "@/components/locations/use-location-coverage";
import { bookingPricingDescription, formatPackagePrice, normalizePricingType } from "@/lib/pricing";
import { cartItemTotal, useCartStore, type CartItem } from "@/lib/cart-store";
import { useCartHydrated } from "@/lib/use-auth-hydrated";
import { ProviderCard } from "@/components/home/provider-card";
import { EventProgressSummary } from "@/components/events/event-progress";
import { bookingService, bookingStatusLabel, browseEventLink, eventRequestError, formatEventDate, isCancelledRequest } from "@/components/events/event-utils";
import { usePlannerAuth } from "@/components/events/use-planner-auth";

function StatusPill({ status }: { status: string }) {
  return <span className={clsx("inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold", status === "Completed" || status === "Confirmed" ? "bg-green-50 text-green-800" : status === "Pending" ? "bg-amber-50 text-amber-800" : "bg-black/5 text-black/55")}>{status === "Completed" && <Check size={13} />}{bookingStatusLabel(status)}</span>;
}

function EventBookingCard({ booking }: { booking: Booking }) {
  return <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-black/10 bg-offwhite p-4 sm:flex-row"><div className="min-w-0"><Link href={`/bookings/${encodeURIComponent(booking.id)}`} className="text-sm font-semibold text-ink hover:underline">{booking.provider.name} · {booking.package.title}</Link><p className="mt-1 text-xs leading-relaxed text-black/55">{formatEventDate(booking.eventDate)} at {booking.startTime} · {booking.guests.toLocaleString("en-ZA")} {booking.guests === 1 ? "guest" : "guests"}</p><p className="mt-2 text-xs leading-relaxed text-black/55">{bookingPricingDescription(booking)}</p><p className="mt-2 text-sm font-medium text-ink">Booking total R{booking.totalPrice.toLocaleString("en-ZA")}</p></div><div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end"><StatusPill status={booking.status} /><Link href={`/bookings/${encodeURIComponent(booking.id)}`} className="text-xs font-medium underline underline-offset-4">View booking</Link></div></div>;
}

function EventCartCard({ item }: { item: CartItem }) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-coral/15 bg-coral-soft/50 p-4 sm:flex-row">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{item.packageTitle}</p>
        <p className="mt-1 text-sm text-black/55">{item.providerName}</p>
        <p className="mt-2 text-xs leading-relaxed text-black/50">{item.guests.toLocaleString("en-ZA")} {item.guests === 1 ? "guest" : "guests"} · {formatEventDate(item.eventDate)} at {item.startTime}</p>
        <p className="mt-2 text-xs leading-relaxed text-black/55">{formatPackagePrice(item)}{normalizePricingType(item.pricingType) === "per_unit" ? ` · Quantity: ${item.quantity} (${item.unitLabel || "unit"})` : ""}</p>
        <p className="mt-2 text-sm font-medium text-ink">{Number.isFinite(cartItemTotal(item)) ? `Estimated total R${cartItemTotal(item).toLocaleString("en-ZA")}` : "Check the quantity in your cart"}</p>
      </div>
      <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end">
        <span className="text-xs font-medium text-black/50">Not requested yet</span>
        <Link href="/cart" className="text-xs font-semibold text-coral underline underline-offset-4">Review cart</Link>
      </div>
    </div>
  );
}

export function EventWorkspace({ eventId }: { eventId: string }) {
  const { ready, token } = usePlannerAuth();
  const { coverage, isAreaLaunched } = useLocationCoverage();
  const cartHydrated = useCartHydrated();
  const cartItems = useCartStore((state) => state.items);
  const eventCartItems = cartHydrated ? cartItems.filter((item) => item.eventId === eventId) : [];
  const [event, setEvent] = useState<EventBrief | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [providerLoading, setProviderLoading] = useState(true);
  const [error, setError] = useState("");
  const [providerError, setProviderError] = useState("");
  const [retry, setRetry] = useState(0);
  const [providerRetry, setProviderRetry] = useState(0);

  useEffect(() => {
    if (!ready || !token) return;
    const controller = new AbortController();
    getEvent(eventId, token, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setEvent(data); })
      .catch((e) => { if (!controller.signal.aborted && !isCancelledRequest(e)) setError(eventRequestError(e, "Could not load your occasion.")); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [eventId, token, ready, retry]);

  useEffect(() => {
    if (!event || !ready) return;
    const controller = new AbortController();
    fetchProviders({ area: event.area, services: event.serviceSlugs.join(",") }, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setProviders(data); })
      .catch((e) => { if (!controller.signal.aborted && !isCancelledRequest(e)) setProviderError(e instanceof Error ? e.message : "Could not load providers."); })
      .finally(() => { if (!controller.signal.aborted) setProviderLoading(false); });
    return () => controller.abort();
  }, [event, ready, providerRetry]);

  function refreshPlan() {
    setError("");
    setProviderError("");
    setLoading(true);
    setProviderLoading(true);
    setRetry((value) => value + 1);
  }

  if (!ready || loading) return <main className="mx-auto w-full max-w-7xl px-6 py-16"><p role="status" className="text-black/50">Loading your occasion…</p></main>;
  if (error || !event) return <main className="mx-auto w-full max-w-3xl space-y-5 px-6 py-16"><p role="alert" className="rounded-xl bg-coral-soft p-4 text-sm text-coral">{error || "This occasion could not be found."}</p><button onClick={refreshPlan} className="rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-semibold">Try again</button><Link href="/events" className="ml-5 text-sm underline underline-offset-4">Your occasions</Link></main>;

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-6 sm:py-12">
      <Link href="/events" className="inline-flex items-center gap-2 text-sm text-black/55 hover:text-ink"><ArrowLeft size={16} />Your occasions</Link>
      <div className="mb-10 mt-7 flex flex-col items-start justify-between gap-5 md:flex-row md:items-center"><div className="min-w-0"><p className="text-sm font-semibold text-coral">{getEventTypeLabel(event.eventType, event.customEventType)}</p><h1 className="mt-2 break-words text-3xl font-bold tracking-tight text-ink sm:text-4xl">{event.title}</h1><p className="mt-3 text-base text-black/55">Your plan, coming together.</p></div><div className="flex shrink-0 flex-wrap items-center gap-3"><Link href={`/events/${encodeURIComponent(event.id)}/edit`} className="inline-flex items-center gap-2 rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-semibold hover:border-ink"><Pencil size={16} />Edit plan</Link><Link href="/cart" className="inline-flex items-center gap-2 rounded-full bg-coral px-5 py-3 text-sm font-semibold text-white hover:bg-coral-hover"><ShoppingBag size={16} />Your cart</Link></div></div>
      <div className="grid items-start gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="space-y-5 lg:sticky lg:top-6">
          <section className="rounded-2xl border border-black/10 bg-white p-6"><h2 className="text-lg font-semibold text-ink">The details</h2><div className="mt-5 space-y-4 text-sm text-black/60"><p className="flex items-start gap-3"><CalendarDays size={18} className="mt-0.5 shrink-0" /><span>{formatEventDate(event.eventDate)}<span className="mt-1 block text-black/45">{event.startTime} · South Africa time</span></span></p><p className="flex items-start gap-3"><MapPin size={18} className="mt-0.5 shrink-0" />{locationLabel(event.area)}</p><p className="flex items-center gap-3"><Users size={18} className="shrink-0" />{event.guests.toLocaleString("en-ZA")} {event.guests === 1 ? "guest" : "guests"}</p></div>{event.notes && <div className="mt-6 border-t border-black/10 pt-5"><h3 className="text-sm font-semibold text-ink">Venue details and notes</h3><p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-black/55">{event.notes}</p><p className="mt-3 text-xs leading-relaxed text-black/45">Shared only with providers booked for this event.</p></div>}</section>
          <section className="rounded-2xl border border-black/10 bg-white p-6"><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-lg font-semibold text-ink">Booking progress</h2><button onClick={refreshPlan} aria-label="Refresh booking progress" className="rounded-full p-2 text-black/50 hover:bg-offwhite hover:text-ink"><RefreshCw size={16} /></button></div><EventProgressSummary progress={event.progress} /></section>
        </aside>
        <div className="min-w-0 space-y-7">
          <div><h2 className="text-2xl font-semibold text-ink">Services for your occasion</h2><p className="mt-2 text-sm leading-relaxed text-black/55">Explore providers in {locationLabel(event.area)}, choose packages and add them to your cart. Provider confirmation moves your plan forward.</p></div>
          {coverage && !isAreaLaunched(event.area) && <p className="rounded-xl border border-black/10 bg-white p-4 text-sm leading-relaxed text-black/60">This province has not launched yet. Your plan is saved; new bookings here will need to wait for launch and local provider availability.</p>}
          {providerError && <div className="rounded-xl border border-black/10 bg-white p-4"><p role="alert" className="text-sm text-coral">{providerError}</p><button onClick={() => { setProviderError(""); setProviderLoading(true); setProviderRetry((value) => value + 1); }} className="mt-3 text-sm font-semibold underline underline-offset-4">Try loading providers again</button></div>}
          {event.serviceSlugs.map((slug) => {
            const label = getServiceLabel(slug, slug === "other" ? event.otherService : undefined);
            const bookings = event.bookings.filter((booking) => bookingService(booking) === slug);
            const active = bookings.filter((booking) => booking.status !== "Cancelled");
            const selectedPackages = eventCartItems.filter((item) => item.serviceSlug === slug);
            const status = active.length && active.every((booking) => booking.status === "Completed") ? "Completed" : active.some((booking) => booking.status === "Confirmed" || booking.status === "Completed") ? "Confirmed" : active.length ? "Pending" : null;
            const matches = providers.filter((provider) => provider.serviceSlug === slug && provider.areasServed.some((area) => sameArea(area, event.area)));
            return <section key={slug} className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-xl font-semibold text-ink">{label}</h3>{slug === "other" && <p className="mt-1 text-xs text-black/50">Providers listed under Other. Check their service details for a match.</p>}</div>{status ? <StatusPill status={status} /> : selectedPackages.length > 0 ? <span className="inline-flex items-center gap-1 rounded-full bg-coral-soft px-3 py-1 text-xs font-semibold text-coral"><ShoppingBag size={13} />In your cart</span> : <span className="rounded-full bg-coral-soft px-3 py-1 text-xs font-semibold text-coral">Still needed</span>}</div>
              {bookings.length > 0 && <div className="mt-5 space-y-3">{bookings.map((booking) => <EventBookingCard key={booking.id} booking={booking} />)}</div>}
              {selectedPackages.length > 0 && <div className="mt-5 space-y-3"><h4 className="text-sm font-semibold text-black/60">Selected packages</h4>{selectedPackages.map((item) => <EventCartCard key={item.itemId} item={item} />)}<p className="text-xs leading-relaxed text-black/50">Review your cart to request these bookings. Cart selections don’t count towards booking progress; final prices are checked before requesting.</p></div>}
              <div className="mb-4 mt-6 flex flex-wrap items-center justify-between gap-3"><h4 className="text-sm font-semibold text-black/60">{active.length || selectedPackages.length ? "More providers to explore" : "Providers to explore"}</h4><Link href={browseEventLink(event.id, event.area, [slug])} className="inline-flex items-center gap-1 text-xs font-semibold text-coral">Browse all & filter by price<ArrowRight size={14} /></Link></div>
              {providerLoading ? <p role="status" className="rounded-xl bg-offwhite px-4 py-7 text-sm text-black/50">Finding providers for this service…</p> : providerError ? <p className="text-sm text-black/50">You can also browse this service using the link above.</p> : matches.length === 0 ? <p className="rounded-xl bg-offwhite px-4 py-7 text-sm leading-relaxed text-black/50">No providers for this service in {locationLabel(event.area)} yet. You can revisit this plan as more providers join.</p> : <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">{matches.slice(0, 3).map((provider) => <ProviderCard key={provider.id} provider={provider} eventId={event.id} sizes="(min-width: 1024px) 20vw, (min-width: 640px) 28vw, 42vw" />)}</div>}
            </section>;
          })}
          {event.bookings.some((booking) => !event.serviceSlugs.includes(bookingService(booking))) && <section className="rounded-2xl border border-black/10 bg-white p-6"><h3 className="text-xl font-semibold text-ink">Earlier bookings</h3><p className="mt-2 text-sm text-black/55">Booking history for services that are no longer on your plan.</p><div className="mt-5 space-y-3">{event.bookings.filter((booking) => !event.serviceSlugs.includes(bookingService(booking))).map((booking) => <EventBookingCard key={booking.id} booking={booking} />)}</div></section>}
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cartItemTotal, useCartStore, type CartItem } from "@/lib/cart-store";
import { BookingAccessError, checkoutCart, fetchProvider } from "@/lib/api";
import { EventApiError, getEvents, type EventBrief } from "@/lib/event-api";
import { useAuthStore } from "@/lib/auth-store";
import { useAuthHydrated, useCartHydrated } from "@/lib/use-auth-hydrated";
import { billedQuantity, formatPackagePrice, guestCapacityProblem, normalizePricingType } from "@/lib/pricing";
import { sameArea } from "@/lib/locations";
import { Trash2 } from "lucide-react";

type EventResult = { key: string; events?: EventBrief[]; error?: string };
type CatalogResult = { key: string; packages?: Record<string, { areas: string[] }>; changes?: string[]; reviewed?: boolean; error?: string };
const inputClass = "w-full rounded-xl border border-black/15 px-3 py-2 text-sm text-ink outline-none focus:border-coral disabled:bg-black/5";
const todayInSA = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value && value >= todayInSA();
}

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateItem, hasPackage } = useCartStore();
  const { user, token, logout } = useAuthStore();
  const hydrated = useAuthHydrated();
  const cartHydrated = useCartHydrated();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [eventAttempt, setEventAttempt] = useState(0);
  const [catalogAttempt, setCatalogAttempt] = useState(0);
  const [eventResult, setEventResult] = useState<EventResult | null>(null);
  const [catalogResult, setCatalogResult] = useState<CatalogResult | null>(null);
  const eventKey = JSON.stringify([token, user?.id, eventAttempt]);
  const priceKey = JSON.stringify([...new Set(items.map((item) => `${item.providerSlug}/${item.packageId}`))].sort());
  const catalogKey = JSON.stringify([priceKey, catalogAttempt]);
  const eventState = hydrated && token && user && eventResult?.key === eventKey ? eventResult : null;
  const catalogState = catalogResult?.key === catalogKey ? catalogResult : null;
  const events = eventState?.events ?? [];
  const busy = status === "submitting";

  useEffect(() => {
    if (hydrated && (!user || !token)) router.replace("/login?redirect=%2Fcart");
  }, [hydrated, user, token, router]);

  useEffect(() => {
    if (!hydrated || !token || !user) return;
    const controller = new AbortController();
    let ignore = false;
    const currentAuth = () => !ignore && !controller.signal.aborted && useAuthStore.getState().token === token && useAuthStore.getState().user?.id === user.id;
    getEvents(token, controller.signal).then((loaded) => { if (currentAuth()) setEventResult({ key: eventKey, events: loaded }); }).catch((error) => {
      if (!currentAuth()) return;
      if (error instanceof EventApiError && error.status === 401) logout();
      else setEventResult({ key: eventKey, error: error instanceof EventApiError ? error.message : "Couldn't load your saved events. Try again." });
    });
    return () => { ignore = true; controller.abort(); };
  }, [hydrated, token, user, eventKey, logout]);

  useEffect(() => {
    if (!cartHydrated) return;
    const snapshot = useCartStore.getState().items;
    const slugs = [...new Set(snapshot.map((item) => item.providerSlug))];
    const controller = new AbortController();
    let ignore = false;
    Promise.all(slugs.map((slug) => fetchProvider(slug, controller.signal))).then((providers) => {
      if (ignore || controller.signal.aborted) return;
      const available: Record<string, { areas: string[] }> = {};
      const changes: string[] = [];
      for (const provider of providers) {
        if (!provider) continue;
        for (const pkg of provider.packages) {
          available[pkg.id] = { areas: provider.areasServed };
          for (const item of useCartStore.getState().items.filter((saved) => saved.packageId === pkg.id)) {
            const pricingType = normalizePricingType(pkg.pricingType);
            const unitLabel = pkg.unitLabel ?? "";
            const changedBasis = item.pricingType !== pricingType || item.unitLabel !== unitLabel;
            if (changedBasis || item.priceValue !== pkg.priceValue || item.minPriceValue !== pkg.minPriceValue) changes.push(item.packageTitle);
            updateItem(item.itemId, { priceValue: pkg.priceValue, minPriceValue: pkg.minPriceValue, serviceSlug: provider.serviceSlug,
              pricingType, unitLabel, quantity: changedBasis || pricingType !== "per_unit" ? 1 : item.quantity,
              minGuests: pkg.minGuests ?? null, maxGuests: pkg.maxGuests ?? null });
          }
        }
      }
      setCatalogResult((previous) => ({ key: catalogKey, packages: available,
        changes: [...new Set([...changes, ...(previous?.reviewed ? [] : previous?.changes ?? [])])], reviewed: false }));
    }).catch(() => {
      if (!ignore && !controller.signal.aborted) setCatalogResult({ key: catalogKey, error: "Couldn't check current package prices. Please try again before sending your requests." });
    });
    return () => { ignore = true; controller.abort(); };
  }, [cartHydrated, catalogKey, updateItem]);

  function linkedProblem(item: CartItem): string | null {
    if (!item.eventId) return null;
    if (!eventState?.events) return "Load your saved events before sending this linked service.";
    const event = events.find((saved) => saved.id === item.eventId);
    if (!event) return "This event is no longer available for your account. Select another event or make this a standalone service.";
    if (!event.serviceSlugs.includes(item.serviceSlug)) return "This service is no longer selected in the event. Edit your plan or make this service standalone.";
    if (catalogState?.packages && !catalogState.packages[item.packageId]?.areas.some((area) => sameArea(area, event.area))) return "This provider doesn't serve the event area. Choose another provider or make this service standalone.";
    if (event.eventDate !== item.eventDate || event.guests !== item.guests) return "Your event date or guest count changed. Apply the latest plan details below.";
    return null;
  }

  function pricingProblem(item: CartItem): string | null {
    const capacity = guestCapacityProblem(item, item.guests);
    if (capacity) return capacity;
    if (item.pricingType === "per_unit" && (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10000)) return "Choose 1–10,000 units for this package.";
    if (!Number.isFinite(cartItemTotal(item))) return "This service total is too large. Reduce the guest count or quantity.";
    return null;
  }

  function chooseEvent(item: CartItem, eventId: string) {
    const nextId = eventId || null;
    if (nextId !== item.eventId && hasPackage(item.packageId, nextId)) { setErrorMsg("This package is already in the cart for that event. Keep one package per event."); return; }
    const event = events.find((saved) => saved.id === nextId);
    updateItem(item.itemId, event ? { eventId: event.id, eventTitle: event.title, eventDate: event.eventDate, startTime: event.startTime, guests: event.guests } : { eventId: null, eventTitle: "" });
    setErrorMsg("");
  }

  async function handleCheckout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token || !user || busy) return;
    if (!catalogState?.packages) { setErrorMsg("Wait for current package prices to load, then try again."); return; }
    if (catalogState.changes?.length && !catalogState.reviewed) { setErrorMsg("Review and accept the updated package prices before sending requests."); return; }
    if (items.length === 0 || items.length > 50) { setErrorMsg("Send between 1 and 50 service requests at a time."); return; }
    for (const item of items) {
      const problem = linkedProblem(item) || pricingProblem(item);
      if (problem) { setErrorMsg(problem); return; }
      if (!catalogState.packages[item.packageId]) { setErrorMsg("Remove unavailable packages before sending your requests."); return; }
      if (!validDate(item.eventDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.startTime) || !Number.isInteger(item.guests) || item.guests < 1 || item.guests > 10000) { setErrorMsg("Choose a valid date from today onwards, a time and 1–10,000 guests for every service."); return; }
    }
    const form = new FormData(e.currentTarget);
    const submittedItems = [...items];
    setStatus("submitting"); setErrorMsg("");
    try {
      const { checkoutId } = await checkoutCart({ token, guestName: String(form.get("name")), guestEmail: String(form.get("email")), guestPhone: String(form.get("phone")), items: submittedItems.map((item) => ({ packageId: item.packageId, eventId: item.eventId, guests: item.guests, eventDate: item.eventDate, startTime: item.startTime,
        quantity: billedQuantity(item.pricingType, item.guests, item.quantity), expectedPricingType: item.pricingType,
        expectedUnitLabel: item.unitLabel, expectedUnitPrice: item.priceValue, expectedMinimumCharge: item.minPriceValue })) });
      if (useAuthStore.getState().token !== token || useAuthStore.getState().user?.id !== user.id) return;
      submittedItems.forEach((item) => removeItem(item.itemId));
      router.push(`/checkout/${encodeURIComponent(checkoutId)}`);
    } catch (error) {
      if (useAuthStore.getState().token !== token || useAuthStore.getState().user?.id !== user.id) return;
      if (error instanceof BookingAccessError && error.status === 401) logout();
      else { setStatus("error"); setErrorMsg(error instanceof Error ? error.message : "Couldn't send your booking requests. Please try again.");
        if (error instanceof BookingAccessError && error.status === 409) setCatalogAttempt((n) => n + 1);
      }
    }
  }

  if (!hydrated || !cartHydrated || !user || !token) return <main className="max-w-2xl mx-auto px-6 py-10"><p role="status" className="text-ink/60">Loading your cart…</p></main>;
  if (items.length === 0) return <main className="max-w-2xl mx-auto px-6 py-16 text-center space-y-4"><h1 className="text-xl font-bold text-ink">Your cart is empty</h1><p className="text-ink/60">Plan an event or browse providers to choose your services.</p><div className="flex justify-center gap-4"><Link href="/events" className="rounded-full bg-coral px-5 py-3 text-white font-medium">Your events</Link><Link href="/search" className="rounded-full border border-black/15 px-5 py-3 font-medium text-ink">Browse providers</Link></div></main>;
  const total = items.reduce((sum, item) => sum + cartItemTotal(item), 0);

  return (
    <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <div className="flex items-center justify-between gap-4"><h1 className="text-2xl font-bold text-ink">Your cart</h1><div className="flex gap-3"><button type="button" disabled={busy} onClick={() => setEventAttempt((n) => n + 1)} className="text-sm font-medium text-coral">Refresh events</button><Link href="/events" className="text-sm font-medium text-coral">Your events</Link></div></div>
      <p className="text-ink/60 text-sm">Link services to a saved event, or schedule them individually. Sending a request asks each provider to confirm availability. No payment is collected.</p>
      {eventState?.error && <div className="rounded-xl bg-coral-soft p-4 text-sm text-ink"><p role="alert">{eventState.error}</p><button type="button" className="mt-2 font-medium text-coral" onClick={() => setEventAttempt((n) => n + 1)}>Reload events</button></div>}
      {catalogState?.error ? <div className="rounded-xl bg-coral-soft p-4 text-sm text-ink"><p role="alert">{catalogState.error}</p><button type="button" className="mt-2 font-medium text-coral" onClick={() => setCatalogAttempt((n) => n + 1)}>Check prices again</button></div> : !catalogState?.packages && <p role="status" className="text-sm text-ink/60">Checking current packages and prices…</p>}
      {!!catalogState?.changes?.length && !catalogState.reviewed && <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><p role="alert">Pricing changed for {catalogState.changes.join(", ")}. Review the rates and quantities below.</p><button type="button" disabled={busy} className="mt-2 font-semibold underline" onClick={() => setCatalogResult((previous) => previous?.key === catalogKey ? { ...previous, reviewed: true } : previous)}>Use updated prices</button></div>}
      <div className="space-y-4">
        {items.map((item) => {
          const event = events.find((saved) => saved.id === item.eventId);
          const problem = linkedProblem(item) || pricingProblem(item);
          const unavailable = !!catalogState?.packages && !catalogState.packages[item.packageId];
          const eligibleEvents = events.filter((saved) => saved.serviceSlugs.includes(item.serviceSlug) && (!catalogState?.packages || catalogState.packages[item.packageId]?.areas.some((area) => sameArea(area, saved.area))));
          return <div key={item.itemId} className="rounded-2xl border border-black/10 bg-white p-4 space-y-4">
            <div className="flex gap-3"><div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black/5">{item.photoUrl && <Image src={item.photoUrl} alt={item.packageTitle} fill className="object-cover" unoptimized={item.photoUrl.startsWith("http")} />}</div><div className="flex-1 min-w-0"><p className="font-medium text-ink">{item.packageTitle}</p><p className="text-sm text-ink/60">{item.providerName}</p><p className="text-sm text-ink">{formatPackagePrice(item)}{item.pricingType === "per_guest" && item.minPriceValue > 0 && ` · minimum R ${item.minPriceValue.toLocaleString("en-ZA")}`}</p></div><button type="button" disabled={busy} onClick={() => removeItem(item.itemId)} className="self-start text-ink/40 hover:text-red-600" aria-label={`Remove ${item.packageTitle}`}><Trash2 size={16} /></button></div>
            <label className="block text-sm text-ink/60">Event<select value={item.eventId ?? ""} disabled={busy || !eventState?.events || !catalogState?.packages} onChange={(e) => chooseEvent(item, e.target.value)} className={`${inputClass} mt-1`}><option value="">Standalone service</option>{item.eventId && !eligibleEvents.some((saved) => saved.id === item.eventId) && <option value={item.eventId}>{event ? event.title : "Unavailable event"}</option>}{eligibleEvents.map((saved) => <option key={saved.id} value={saved.id}>{saved.title}</option>)}</select></label>
            {event && <p className="text-xs text-ink/60"><Link href={`/events/${encodeURIComponent(event.id)}`} className="font-medium text-coral">{event.title}</Link> · {event.area}. Date and guests follow your plan; setup time can differ.</p>}
            {problem && <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><p role="alert">{problem}</p>{event && event.serviceSlugs.includes(item.serviceSlug) && (item.eventDate !== event.eventDate || item.guests !== event.guests) && <button type="button" disabled={busy} className="mt-2 font-semibold" onClick={() => updateItem(item.itemId, { eventDate: event.eventDate, guests: event.guests, eventTitle: event.title })}>Apply latest plan details</button>}</div>}
            {unavailable && <p role="alert" className="text-sm text-red-600">This package is no longer available. Remove it and choose another service.</p>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="text-xs text-ink/60">Date<input type="date" min={todayInSA()} value={item.eventDate} disabled={busy || !!item.eventId} onChange={(e) => updateItem(item.itemId, { eventDate: e.target.value })} className={`${inputClass} mt-1`} /></label>
              <label className="text-xs text-ink/60">Time<input type="time" value={item.startTime} disabled={busy} onChange={(e) => updateItem(item.itemId, { startTime: e.target.value })} className={`${inputClass} mt-1`} /></label>
              <label className="text-xs text-ink/60">Event attendees<input type="number" min={1} max={10000} step={1} value={item.guests} disabled={busy || !!item.eventId} onChange={(e) => updateItem(item.itemId, { guests: Number(e.target.value) })} className={`${inputClass} mt-1`} /></label>
            </div>
            {item.pricingType === "per_unit" ? <label className="block text-sm text-ink/60">Quantity ({item.unitLabel || "unit"})<input type="number" min={1} max={10000} step={1} value={item.quantity} disabled={busy} onChange={(e) => updateItem(item.itemId, { quantity: Number(e.target.value) })} className={`${inputClass} mt-1`} /><span className="mt-1 block text-xs">Price × quantity. Event attendance is separate.</span></label> : <p className="text-xs text-ink/60">{item.pricingType === "fixed" ? "One package at the listed price. Attendance does not multiply the price." : "Price × event attendees, subject to the package minimum charge."}</p>}
            <p className="text-right font-medium text-ink">Service total: {Number.isFinite(cartItemTotal(item)) ? `R ${cartItemTotal(item).toLocaleString("en-ZA")} ZAR` : "Check quantity"}</p>
          </div>;
        })}
      </div>
      <form onSubmit={handleCheckout} className="space-y-4">
        <div className="rounded-2xl border border-black/10 bg-white p-5 space-y-4"><h2 className="font-semibold text-ink">Your contact details</h2><label className="block text-sm font-medium text-ink">Name<input name="name" required maxLength={120} defaultValue={user.name} disabled={busy} className={`${inputClass} mt-1`} /></label><label className="block text-sm font-medium text-ink">Email<input type="email" name="email" required defaultValue={user.email} disabled={busy} className={`${inputClass} mt-1`} /></label><label className="block text-sm font-medium text-ink">Phone<input type="tel" name="phone" required defaultValue={user.phone} disabled={busy} className={`${inputClass} mt-1`} /></label></div>
        <div className="rounded-2xl border border-black/10 bg-white p-5 flex justify-between gap-4"><p className="font-medium text-ink">Booking total ({items.length} services)</p><p className="font-semibold text-ink">{Number.isFinite(total) ? `R ${total.toLocaleString("en-ZA")} ZAR` : "Check quantities"}</p></div>
        {errorMsg && <p role="alert" className="text-sm text-red-600">{errorMsg}</p>}
        <button type="submit" disabled={busy || !catalogState?.packages || (!!catalogState.changes?.length && !catalogState.reviewed) || items.some((item) => linkedProblem(item) || pricingProblem(item) || !catalogState.packages?.[item.packageId])} className="w-full rounded-full bg-coral py-3 font-medium text-white hover:bg-coral-hover disabled:opacity-60">{busy ? "Sending requests…" : "Send booking requests"}</button>
        <p className="text-xs text-ink/50 text-center">Providers confirm each request separately. This is the service value; no payment is collected here.</p>
      </form>
    </main>
  );
}

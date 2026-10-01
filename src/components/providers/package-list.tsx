"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Package, Provider } from "@/lib/api";
import { EventApiError, getEvent, type EventBrief } from "@/lib/event-api";
import { useAuthStore } from "@/lib/auth-store";
import { cartItemId, useCartStore } from "@/lib/cart-store";
import { calculatePackageTotal, formatPackagePrice, guestCapacityProblem, normalizePricingType } from "@/lib/pricing";
import { useAuthHydrated, useCartHydrated } from "@/lib/use-auth-hydrated";
import { locationLabel, sameArea } from "@/lib/locations";
import { Check, Plus } from "lucide-react";

type EventResult = { key: string; event: EventBrief; error?: never } | { key: string; event?: never; error: string };

export function PackageList({ provider, packages, eventId, detail = false }: { provider: Provider; packages: Package[]; eventId?: string; detail?: boolean }) {
  const { items, addItem, removeItem, hasPackage } = useCartStore();
  const { token, user } = useAuthStore();
  const hydrated = useAuthHydrated();
  const cartHydrated = useCartHydrated();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<EventResult | null>(null);
  const key = JSON.stringify([eventId, token, user?.id, attempt]);
  const current = result?.key === key ? result : null;
  const event = current?.event;
  const fitsEvent = !!event && event.serviceSlugs.includes(provider.serviceSlug) && provider.areasServed.some((area) => sameArea(area, event.area));
  const providerPath = `/providers/${encodeURIComponent(provider.slug)}`;
  const packagePath = (id: string) => `${providerPath}/packages/${encodeURIComponent(id)}${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ""}`;
  const returnPath = detail && packages[0] ? packagePath(packages[0].id) : `${providerPath}${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ""}`;
  const loginPath = `/login?redirect=${encodeURIComponent(returnPath)}`;

  useEffect(() => {
    if (!eventId || !hydrated || !token || !user) return;
    const controller = new AbortController();
    let ignore = false;
    const currentAuth = () => !ignore && !controller.signal.aborted && useAuthStore.getState().token === token && useAuthStore.getState().user?.id === user.id;
    getEvent(eventId, token, controller.signal).then((loaded) => {
      if (currentAuth()) setResult({ key, event: loaded });
    }).catch((error) => {
      if (!currentAuth()) return;
      if (error instanceof EventApiError && error.status === 401) useAuthStore.getState().logout();
      else setResult({ key, error: error instanceof EventApiError ? error.message : "Couldn't load your event. Check your connection and try again." });
    });
    return () => { ignore = true; controller.abort(); };
  }, [eventId, hydrated, token, user, key]);

  if (packages.length === 0) return <p className="text-ink/60">No packages listed yet.</p>;

  return (
    <div className="space-y-3">
      {eventId && (
        <div className="rounded-2xl bg-coral-soft p-4 text-sm text-ink space-y-2">
          {!hydrated ? <p>Loading your event…</p> : !token || !user ? <p><Link href={loginPath} className="font-medium text-coral">Log in</Link> to choose services for this event.</p> : current?.error ? <><p role="alert">{current.error}</p><button type="button" className="font-medium text-coral" onClick={() => setAttempt((n) => n + 1)}>Try again</button></> : !event ? <p>Loading your event…</p> : <>
            <p className="font-semibold">Choosing for {event.title}</p>
            <p>{event.eventDate} · {event.startTime} · {event.guests} guests · {locationLabel(event.area)}</p>
            {!fitsEvent && <p>This provider must serve your event area and its service must be selected in your plan before adding a package.</p>}
            <div className="flex gap-4"><Link href={`/events/${encodeURIComponent(event.id)}`} className="font-medium text-coral">Back to event</Link>{!fitsEvent && <Link href={`/events/${encodeURIComponent(event.id)}/edit`} className="font-medium text-coral">Edit plan</Link>}</div>
          </>}
        </div>
      )}
      {packages.map((pkg) => {
        const inCart = hasPackage(pkg.id, eventId ?? null);
        const pricingType = normalizePricingType(pkg.pricingType);
        const capacityProblem = event ? guestCapacityProblem(pkg, event.guests) : null;
        const outsideCapacity = !!capacityProblem;
        const quantity = items.find((item) => item.itemId === cartItemId(pkg.id, eventId ?? null))?.quantity ?? 1;
        const estimatedTotal = event ? calculatePackageTotal(pkg, event.guests, quantity) : null;
        const disabled = !cartHydrated || (!inCart && ((!!eventId && (!fitsEvent || outsideCapacity)) || items.length >= 50));
        const price = formatPackagePrice(pkg);
        return (
          <div key={pkg.id} className={detail ? "space-y-4" : "flex flex-wrap sm:flex-nowrap gap-4 rounded-2xl border border-black/10 bg-white p-4"}>
            {detail ? (
              <div className="space-y-2">
                <p className="text-2xl font-semibold text-ink">{price}</p>
                <p className="text-sm leading-relaxed text-ink/60">
                  {pricingType === "fixed" ? "One package price for your event." : pricingType === "per_unit" ? `Choose a quantity in your cart. Each ${pkg.unitLabel || "unit"} is priced separately.` : "Your total uses the number of guests attending your event."}
                </p>
                {event && fitsEvent && !outsideCapacity && estimatedTotal != null && Number.isFinite(estimatedTotal) && <p className="text-sm text-ink">{pricingType === "per_unit" ? `Estimated total for ${quantity} (${pkg.unitLabel || "unit"})` : "Estimated event total"}: <span className="font-semibold">R {estimatedTotal.toLocaleString("en-ZA")} ZAR</span></p>}
                {pricingType === "per_guest" && pkg.minPriceValue > 0 && <p className="text-sm text-ink/60">Minimum booking total R {pkg.minPriceValue.toLocaleString("en-ZA")} ZAR.</p>}
              </div>
            ) : (
              <Link href={packagePath(pkg.id)} className="group flex min-w-0 flex-1 items-start gap-4 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-black/5">
                  <Image src={pkg.photoUrl || provider.media[0]?.url || "/next.svg"} alt={pkg.title} fill sizes="80px" className="object-cover" unoptimized={(pkg.photoUrl || provider.media[0]?.url || "").startsWith("http")} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-ink group-hover:underline underline-offset-4">{pkg.title}</h3>
                  <p className="text-sm text-ink/60 line-clamp-2">{pkg.description}</p>
                  <p className="text-sm text-ink mt-1"><span className="font-medium">{price}</span>{pricingType === "per_guest" && pkg.minPriceValue > 0 && <span className="text-ink/50"> · Minimum R {pkg.minPriceValue.toLocaleString("en-ZA")} ZAR to book</span>}</p>
                  <span className="mt-2 inline-block text-xs font-medium text-ink/60 group-hover:text-ink">View package details</span>
                </div>
              </Link>
            )}
            <div className={detail ? "space-y-3" : "flex shrink-0 flex-col items-start justify-center gap-2 sm:items-end sm:max-w-48"}>
              <button type="button" disabled={disabled} onClick={() => inCart ? removeItem(cartItemId(pkg.id, eventId ?? null)) : addItem(pkg, provider, eventId ? event : undefined)} className={`flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 ${detail ? "w-full" : ""} ${inCart ? "bg-coral-soft text-coral" : "bg-ink text-white hover:bg-black/80"}`}>
                {inCart ? <><Check size={14} /> Added</> : <><Plus size={14} /> {detail ? "Add to cart" : "Add"}</>}
              </button>
              {capacityProblem && <p className="text-xs leading-relaxed text-ink/60">{capacityProblem} Your event has {event?.guests} attendees.</p>}
            </div>
          </div>
        );
      })}
      {items.length >= 50 && <p className="text-sm text-ink/60">Your cart can contain up to 50 services per booking request.</p>}
      {items.length > 0 && <Link href="/cart" className={`inline-block rounded-full bg-coral px-5 py-2.5 text-sm font-medium text-white hover:bg-coral-hover ${detail ? "w-full text-center" : ""}`}>Review cart</Link>}
    </div>
  );
}

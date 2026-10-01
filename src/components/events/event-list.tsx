"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, PartyPopper, Plus, Users } from "lucide-react";
import { getEvents, type EventBrief } from "@/lib/event-api";
import { getEventTypeLabel } from "@/lib/event-types";
import { EventProgressSummary } from "@/components/events/event-progress";
import { eventRequestError, formatEventDate, isCancelledRequest } from "@/components/events/event-utils";
import { usePlannerAuth } from "@/components/events/use-planner-auth";

export function EventList() {
  const { ready, token } = usePlannerAuth();
  const [events, setEvents] = useState<EventBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!ready || !token) return;
    const controller = new AbortController();
    getEvents(token, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setEvents(data); })
      .catch((e) => { if (!controller.signal.aborted && !isCancelledRequest(e)) setError(eventRequestError(e, "Could not load your occasions.")); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [ready, token, retry]);

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-6 sm:py-14">
      <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <div><p className="mb-3 text-sm font-semibold text-coral">Your planner</p><h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">Your occasions</h1><p className="mt-3 max-w-xl text-base leading-relaxed text-black/55">One place for your event details, services and bookings.</p></div>
        <Link href="/events/new" className="inline-flex shrink-0 items-center gap-2 rounded-full bg-coral px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-coral-hover"><Plus size={18} />Plan an occasion</Link>
      </div>
      {!ready || loading ? <p role="status" className="py-10 text-black/50">Loading your occasions…</p> : error ? (
        <div className="space-y-4"><p role="alert" className="rounded-xl bg-coral-soft p-4 text-sm text-coral">{error}</p><button onClick={() => { setError(""); setLoading(true); setRetry((value) => value + 1); }} className="rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-semibold">Try again</button></div>
      ) : events.length === 0 ? (
        <div className="rounded-3xl border border-black/10 bg-white px-6 py-16 text-center sm:py-24"><span className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-coral-soft text-coral"><PartyPopper size={36} strokeWidth={1.5} /></span><h2 className="text-2xl font-semibold text-ink">Every occasion starts with a plan</h2><p className="mx-auto mt-3 max-w-md text-base leading-relaxed text-black/55">Choose your occasion, add the details and build a service list. Then find providers who can help bring it together.</p><Link href="/events/new" className="mt-8 inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3.5 text-sm font-semibold text-white hover:bg-coral-hover">Create your first plan<ArrowRight size={17} /></Link></div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => <article key={event.id} className="flex min-w-0 flex-col rounded-2xl border border-black/10 bg-white p-6"><div className="flex items-start justify-between gap-3"><span className="rounded-full bg-coral-soft px-3 py-1 text-xs font-semibold text-coral">{getEventTypeLabel(event.eventType, event.customEventType)}</span><PartyPopper size={23} strokeWidth={1.5} className="shrink-0 text-black/30" /></div><h2 className="mt-5 break-words text-xl font-semibold text-ink"><Link href={`/events/${encodeURIComponent(event.id)}`} className="hover:underline">{event.title}</Link></h2><div className="my-5 space-y-2.5 text-sm text-black/55"><p className="flex items-start gap-2"><CalendarDays size={17} className="mt-0.5 shrink-0" />{formatEventDate(event.eventDate)} · {event.startTime}</p><p className="flex items-start gap-2"><MapPin size={17} className="mt-0.5 shrink-0" />{event.area}</p><p className="flex items-center gap-2"><Users size={17} className="shrink-0" />{event.guests.toLocaleString("en-ZA")} {event.guests === 1 ? "guest" : "guests"}</p></div><div className="mt-auto border-t border-black/10 pt-5"><EventProgressSummary progress={event.progress} compact /><Link href={`/events/${encodeURIComponent(event.id)}`} className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-coral">Open your plan<ArrowRight size={16} /></Link></div></article>)}
        </div>
      )}
    </main>
  );
}

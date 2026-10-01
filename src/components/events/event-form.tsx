"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Baby, Building2, Cake, Check, Flower2, GraduationCap, Heart, PartyPopper, Users } from "lucide-react";
import { clsx } from "clsx";
import { createEvent, getEvent, updateEvent, type EventBrief, type EventInput } from "@/lib/event-api";
import { EVENT_TYPES, suggestedServices } from "@/lib/event-types";
import { SERVICES } from "@/lib/taxonomy";
import { normalizeArea, resolveArea } from "@/lib/locations";
import { ProvinceTownPicker } from "@/components/locations/province-town-picker";
import { useLocationCoverage } from "@/components/locations/use-location-coverage";
import { usePlannerAuth } from "@/components/events/use-planner-auth";
import { bookingService, eventRequestError, isCalendarDate, isCancelledRequest, todayInSouthAfrica } from "@/components/events/event-utils";

const EMPTY: EventInput = {
  title: "", eventType: "", customEventType: "", area: "", eventDate: "", startTime: "10:00",
  guests: 50, serviceSlugs: [], otherService: "", notes: "",
};
const STEPS = ["The occasion", "The details", "Your services"];
const TITLES = ["What are you planning?", "Let’s get the details together", "What will you need?"];
const DESCRIPTIONS = [
  "Start with your occasion. We’ll suggest services you can adjust to suit your plans.",
  "Find providers who serve your area and keep your booking details together.",
  "Keep the suggestions you like, remove the rest, and add anything else you need.",
];
const TYPE_ICONS = { wedding: Heart, birthday: Cake, "baby-shower": Baby, corporate: Building2, graduation: GraduationCap, funeral: Flower2, "family-gathering": Users, other: PartyPopper };
const inputClass = "w-full rounded-xl border border-black/15 bg-white px-4 py-3.5 text-base text-ink outline-none focus:border-coral focus:ring-1 focus:ring-coral disabled:bg-black/5 disabled:text-black/50";

function Field({ label, id, hint, children }: { label: string; id: string; hint?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><label htmlFor={id} className="text-sm font-semibold text-ink">{label}</label>{children}{hint && <p className="text-sm leading-relaxed text-black/50">{hint}</p>}</div>;
}

export function EventForm({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const { ready, token } = usePlannerAuth();
  const [form, setForm] = useState<EventInput>(EMPTY);
  const { coverage, isAreaLaunched, unavailable: coverageUnavailable, retry: retryCoverage } = useLocationCoverage();
  const [original, setOriginal] = useState<EventBrief | null>(null);
  const [loading, setLoading] = useState(!!eventId);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [step, setStep] = useState(0);
  const [servicesEdited, setServicesEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const savingRef = useRef(false);
  const activeServices = new Set((original?.bookings ?? []).filter((booking) => booking.status !== "Cancelled").map(bookingService));
  const hasBookings = activeServices.size > 0;
  const today = todayInSouthAfrica();

  useEffect(() => {
    if (!ready || !token || !eventId) return;
    const controller = new AbortController();
    getEvent(eventId, token, controller.signal)
      .then((event) => {
        if (controller.signal.aborted) return;
        setOriginal(event);
        setServicesEdited(true);
        setForm({ title: event.title, eventType: event.eventType, customEventType: event.customEventType,
          area: event.area, eventDate: event.eventDate, startTime: event.startTime, guests: event.guests,
          serviceSlugs: event.serviceSlugs, otherService: event.otherService, notes: event.notes });
      })
      .catch((e) => { if (!controller.signal.aborted && !isCancelledRequest(e)) setLoadError(eventRequestError(e, "Could not load this occasion.")); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [ready, token, eventId, retry]);

  useEffect(() => {
    if (!ready || loading || loadError) return;
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, ready, loading, loadError]);

  function set<K extends keyof EventInput>(key: K, value: EventInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function chooseType(type: string) {
    setForm((current) => ({ ...current, eventType: type,
      serviceSlugs: servicesEdited ? current.serviceSlugs : suggestedServices(type) }));
  }

  function toggleService(slug: string) {
    if (activeServices.has(slug)) return;
    setServicesEdited(true);
    setForm((current) => ({ ...current, serviceSlugs: current.serviceSlugs.includes(slug)
      ? current.serviceSlugs.filter((service) => service !== slug) : [...current.serviceSlugs, slug] }));
  }

  function validate(candidate: number): string {
    if (candidate === 0) {
      if (!EVENT_TYPES.some((type) => type.slug === form.eventType)) return "Choose the type of occasion you’re planning.";
      if (form.eventType === "other" && (!form.customEventType.trim() || form.customEventType.trim().length > 80)) return "Describe your occasion in 1 to 80 characters.";
      if (!form.title.trim() || form.title.trim().length > 100) return "Give your occasion a name in 1 to 100 characters.";
    }
    if (candidate === 1) {
      if (!resolveArea(form.area) && !(hasBookings && form.area === original?.area)) return "Choose a province and town for your occasion.";
      if (!isCalendarDate(form.eventDate)) return "Choose a valid event date.";
      if (form.eventDate < today && form.eventDate !== original?.eventDate) return "Choose today or a future date for your occasion.";
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(form.startTime)) return "Choose a valid start time.";
      if (!Number.isInteger(form.guests) || form.guests < 1 || form.guests > 10000) return "Enter a whole guest count between 1 and 10,000.";
      if (form.notes.trim().length > 1000) return "Keep your notes to 1,000 characters or fewer.";
    }
    if (candidate === 2) {
      if (form.serviceSlugs.length === 0) return "Choose at least one service for your occasion.";
      if (form.serviceSlugs.includes("other") && (!form.otherService.trim() || form.otherService.trim().length > 100)) return "Describe the other service you need in 1 to 100 characters.";
    }
    return "";
  }

  function next() {
    if (savingRef.current) return;
    for (let candidate = 0; candidate <= step; candidate++) {
      const problem = validate(candidate);
      if (problem) { setStep(candidate); setError(problem); return; }
    }
    setError("");
    setStep(step + 1);
  }

  async function save() {
    if (!token || savingRef.current) return;
    for (let candidate = 0; candidate < STEPS.length; candidate++) {
      const problem = validate(candidate);
      if (problem) { setStep(candidate); setError(problem); return; }
    }
    savingRef.current = true;
    setSaving(true);
    setError("");
    const data: EventInput = { ...form, area: hasBookings ? form.area : normalizeArea(form.area) ?? form.area, title: form.title.trim(),
      customEventType: form.eventType === "other" ? form.customEventType.trim() : "",
      otherService: form.serviceSlugs.includes("other") ? form.otherService.trim() : "", notes: form.notes.trim() };
    try {
      const event = eventId ? await updateEvent(eventId, data, token) : await createEvent(data, token);
      router.push(`/events/${encodeURIComponent(event.id)}`);
    } catch (e) {
      setError(eventRequestError(e, "Could not save your occasion."));
      savingRef.current = false;
      setSaving(false);
    }
  }

  if (!ready || loading) return <main className="mx-auto w-full max-w-3xl px-6 py-16"><p role="status" className="text-black/50">{eventId ? "Loading your occasion…" : "Getting your planner ready…"}</p></main>;
  if (loadError) return <main className="mx-auto w-full max-w-3xl space-y-5 px-6 py-16"><p role="alert" className="rounded-xl bg-coral-soft p-4 text-sm text-coral">{loadError}</p><button onClick={() => { setLoadError(""); setLoading(true); setRetry((value) => value + 1); }} className="rounded-full border border-black/15 bg-white px-5 py-3 text-sm font-semibold">Try again</button><Link href="/events" className="ml-5 text-sm underline underline-offset-4">Your occasions</Link></main>;

  return (
    <main className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-6 sm:py-12">
      <div className="flex items-center justify-between gap-3 text-sm text-black/50"><Link href={eventId ? `/events/${encodeURIComponent(eventId)}` : "/events"} className="underline underline-offset-4">{eventId ? "Back to your occasion" : "Your occasions"}</Link><span>Step {step + 1} of {STEPS.length}</span></div>
      <div className="mt-7 grid grid-cols-3 gap-2">{STEPS.map((label, index) => <div key={label}><div className={clsx("h-1 rounded-full", index <= step ? "bg-coral" : "bg-black/10")} /><p className={clsx("mt-2 text-xs", index === step ? "font-semibold text-ink" : "text-black/40")}>{label}</p></div>)}</div>
      <div className="mb-9 mt-12"><h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold tracking-tight text-ink outline-none sm:text-4xl">{TITLES[step]}</h1><p className="mt-4 max-w-xl text-base leading-relaxed text-black/55">{DESCRIPTIONS[step]}</p></div>
      <fieldset disabled={saving} className="min-w-0 space-y-7 border-0 p-0">
        {step === 0 && <>
          <div className="grid gap-3 sm:grid-cols-2">{EVENT_TYPES.map((type) => {
            const Icon = TYPE_ICONS[type.slug];
            return <label key={type.slug} className={clsx("relative flex cursor-pointer items-start gap-4 rounded-2xl border bg-white p-5 transition-colors focus-within:ring-2 focus-within:ring-coral", form.eventType === type.slug ? "border-coral bg-coral-soft ring-1 ring-coral" : "border-black/15 hover:border-ink")}><input type="radio" name="event-type" value={type.slug} checked={form.eventType === type.slug} onChange={() => chooseType(type.slug)} className="sr-only" /><Icon size={24} strokeWidth={1.6} className="mt-1 shrink-0 text-ink" /><span className="pr-4"><span className="block font-semibold text-ink">{type.label}</span><span className="mt-1 block text-sm leading-relaxed text-black/55">{type.description}</span></span>{form.eventType === type.slug && <Check size={16} className="absolute right-4 top-4 text-coral" aria-hidden="true" />}</label>;
          })}</div>
          {form.eventType === "other" && <Field id="custom-event-type" label="What are you planning?"><input id="custom-event-type" className={inputClass} value={form.customEventType} maxLength={80} onChange={(e) => set("customEventType", e.target.value)} placeholder="e.g. A community fundraiser" /></Field>}
          <Field id="event-title" label="Give your occasion a name" hint="A name to help you find it in your planner."><input id="event-title" className={inputClass} value={form.title} maxLength={100} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Mpho’s birthday celebration" /></Field>
        </>}
        {step === 1 && <>
          {hasBookings && <p className="rounded-xl border border-black/10 bg-white p-4 text-sm leading-relaxed text-black/55">This occasion has bookings. Its area, date and guest count stay fixed so the plan matches those bookings. Changing the start time or notes won’t change existing bookings.</p>}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-ink">Where is it happening?</h2>
            <p className="text-sm font-medium text-ink">Starting in Limpopo. Growing across South Africa.</p>
            <ProvinceTownPicker id="event-area" value={form.area} onChange={(area) => set("area", area)} disabled={hasBookings} />
            {form.area && !isAreaLaunched(form.area) && <p className="rounded-xl bg-white p-4 text-sm leading-relaxed text-ink/65">{coverage ? "You can save a plan for this area now. This province has not launched yet, so new bookings through Occasions are not available here. Check back as coverage grows." : "You can save a plan for this area now. Launch starts in Limpopo; confirm local coverage when you choose services."}</p>}
            {coverageUnavailable && <p className="text-sm leading-relaxed text-black/50">Launch information is temporarily unavailable. Our launch starts in Limpopo. <button type="button" onClick={retryCoverage} className="font-medium text-coral underline">Check again</button></p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2"><Field id="event-date" label="Date"><input id="event-date" type="date" min={original && original.eventDate < today ? original.eventDate : today} className={inputClass} value={form.eventDate} onChange={(e) => set("eventDate", e.target.value)} disabled={hasBookings} /></Field><Field id="event-time" label="Start time" hint="South Africa time. Setup times can differ when booking."><input id="event-time" type="time" className={inputClass} value={form.startTime} onChange={(e) => set("startTime", e.target.value)} /></Field></div>
          <Field id="event-guests" label="How many guests?" hint="Use a whole number, from 1 to 10,000."><input id="event-guests" type="number" min={1} max={10000} step={1} className={`${inputClass} max-w-xs`} value={form.guests || ""} onChange={(e) => set("guests", Number(e.target.value))} disabled={hasBookings} /></Field>
          <Field id="event-notes" label="Venue details and notes" hint={`${form.notes.length}/1,000 characters · Optional. Shared only with providers booked for this event.`}><textarea id="event-notes" rows={4} className={inputClass} maxLength={1000} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="e.g. Outdoor venue, setup by 09:00, or dietary preferences." /></Field>
        </>}
        {step === 2 && <>
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-medium text-black/55">{form.serviceSlugs.length} {form.serviceSlugs.length === 1 ? "service" : "services"} selected</p>{suggestedServices(form.eventType).length > 0 && <button type="button" onClick={() => { setServicesEdited(true); set("serviceSlugs", [...new Set([...suggestedServices(form.eventType), ...activeServices])]); }} className="text-sm font-semibold text-coral underline underline-offset-4">Use suggested services</button>}</div>
          <div className="grid gap-3 sm:grid-cols-2">{SERVICES.map((service) => {
            const selected = form.serviceSlugs.includes(service.slug);
            const locked = activeServices.has(service.slug);
            return <label key={service.slug} className={clsx("flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-5 transition-colors focus-within:ring-2 focus-within:ring-coral", selected ? "border-coral bg-coral-soft" : "border-black/15 hover:border-ink", locked && "cursor-default")}><input type="checkbox" checked={selected} onChange={() => toggleService(service.slug)} disabled={locked} className="h-5 w-5 shrink-0 accent-coral" /><span><span className="block text-sm font-semibold text-ink">{service.label}</span>{locked && <span className="mt-1 block text-xs text-black/50">Has an active booking</span>}</span></label>;
          })}</div>
          {form.serviceSlugs.includes("other") && <Field id="other-service" label="What other service do you need?" hint="We’ll show providers listed under Other; check their details for a match."><input id="other-service" className={inputClass} value={form.otherService} maxLength={100} onChange={(e) => set("otherService", e.target.value)} placeholder="e.g. A live band or balloon artist" /></Field>}
          <p className="text-sm leading-relaxed text-black/50">Saving your plan doesn’t make bookings. You’ll choose providers and packages next.</p>
        </>}
      </fieldset>
      {error && <p role="alert" className="mt-6 rounded-xl bg-coral-soft px-4 py-3 text-sm text-coral">{error}</p>}
      <div className="sticky bottom-0 z-20 mt-12 flex items-center justify-between gap-4 border-t border-black/10 bg-offwhite/95 py-5 backdrop-blur">
        {step > 0 ? <button type="button" disabled={saving} onClick={() => { if (!savingRef.current) { setError(""); setStep(step - 1); } }} className="px-3 py-3 text-sm font-semibold underline underline-offset-4 disabled:opacity-50">Back</button> : <span className="text-xs text-black/45">Bring it all together</span>}
        <button type="button" disabled={saving} onClick={step === 2 ? save : next} className="rounded-full bg-coral px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-coral-hover disabled:opacity-60">{saving ? "Saving…" : step === 2 ? eventId ? "Save changes" : "Save my occasion" : "Continue"}</button>
      </div>
    </main>
  );
}

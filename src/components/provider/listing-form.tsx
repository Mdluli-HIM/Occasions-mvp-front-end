"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { Building2, Check, ImagePlus, Trash2, UserRound, X } from "lucide-react";
import { SERVICES } from "@/lib/taxonomy";
import { locationLabel, normalizeArea, resolveArea, sameArea } from "@/lib/locations";
import { ProvinceTownPicker } from "@/components/locations/province-town-picker";
import { useLocationCoverage } from "@/components/locations/use-location-coverage";
import { PackagesEditor } from "@/components/provider/packages-editor";
import {
  deleteListingPhoto,
  deleteProfilePhoto,
  getMyListing,
  saveMyListing,
  uploadListingPhoto,
  uploadProfilePhoto,
  type ListingInput,
} from "@/lib/provider-api";

type Photo = { id: string; url: string };

const EMPTY: ListingInput = {
  providerType: null,
  profileName: "",
  profileBio: "",
  yearsExperience: null,
  name: "",
  category: "",
  tagline: "",
  description: "",
  areasServed: [],
  serviceSlug: "",
  workingHoursStart: "09:00",
  workingHoursEnd: "17:00",
  contactPhone: "",
  contactWhatsapp: "",
  guestRequirements: "",
  accessibilityNote: "",
  cancellationNote: "",
};

const STEPS = ["Provider", "Your profile", "Service & areas", "Contact & policies", "Photos", "Packages"];
const TITLES = [
  "Who will be providing the service?",
  "Let customers get to know you",
  "What do you offer, and where?",
  "Help customers plan with confidence",
  "Put a face to your service",
  "What can customers book?",
];
const SUBTITLES = [
  "Whether you work independently or with a team, there’s a place for you on Occasions.",
  "A thoughtful introduction helps customers choose the right person for their occasion.",
  "Choose your service and the places you can bring it to.",
  "Share your contact details and anything customers should know before booking.",
  "Add your profile photo or company logo, then a few photos of your best work.",
  "Turn your services into clear, easy-to-book packages.",
];
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

const inputClass =
  "w-full rounded-xl border border-black/15 bg-white px-4 py-3.5 text-base text-ink outline-none focus:border-coral focus:ring-1 focus:ring-coral disabled:opacity-60";

function Field({ label, hint, htmlFor, children }: {
  label: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">{label}</label>
      {children}
      {hint && <p className="text-sm leading-relaxed text-black/50">{hint}</p>}
    </div>
  );
}

function imageProblem(file: File): string {
  if (!ALLOWED_TYPES.includes(file.type)) return `${file.name}: choose a JPEG, PNG or WebP image.`;
  if (file.size > MAX_BYTES) return `${file.name} is over 5MB.`;
  return "";
}

export function ListingForm({ mode, initialStep = 0 }: {
  mode: "create" | "edit";
  initialStep?: number;
}) {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const profileFileRef = useRef<HTMLInputElement>(null);
  // The ref also blocks a second request before React renders the disabled controls.
  const requestInFlight = useRef(false);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 0), STEPS.length - 1));
  const [form, setForm] = useState<ListingInput>(EMPTY);
  const [newArea, setNewArea] = useState("");
  const [areaError, setAreaError] = useState("");
  const { coverage, isAreaLaunched, unavailable: coverageUnavailable, retry: retryCoverage } = useLocationCoverage();
  const [otherService, setOtherService] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const busy = saving || uploading;
  const isCompany = form.providerType === "company";
  const publicName = form.profileName.trim() || form.name.trim();
  const initials = publicName.split(/\s+/).filter((part) => part && part !== "&").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const futureAreas = form.areasServed.filter((area) => !isAreaLaunched(area));
  const servesLaunchedArea = form.areasServed.some(isAreaLaunched);

  useEffect(() => {
    let active = true;
    getMyListing()
      .then((listing) => {
        if (!active) return;
        if (mode === "create" && listing) return router.replace("/provider/listings/edit");
        if (mode === "edit" && !listing) return router.replace("/provider/listings/new");
        if (listing) {
          setForm({
            providerType: listing.providerType ?? null,
            profileName: listing.profileName ?? "",
            profileBio: listing.profileBio ?? "",
            yearsExperience: listing.yearsExperience ?? null,
            name: listing.name,
            category: listing.category,
            tagline: listing.tagline,
            description: listing.description,
            areasServed: listing.areasServed,
            serviceSlug: listing.serviceSlug,
            workingHoursStart: listing.workingHoursStart,
            workingHoursEnd: listing.workingHoursEnd,
            contactPhone: listing.contactPhone,
            contactWhatsapp: listing.contactWhatsapp,
            guestRequirements: listing.guestRequirements,
            accessibilityNote: listing.accessibilityNote,
            cancellationNote: listing.cancellationNote,
          });
          setPhotos(listing.media.map((media) => ({ id: media.id, url: media.url })));
          setProfilePhotoUrl(listing.profilePhotoUrl ?? "");
          if (listing.serviceSlug === "other") setOtherService(listing.category);
        }
        setReady(true);
      })
      .catch((e) => {
        if (active) setLoadError(e instanceof Error ? e.message : "Could not load your listing");
      });
    return () => { active = false; };
  }, [mode, router]);

  useEffect(() => {
    if (!ready) return;
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [ready, step]);

  function set<K extends keyof ListingInput>(key: K, value: ListingInput[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function addArea() {
    const area = normalizeArea(newArea);
    if (!area) {
      setAreaError("Choose a town or enter a town name with 2 to 80 characters.");
      return;
    }
    if (!form.areasServed.some((selected) => sameArea(selected, area))) {
      set("areasServed", [...form.areasServed, area]);
    }
    setNewArea("");
    setAreaError("");
  }

  function validate(candidateStep: number): string {
    if (candidateStep === 0 && !form.providerType) return "Choose whether you provide services as an individual or a company.";
    if (candidateStep === 1) {
      if (!form.profileName.trim()) return isCompany ? "Enter your company’s public name." : "Enter the name customers should see.";
      if (form.profileName.trim().length > 80) return "Keep your public profile name to 80 characters or fewer.";
      if (form.profileBio.length > 600) return "Keep your profile introduction to 600 characters or fewer.";
      if (form.yearsExperience !== null && (!Number.isInteger(form.yearsExperience) || form.yearsExperience < 0 || form.yearsExperience > 100)) {
        return "Enter whole years of experience between 0 and 100, or leave it empty.";
      }
      if (!form.name.trim()) return "Give your listing a title.";
    }
    if (candidateStep === 2) {
      if (!form.serviceSlug) return "Choose the service you offer.";
      if (form.serviceSlug === "other" && !otherService.trim()) return "Tell us what service you offer.";
      if (form.areasServed.length === 0) return "Pick at least one area you serve.";
      if (form.areasServed.some((area) => !resolveArea(area))) return "Choose a province and town for every area you serve.";
      if (!form.workingHoursStart || !form.workingHoursEnd) return "Choose your opening and closing times.";
      if (form.workingHoursEnd <= form.workingHoursStart) return "Closing time must be after opening time.";
    }
    return "";
  }

  function validateThrough(lastStep: number): boolean {
    for (let candidateStep = 0; candidateStep <= lastStep; candidateStep++) {
      const problem = validate(candidateStep);
      if (problem) {
        setStep(candidateStep);
        setError(problem);
        return false;
      }
    }
    return true;
  }

  async function next() {
    if (requestInFlight.current || !validateThrough(Math.min(step, 3))) return;
    setError("");
    if (step < 3) {
      setStep(step + 1);
      return;
    }
    requestInFlight.current = true;
    setSaving(true);
    try {
      const service = SERVICES.find((value) => value.slug === form.serviceSlug);
      const category = form.serviceSlug === "other" ? otherService.trim() : service?.label ?? form.category;
      // Save on every return through these steps so profile edits do not get lost.
      await saveMyListing({
        ...form,
        name: form.name.trim(),
        profileName: form.profileName.trim(),
        profileBio: form.profileBio.trim(),
        category,
      });
      if (step === STEPS.length - 1) router.push("/provider/listings");
      else setStep(step + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your listing");
    } finally {
      requestInFlight.current = false;
      setSaving(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length || requestInFlight.current) return;
    requestInFlight.current = true;
    setUploading(true);
    setError("");
    const problems: string[] = [];
    try {
      for (const file of Array.from(files)) {
        const problem = imageProblem(file);
        if (problem) { problems.push(problem); continue; }
        try {
          const media = await uploadListingPhoto(file);
          setPhotos((current) => [...current, { id: media.id, url: media.url }]);
        } catch (e) {
          problems.push(e instanceof Error ? e.message : `Could not upload ${file.name}`);
        }
      }
      setError(problems.join(" "));
    } finally {
      requestInFlight.current = false;
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleProfileFile(files: FileList | null) {
    const file = files?.[0];
    if (!file || requestInFlight.current) return;
    if (profileFileRef.current) profileFileRef.current.value = "";
    const problem = imageProblem(file);
    if (problem) return setError(problem);
    requestInFlight.current = true;
    setUploading(true);
    setError("");
    try {
      const photo = await uploadProfilePhoto(file);
      setProfilePhotoUrl(photo.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload your profile photo");
    } finally {
      requestInFlight.current = false;
      setUploading(false);
    }
  }

  async function removePhoto(id?: string) {
    if (requestInFlight.current) return;
    requestInFlight.current = true;
    setUploading(true);
    setError("");
    try {
      if (id) {
        await deleteListingPhoto(id);
        setPhotos((current) => current.filter((photo) => photo.id !== id));
      } else {
        await deleteProfilePhoto();
        setProfilePhotoUrl("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove photo");
    } finally {
      requestInFlight.current = false;
      setUploading(false);
    }
  }

  if (loadError) return <p role="alert" className="rounded-xl bg-coral-soft px-4 py-3 text-sm text-coral">{loadError}</p>;
  if (!ready) return <p className="text-black/50">Loading your listing…</p>;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-4 text-sm text-black/50">
        <p className="font-medium">{mode === "create" ? "Create your listing" : "Edit your listing"}</p>
        <p aria-live="polite">Step {step + 1} of {STEPS.length}</p>
      </div>
      <div className="mt-5 flex gap-2" aria-label={`${STEPS[step]}, step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((label, index) => (
          <div key={label} className="flex-1">
            <div className={clsx("h-1 rounded-full", index <= step ? "bg-coral" : "bg-black/10")} />
            <span className={clsx("mt-2 hidden text-xs sm:block", index === step ? "font-semibold text-ink" : "text-black/40")}>{label}</span>
          </div>
        ))}
      </div>

      <div className="mb-10 mt-12 sm:mt-16">
        <h1 ref={headingRef} tabIndex={-1} className="max-w-2xl text-3xl font-bold leading-tight tracking-tight text-ink outline-none sm:text-4xl">{TITLES[step]}</h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-black/55">{SUBTITLES[step]}</p>
      </div>

      <fieldset disabled={busy} className="min-w-0 space-y-8 border-0 p-0">
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              { value: "individual", label: "I’m an individual", text: "I provide services in my own name.", Icon: UserRound },
              { value: "company", label: "We’re a company", text: "A business or team providing services together.", Icon: Building2 },
            ] as const).map(({ value, label, text, Icon }) => (
              <label key={value} className={clsx("relative cursor-pointer rounded-2xl border p-7 transition-colors focus-within:ring-2 focus-within:ring-coral", form.providerType === value ? "border-coral bg-coral-soft ring-1 ring-coral" : "border-black/15 bg-white hover:border-ink")}>
                <input type="radio" name="providerType" value={value} checked={form.providerType === value} onChange={() => set("providerType", value)} className="sr-only" />
                <Icon size={32} strokeWidth={1.5} className="mb-8 text-ink" />
                {form.providerType === value && <Check size={20} className="absolute right-5 top-5 text-coral" aria-hidden="true" />}
                <span className="block text-xl font-semibold text-ink">{label}</span>
                <span className="mt-2 block text-sm leading-relaxed text-black/55">{text}</span>
              </label>
            ))}
            <p className="text-sm leading-relaxed text-black/50 sm:col-span-2">This describes your provider profile. You can still plan and book your own occasions with the same account.</p>
          </div>
        )}

        {step === 1 && (
          <>
            <Field label={isCompany ? "Company name" : "Your name"} htmlFor="profile-name" hint="The public name shown on your provider profile.">
              <input id="profile-name" className={inputClass} value={form.profileName} maxLength={80} onChange={(e) => set("profileName", e.target.value)} placeholder={isCompany ? "e.g. Sunrise Catering" : "e.g. Mpho Molefe"} autoComplete={isCompany ? "organization" : "name"} />
            </Field>
            <Field label={isCompany ? "About your company" : "A little about you"} htmlFor="profile-bio" hint={`${form.profileBio.length}/600 characters · Share your background, experience and approach.`}>
              <textarea id="profile-bio" className={inputClass} rows={4} value={form.profileBio} maxLength={600} onChange={(e) => set("profileBio", e.target.value)} placeholder="Tell customers what makes working with you special." />
            </Field>
            <Field label="Years of experience" htmlFor="profile-experience" hint="Optional. Use whole years, or leave this empty.">
              <input id="profile-experience" type="number" min={0} max={100} step={1} className={`${inputClass} max-w-xs`} value={form.yearsExperience ?? ""} onChange={(e) => set("yearsExperience", e.target.value === "" ? null : e.target.valueAsNumber)} placeholder="e.g. 3" />
            </Field>
            <div className="border-t border-black/10 pt-8">
              <h2 className="mb-6 text-xl font-semibold text-ink">Introduce your service</h2>
              <div className="space-y-6">
                <Field label="Listing title" htmlFor="listing-title" hint="Give this service a clear, memorable name.">
                  <input id="listing-title" className={inputClass} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Braai & Bites Catering" />
                </Field>
                <Field label="Tagline" htmlFor="listing-tagline" hint="One line that shows on your listing card.">
                  <input id="listing-tagline" className={inputClass} value={form.tagline} maxLength={100} onChange={(e) => set("tagline", e.target.value)} placeholder="e.g. Home-style catering for weddings and celebrations" />
                </Field>
                <Field label="About your service" htmlFor="listing-description">
                  <textarea id="listing-description" className={inputClass} rows={6} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Describe what you offer and what customers can expect." />
                </Field>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <Field label="Service">
              <div className="grid grid-cols-2 gap-3">
                {SERVICES.map((service) => (
                  <button key={service.slug} type="button" aria-pressed={form.serviceSlug === service.slug} onClick={() => set("serviceSlug", service.slug)} className={clsx("rounded-xl border px-4 py-4 text-left text-sm font-medium transition-colors", form.serviceSlug === service.slug ? "border-coral bg-coral-soft text-ink ring-1 ring-coral" : "border-black/15 bg-white text-ink hover:border-ink")}>{service.label}</button>
                ))}
              </div>
            </Field>
            {form.serviceSlug === "other" && (
              <Field label="What service do you offer?" htmlFor="other-service" hint="Shown to planners instead of a generic category.">
                <input id="other-service" className={inputClass} value={otherService} onChange={(e) => setOtherService(e.target.value)} placeholder="e.g. Balloon Artist, Live Band, Wedding Planner" />
              </Field>
            )}
            <Field label="Areas you serve" hint="Add every town you travel to. You can choose areas in more than one province.">
              <p className="text-sm font-medium text-ink">Starting in Limpopo. Growing across South Africa.</p>
              <ProvinceTownPicker id="listing-area" value={newArea} onChange={(area) => { setNewArea(area); setAreaError(""); }} />
              <button type="button" onClick={addArea} className="rounded-full border border-black/15 bg-white px-5 py-2.5 text-sm font-semibold text-ink hover:border-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral">Add service area</button>
              {areaError && <p role="alert" className="text-sm text-coral">{areaError}</p>}
              {form.areasServed.length > 0 && <div className="space-y-2 pt-2">
                <p className="text-sm font-medium text-ink">Selected service areas ({form.areasServed.length})</p>
                <div className="flex flex-wrap gap-2">
                  {form.areasServed.map((area) => <button key={area} type="button"
                    onClick={() => set("areasServed", form.areasServed.filter((value) => value !== area))}
                    aria-label={`Remove ${locationLabel(area)}`} className="inline-flex items-center gap-2 rounded-full border border-coral bg-coral-soft px-4 py-2.5 text-left text-sm font-medium text-coral focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral">
                    {locationLabel(area)}<X size={14} className="shrink-0" aria-hidden="true" />
                  </button>)}
                </div>
              </div>}
              {futureAreas.length > 0 && <p className="rounded-xl bg-offwhite p-4 text-sm leading-relaxed text-ink/65">
                {!coverage
                  ? "You can prepare service areas across South Africa. Launch starts in Limpopo; check launch coverage before publishing."
                  : servesLaunchedArea
                  ? "Publishing makes your listing available in launched provinces. Your other service areas are saved for future launches."
                  : "You can prepare and publish your listing now. It stays hidden from customer search until one of your service provinces launches."}
              </p>}
              {coverageUnavailable && <p className="text-sm leading-relaxed text-black/50">Launch information is temporarily unavailable. Limpopo is our initial launch province. <button type="button" onClick={retryCoverage} className="font-medium text-coral underline">Check again</button></p>}
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Opens" htmlFor="working-hours-start"><input id="working-hours-start" type="time" className={inputClass} value={form.workingHoursStart} onChange={(e) => set("workingHoursStart", e.target.value)} /></Field>
              <Field label="Closes" htmlFor="working-hours-end"><input id="working-hours-end" type="time" className={inputClass} value={form.workingHoursEnd} onChange={(e) => set("workingHoursEnd", e.target.value)} /></Field>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone" htmlFor="contact-phone"><input id="contact-phone" type="tel" className={inputClass} value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="082 123 4567" /></Field>
              <Field label="WhatsApp" htmlFor="contact-whatsapp"><input id="contact-whatsapp" type="tel" className={inputClass} value={form.contactWhatsapp} onChange={(e) => set("contactWhatsapp", e.target.value)} placeholder="082 123 4567" /></Field>
            </div>
            <Field label="Guest requirements" htmlFor="guest-requirements" hint="Shown under “Things to know”."><textarea id="guest-requirements" className={inputClass} rows={2} value={form.guestRequirements} onChange={(e) => set("guestRequirements", e.target.value)} placeholder="e.g. Up to 100 guests" /></Field>
            <Field label="Accessibility" htmlFor="accessibility-note"><textarea id="accessibility-note" className={inputClass} rows={2} value={form.accessibilityNote} onChange={(e) => set("accessibilityNote", e.target.value)} /></Field>
            <Field label="Cancellation policy" htmlFor="cancellation-note"><textarea id="cancellation-note" className={inputClass} rows={2} value={form.cancellationNote} onChange={(e) => set("cancellationNote", e.target.value)} placeholder="e.g. Cancel at least 3 days before the event for a full refund." /></Field>
            <p className="text-sm leading-relaxed text-black/50">Save your listing before adding photos and packages. New listings stay in draft until you publish them.</p>
          </>
        )}

        {step === 4 && (
          <>
            <section className="rounded-2xl border border-black/10 bg-white p-6">
              <h2 className="text-lg font-semibold text-ink">{isCompany ? "Company logo" : "Profile photo"}</h2>
              <p className="mt-1 text-sm leading-relaxed text-black/50">{isCompany ? "Help customers recognise your company." : "Help customers recognise the person behind the service."} This is separate from your work photos.</p>
              <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-coral-soft text-2xl font-semibold text-coral">
                  {profilePhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profilePhotoUrl} alt={isCompany ? "Your company logo" : "Your profile photo"} className="h-full w-full object-cover" />
                  ) : initials || <UserRound size={32} strokeWidth={1.5} />}
                </div>
                <div className="space-y-3">
                  <div className="flex flex-wrap justify-center gap-3 sm:justify-start">
                    <button type="button" onClick={() => profileFileRef.current?.click()} className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-semibold text-ink hover:border-coral disabled:opacity-50">{profilePhotoUrl ? "Change image" : isCompany ? "Add logo" : "Add profile photo"}</button>
                    {profilePhotoUrl && <button type="button" onClick={() => removePhoto()} className="px-2 py-2.5 text-sm font-medium text-black/55 underline underline-offset-4 hover:text-coral disabled:opacity-50">Remove</button>}
                  </div>
                  <p className="text-center text-xs text-black/45 sm:text-left">Optional · JPEG, PNG or WebP, up to 5MB.</p>
                </div>
              </div>
              <input ref={profileFileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" aria-label={isCompany ? "Upload company logo" : "Upload profile photo"} onChange={(e) => handleProfileFile(e.target.files)} />
            </section>
            <section className="space-y-4">
              <div><h2 className="text-lg font-semibold text-ink">Photos of your work</h2><p className="mt-1 text-sm leading-relaxed text-black/55">The first photo is your listing cover. JPEG, PNG or WebP, up to 5MB each.</p></div>
              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {photos.map((photo, index) => (
                    <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl bg-offwhite">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt={`Work photo ${index + 1}`} className="h-full w-full object-cover" />
                      {index === 0 && <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-xs font-semibold">Cover</span>}
                      <button type="button" onClick={() => removePhoto(photo.id)} aria-label={`Remove work photo ${index + 1}`} className="absolute right-2 top-2 rounded-full bg-white p-2 text-ink shadow hover:text-coral disabled:opacity-50"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" aria-label="Upload work photos" onChange={(e) => handleFiles(e.target.files)} />
              <button type="button" onClick={() => fileRef.current?.click()} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-black/20 bg-white py-10 text-sm font-semibold text-ink transition-colors hover:border-coral hover:text-coral disabled:opacity-50"><ImagePlus size={22} />{uploading ? "Updating photos…" : "Add work photos"}</button>
            </section>
          </>
        )}

        {step === 5 && <PackagesEditor />}
      </fieldset>

      {error && <p role="alert" className="mt-6 rounded-xl bg-coral-soft px-4 py-3 text-sm text-coral">{error}</p>}
      {uploading && <p role="status" className="mt-4 text-sm text-black/55">Updating your photos. Please wait before continuing.</p>}

      <div className="sticky bottom-0 z-20 mt-12 flex items-center justify-between gap-4 border-t border-black/10 bg-white/95 py-5 backdrop-blur sm:mt-16">
        {step > 0 ? (
          <button type="button" disabled={busy} onClick={() => { if (requestInFlight.current) return; setError(""); setStep(step - 1); }} className="rounded-full px-4 py-3 text-sm font-semibold text-ink underline underline-offset-4 disabled:opacity-50">Back</button>
        ) : <span className="text-xs text-black/45">Made for your next occasion</span>}
        <button type="button" onClick={next} disabled={busy} className="rounded-full bg-coral px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-coral-hover disabled:opacity-60">
          {saving ? "Saving…" : step === 5 ? "Save and finish" : step === 3 ? "Save and continue" : "Continue"}
        </button>
      </div>
    </div>
  );
}

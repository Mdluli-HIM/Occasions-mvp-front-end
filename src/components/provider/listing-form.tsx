"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { ImagePlus, Trash2 } from "lucide-react";
import { LIMPOPO_AREAS, SERVICES } from "@/lib/taxonomy";
import { PackagesEditor } from "@/components/provider/packages-editor";
import {
  deleteListingPhoto,
  getMyListing,
  saveMyListing,
  uploadListingPhoto,
  type ListingInput,
} from "@/lib/provider-api";

type Photo = { id: string; url: string };

const EMPTY: ListingInput = {
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

const STEPS = ["Basics", "Service & areas", "Contact & policies", "Photos", "Packages"];
const TITLES = [
  "Tell customers about your business",
  "What do you offer, and where?",
  "How can customers reach you?",
  "Show off your work",
  "What can customers book?",
];
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

const inputClass =
  "w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-coral";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold tracking-wide text-ink/50 uppercase">{label}</label>
      {children}
      {hint && <p className="text-xs text-black/45">{hint}</p>}
    </div>
  );
}

export function ListingForm({
  mode,
  initialStep = 0,
}: {
  mode: "create" | "edit";
  initialStep?: number;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [step, setStep] = useState(Math.min(Math.max(initialStep, 0), STEPS.length - 1));
  const [form, setForm] = useState<ListingInput>(EMPTY);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    getMyListing()
      .then((listing) => {
        if (mode === "create" && listing) return router.replace("/provider/listings/edit");
        if (mode === "edit" && !listing) return router.replace("/provider/listings/new");
        if (listing) {
          setForm({
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
          setPhotos(listing.media.map((m) => ({ id: m.id, url: m.url })));
        }
        setReady(true);
      })
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Could not load your listing"));
  }, [mode, router]);

  function set<K extends keyof ListingInput>(key: K, value: ListingInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleArea(area: string) {
    set(
      "areasServed",
      form.areasServed.includes(area)
        ? form.areasServed.filter((a) => a !== area)
        : [...form.areasServed, area]
    );
  }

  function validate(s: number): string {
    if (s === 0 && !form.name.trim()) return "Give your business a name.";
    if (s === 1) {
      if (!form.serviceSlug) return "Choose the service you offer.";
      if (form.areasServed.length === 0) return "Pick at least one area you serve.";
      if (form.workingHoursEnd <= form.workingHoursStart) return "Closing time must be after opening time.";
    }
    return "";
  }

  function next() {
    const problem = validate(step);
    setError(problem);
    if (!problem) setStep(step + 1);
  }

  async function saveAndContinue() {
    setSaving(true);
    setError("");
    try {
      const service = SERVICES.find((s) => s.slug === form.serviceSlug);
      await saveMyListing({
        ...form,
        name: form.name.trim(),
        category: service?.label ?? form.category,
      });
      setStep(3);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your listing");
    } finally {
      setSaving(false);
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    for (const file of Array.from(files)) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError(`${file.name}: only JPEG, PNG or WebP images are allowed.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name} is over 5MB.`);
        continue;
      }
      try {
        const media = await uploadListingPhoto(file);
        setPhotos((p) => [...p, { id: media.id, url: media.url }]);
      } catch (e) {
        setError(e instanceof Error ? e.message : `Could not upload ${file.name}`);
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function removePhoto(id: string) {
    setError("");
    try {
      await deleteListingPhoto(id);
      setPhotos((p) => p.filter((ph) => ph.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove photo");
    }
  }

  if (loadError) {
    return <p className="rounded-xl bg-coral-soft px-4 py-3 text-sm text-coral">{loadError}</p>;
  }
  if (!ready) return <p className="text-black/50">Loading…</p>;

  return (
    <div className="max-w-2xl mx-auto">
      <p className="text-sm font-medium text-black/50">
        {mode === "create" ? "Create listing" : "Edit listing"} · Step {step + 1} of {STEPS.length} · {STEPS[step]}
      </p>
      <div className="mt-3 h-1.5 w-full rounded-full bg-black/10">
        <div
          className="h-full rounded-full bg-coral transition-all"
          style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      <h1 className="mt-8 mb-8 text-3xl font-bold text-ink">{TITLES[step]}</h1>

      <div className="space-y-6">
        {step === 0 && (
          <>
            <Field label="Business name">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Sunrise Catering"
              />
            </Field>
            <Field label="Tagline" hint="One line that shows on your listing card.">
              <input
                className={inputClass}
                value={form.tagline}
                maxLength={100}
                onChange={(e) => set("tagline", e.target.value)}
                placeholder="e.g. Home-style catering for weddings and funerals"
              />
            </Field>
            <Field label="About your business">
              <textarea
                className={inputClass}
                rows={6}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Tell customers what you do and why they should book you."
              />
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field label="Service">
              <div className="grid grid-cols-2 gap-3">
                {SERVICES.map((s) => (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => set("serviceSlug", s.slug)}
                    className={clsx(
                      "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                      form.serviceSlug === s.slug
                        ? "border-ink bg-white text-ink ring-1 ring-ink"
                        : "border-black/15 bg-white text-ink hover:border-ink"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Areas you serve" hint="Select every town you travel to.">
              <div className="flex flex-wrap gap-2">
                {LIMPOPO_AREAS.map((area) => (
                  <button
                    key={area}
                    type="button"
                    onClick={() => toggleArea(area)}
                    className={clsx(
                      "rounded-full border px-4 py-2 text-sm transition-colors",
                      form.areasServed.includes(area)
                        ? "border-coral bg-coral-soft text-coral font-medium"
                        : "border-black/15 bg-white text-ink hover:border-ink"
                    )}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Opens">
                <input
                  type="time"
                  className={inputClass}
                  value={form.workingHoursStart}
                  onChange={(e) => set("workingHoursStart", e.target.value)}
                />
              </Field>
              <Field label="Closes">
                <input
                  type="time"
                  className={inputClass}
                  value={form.workingHoursEnd}
                  onChange={(e) => set("workingHoursEnd", e.target.value)}
                />
              </Field>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Phone">
                <input
                  className={inputClass}
                  value={form.contactPhone}
                  onChange={(e) => set("contactPhone", e.target.value)}
                  placeholder="082 123 4567"
                />
              </Field>
              <Field label="WhatsApp">
                <input
                  className={inputClass}
                  value={form.contactWhatsapp}
                  onChange={(e) => set("contactWhatsapp", e.target.value)}
                  placeholder="082 123 4567"
                />
              </Field>
            </div>
            <Field label="Guest requirements" hint="Shown under “Things to know”.">
              <textarea
                className={inputClass}
                rows={2}
                value={form.guestRequirements}
                onChange={(e) => set("guestRequirements", e.target.value)}
                placeholder="e.g. Up to 100 guests"
              />
            </Field>
            <Field label="Accessibility">
              <textarea
                className={inputClass}
                rows={2}
                value={form.accessibilityNote}
                onChange={(e) => set("accessibilityNote", e.target.value)}
              />
            </Field>
            <Field label="Cancellation policy">
              <textarea
                className={inputClass}
                rows={2}
                value={form.cancellationNote}
                onChange={(e) => set("cancellationNote", e.target.value)}
                placeholder="e.g. Cancel at least 3 days before the event for a full refund."
              />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-sm text-black/55">
              Your listing is saved. Add photos of your best work. JPEG, PNG or WebP, up to 5MB each. The first
              photo is your cover.
            </p>

            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {photos.map((photo, i) => (
                  <div key={photo.id} className="relative aspect-square overflow-hidden rounded-xl bg-offwhite">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt="" className="h-full w-full object-cover" />
                    {i === 0 && (
                      <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-xs font-semibold">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.id)}
                      aria-label="Remove photo"
                      className="absolute right-2 top-2 rounded-full bg-white p-1.5 text-ink shadow hover:text-coral"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/20 bg-white py-10 text-sm font-medium text-ink hover:border-coral hover:text-coral transition-colors disabled:opacity-50"
            >
              <ImagePlus size={20} />
              {uploading ? "Uploading…" : "Add photos"}
            </button>

            <p className="text-xs text-black/45">
              You can publish your listing from the listings page once you're ready.
            </p>
          </>
        )}

        {step === 4 && <PackagesEditor />}
      </div>

      {error && <p className="mt-6 rounded-xl bg-coral-soft px-4 py-3 text-sm text-coral">{error}</p>}

      <div className="mt-10 flex items-center justify-between">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => {
              setError("");
              setStep(step - 1);
            }}
            className="rounded-full border border-black/15 bg-white px-6 py-3 text-sm font-medium hover:border-ink transition-colors"
          >
            Back
          </button>
        ) : (
          <span />
        )}

        {(step < 2 || step === 3) && (
          <button
            type="button"
            onClick={next}
            className="rounded-full bg-coral px-8 py-3 text-sm font-semibold text-white hover:bg-coral-hover transition-colors"
          >
            Next
          </button>
        )}
        {step === 2 && (
          <button
            type="button"
            onClick={saveAndContinue}
            disabled={saving}
            className="rounded-full bg-coral px-8 py-3 text-sm font-semibold text-white hover:bg-coral-hover transition-colors disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save and continue"}
          </button>
        )}
        {step === 4 && (
          <button
            type="button"
            onClick={() => router.push("/provider/listings")}
            disabled={uploading}
            className="rounded-full bg-coral px-8 py-3 text-sm font-semibold text-white hover:bg-coral-hover transition-colors disabled:opacity-60"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}

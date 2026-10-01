"use client";

import { useEffect, useId, useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  createPackage,
  deletePackage,
  getMyListing,
  updatePackage,
  type MyPackage,
  type PackageInput,
} from "@/lib/provider-api";

import { formatPackagePrice, normalizePricingType, type PricingType } from "@/lib/pricing";

const DURATIONS: [number, string][] = [
  [30, "30 minutes"],
  [45, "45 minutes"],
  [60, "1 hour"],
  [90, "1½ hours"],
  [120, "2 hours"],
  [180, "3 hours"],
  [240, "4 hours"],
  [480, "8 hours"],
  [1440, "1 day"],
];

const inputClass =
  "w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-coral";

function formatDuration(mins: number) {
  const known = DURATIONS.find(([m]) => m === mins);
  if (known) return known[1];
  return mins % 60 === 0 ? `${mins / 60} hours` : `${mins} minutes`;
}

const rand = (n: number) => `R${n.toLocaleString("en-ZA")}`;

const PRICING_CHOICES: { value: PricingType; title: string; detail: string }[] = [
  { value: "per_guest", title: "Per guest", detail: "The price is multiplied by the number of guests." },
  { value: "fixed", title: "Fixed package", detail: "One total price for the package, regardless of guest count." },
  { value: "per_unit", title: "Per unit", detail: "The price is multiplied by the quantity, such as tables or chairs." },
];
const MAX_RAND = 2_147_483_647;
const labelClass = "text-xs font-semibold uppercase tracking-wide text-ink/50";

function detailLines(value: string) {
  return value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function validPhotoUrl(value: string) {
  if (value === "") return true;
  if (value.length > 2048 || /[\s\\]/.test(value)) return false;
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function PackageForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: MyPackage;
  onSave: (data: PackageInput) => Promise<void>;
  onCancel: () => void;
}) {
  const id = useId();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [pricingType, setPricingType] = useState<PricingType>(normalizePricingType(initial?.pricingType));
  const [unitLabel, setUnitLabel] = useState(initial?.unitLabel ?? "");
  const [price, setPrice] = useState(initial ? String(initial.priceValue) : "");
  const [minTotal, setMinTotal] = useState(
    initial && normalizePricingType(initial.pricingType) === "per_guest" && initial.minPriceValue > 0
      ? String(initial.minPriceValue)
      : ""
  );
  const [inclusions, setInclusions] = useState(initial?.inclusions?.join("\n") ?? "");
  const [exclusions, setExclusions] = useState(initial?.exclusions?.join("\n") ?? "");
  const [minGuests, setMinGuests] = useState(initial?.minGuests == null ? "" : String(initial.minGuests));
  const [maxGuests, setMaxGuests] = useState(initial?.maxGuests == null ? "" : String(initial.maxGuests));
  const [photoUrl, setPhotoUrl] = useState(initial?.photoUrl ?? "");
  const [duration, setDuration] = useState(initial?.durationMinutes ?? 60);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Keep existing durations selectable instead of changing them on an unrelated edit.
  const options = DURATIONS.some(([m]) => m === duration)
    ? DURATIONS
    : [...DURATIONS, [duration, formatDuration(duration)] as [number, string]];
  const priceLabel = pricingType === "fixed"
    ? "Total package price (R)"
    : pricingType === "per_unit"
      ? `Price per ${unitLabel.trim() || "unit"} (R)`
      : "Price per guest (R)";

  function changePricingType(next: PricingType) {
    setPricingType(next);
    if (next !== "per_guest") setMinTotal("");
    if (next !== "per_unit") setUnitLabel("");
    setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const priceValue = Number(price);
    const minPriceValue = pricingType === "per_guest" && minTotal.trim() !== "" ? Number(minTotal) : 0;
    const normalizedUnit = pricingType === "per_unit" ? unitLabel.trim().toLowerCase().replace(/\s+/g, " ") : "";
    const minimumGuests = minGuests.trim() === "" ? null : Number(minGuests);
    const maximumGuests = maxGuests.trim() === "" ? null : Number(maxGuests);
    const included = detailLines(inclusions);
    const excluded = detailLines(exclusions);
    if (!title.trim() || title.trim().length > 120)
      return setError("Give the package a title of 1 to 120 characters.");
    if (description.trim().length > 3000)
      return setError("Keep the package description within 3,000 characters.");
    if (!Number.isInteger(priceValue) || priceValue < 1 || priceValue > MAX_RAND)
      return setError("Enter a price of at least R1, in whole rand.");
    if (!Number.isInteger(minPriceValue) || minPriceValue < 0 || minPriceValue > MAX_RAND)
      return setError("Minimum total must be a whole number, or leave it empty.");
    if (pricingType === "per_unit" && (!normalizedUnit || normalizedUnit.length > 30 || !/^[a-z0-9][a-z0-9 -]*$/.test(normalizedUnit)))
      return setError("Name the unit, such as table or chair, using up to 30 letters, numbers, spaces or hyphens.");
    if (included.length > 30 || excluded.length > 30 || [...included, ...excluded].some((line) => line.length > 180))
      return setError("Use up to 30 items per list, with no more than 180 characters per item.");
    if ([minimumGuests, maximumGuests].some((value) => value !== null && (!Number.isInteger(value) || value < 1 || value > 10000)))
      return setError("Guest limits must be whole numbers from 1 to 10,000, or left empty.");
    if (minimumGuests !== null && maximumGuests !== null && minimumGuests > maximumGuests)
      return setError("The maximum number of guests must be at least the minimum.");
    if (!validPhotoUrl(photoUrl.trim()))
      return setError("Enter an http(s) image URL or a local image path, or leave the photo empty.");

    setSaving(true);
    setError("");
    try {
      await onSave({
        title: title.trim(),
        description: description.trim(),
        pricingType,
        unitLabel: normalizedUnit,
        priceValue,
        minPriceValue,
        inclusions: included,
        exclusions: excluded,
        minGuests: minimumGuests,
        maxGuests: maximumGuests,
        photoUrl: photoUrl.trim(),
        durationMinutes: duration,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the package");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-black/10 bg-white p-5">
      <fieldset disabled={saving} className="space-y-5 disabled:opacity-70">
        <div className="space-y-1.5">
          <label htmlFor={`${id}-title`} className={labelClass}>Package title</label>
          <input
            id={`${id}-title`}
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
            placeholder="e.g. Full wedding décor setup"
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-description`} className={labelClass}>Package description</label>
          <textarea
            id={`${id}-description`}
            className={inputClass}
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={3000}
            placeholder="Describe the service, setup and what customers can expect."
          />
        </div>
        <fieldset className="space-y-3">
          <legend className={labelClass}>How do you price this package?</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            {PRICING_CHOICES.map((choice) => (
              <label
                key={choice.value}
                className={`cursor-pointer rounded-xl border p-4 transition-colors ${pricingType === choice.value ? "border-coral bg-coral-soft" : "border-black/15 bg-white hover:border-ink/40"}`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <input
                    type="radio"
                    name={`${id}-pricing-type`}
                    value={choice.value}
                    checked={pricingType === choice.value}
                    onChange={() => changePricingType(choice.value)}
                    className="accent-coral"
                  />
                  {choice.title}
                </span>
                <span className="mt-2 block text-xs leading-relaxed text-ink/60">{choice.detail}</span>
              </label>
            ))}
          </div>
        </fieldset>
        {pricingType === "per_unit" && (
          <div className="space-y-1.5">
            <label htmlFor={`${id}-unit`} className={labelClass}>Unit name</label>
            <input
              id={`${id}-unit`}
              className={inputClass}
              value={unitLabel}
              onChange={(e) => setUnitLabel(e.target.value)}
              maxLength={30}
              required
              placeholder="e.g. table, chair or tent"
              aria-describedby={`${id}-unit-hint`}
            />
            <p id={`${id}-unit-hint`} className="text-xs text-ink/55">Use the singular name. Customers choose how many units they need.</p>
          </div>
        )}
        <div className={`grid gap-4 ${pricingType === "per_guest" ? "sm:grid-cols-2" : ""}`}>
          <div className="space-y-1.5">
            <label htmlFor={`${id}-price`} className={labelClass}>{priceLabel}</label>
            <input
              id={`${id}-price`}
              className={inputClass}
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_RAND}
              step={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              placeholder={pricingType === "fixed" ? "2200" : "280"}
            />
          </div>
          {pricingType === "per_guest" && (
            <div className="space-y-1.5">
              <label htmlFor={`${id}-minimum`} className={labelClass}>Minimum total (R, optional)</label>
              <input
                id={`${id}-minimum`}
                className={inputClass}
                type="number"
                inputMode="numeric"
                min={0}
                max={MAX_RAND}
                step={1}
                value={minTotal}
                onChange={(e) => setMinTotal(e.target.value)}
                placeholder="No minimum"
                aria-describedby={`${id}-minimum-hint`}
              />
              <p id={`${id}-minimum-hint`} className="text-xs text-ink/55">The booking total will be the guest price × guests, or this minimum, whichever is higher.</p>
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor={`${id}-includes`} className={labelClass}>What’s included</label>
            <textarea
              id={`${id}-includes`}
              className={inputClass}
              rows={4}
              value={inclusions}
              onChange={(e) => setInclusions(e.target.value)}
              placeholder={"Setup and collection\nTable linens\nFloral centrepieces"}
              aria-describedby={`${id}-includes-hint`}
            />
            <p id={`${id}-includes-hint`} className="text-xs text-ink/55">One item per line. Up to 30 items, each within 180 characters.</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor={`${id}-excludes`} className={labelClass}>What’s not included</label>
            <textarea
              id={`${id}-excludes`}
              className={inputClass}
              rows={4}
              value={exclusions}
              onChange={(e) => setExclusions(e.target.value)}
              placeholder={"Venue hire\nCatering"}
              aria-describedby={`${id}-excludes-hint`}
            />
            <p id={`${id}-excludes-hint`} className="text-xs text-ink/55">Optional. One item per line, with the same limits.</p>
          </div>
        </div>
        <fieldset className="space-y-3">
          <legend className={labelClass}>Guest capacity (optional)</legend>
          <p className="text-xs text-ink/55">Set guest limits for this package. These limits don’t change a fixed or per-unit price.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor={`${id}-min-guests`} className="text-sm text-ink/70">Minimum guests</label>
              <input
                id={`${id}-min-guests`}
                className={inputClass}
                type="number"
                inputMode="numeric"
                min={1}
                max={10000}
                step={1}
                value={minGuests}
                onChange={(e) => setMinGuests(e.target.value)}
                placeholder="No minimum"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor={`${id}-max-guests`} className="text-sm text-ink/70">Maximum guests</label>
              <input
                id={`${id}-max-guests`}
                className={inputClass}
                type="number"
                inputMode="numeric"
                min={1}
                max={10000}
                step={1}
                value={maxGuests}
                onChange={(e) => setMaxGuests(e.target.value)}
                placeholder="No maximum"
              />
            </div>
          </div>
        </fieldset>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-photo`} className={labelClass}>Package photo URL (optional)</label>
          <input
            id={`${id}-photo`}
            className={inputClass}
            value={photoUrl}
            onChange={(e) => setPhotoUrl(e.target.value)}
            maxLength={2048}
            placeholder="https://… or /images/…"
            aria-describedby={`${id}-photo-hint`}
          />
          <p id={`${id}-photo-hint`} className="text-xs text-ink/55">Use a photo of this package. Leave empty to use your listing photo.</p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor={`${id}-duration`} className={labelClass}>Duration</label>
          <select id={`${id}-duration`} className={inputClass} value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
            {options.map(([m, label]) => (
              <option key={m} value={m}>{label}</option>
            ))}
          </select>
        </div>
      </fieldset>

      {error && <p role="alert" className="rounded-xl bg-coral-soft px-4 py-3 text-sm text-coral">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-medium transition-colors hover:border-ink disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-coral px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-coral-hover disabled:opacity-60"
        >
          {saving ? "Saving…" : initial ? "Save changes" : "Add package"}
        </button>
      </div>
    </form>
  );
}

export function PackagesEditor() {
  const [packages, setPackages] = useState<MyPackage[] | null>(null);
  const [editing, setEditing] = useState<string | null>(null); // package id, or "new"
  const [error, setError] = useState("");

  useEffect(() => {
    getMyListing()
      .then((l) => setPackages(l?.packages ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load packages"));
  }, []);

  async function handleCreate(data: PackageInput) {
    const created = await createPackage(data);
    setPackages((p) => [...(p ?? []), created]);
    setEditing(null);
  }

  async function handleUpdate(id: string, data: PackageInput) {
    const updated = await updatePackage(id, data);
    setPackages((p) => (p ?? []).map((pkg) => (pkg.id === id ? updated : pkg)));
    setEditing(null);
  }

  async function handleDelete(pkg: MyPackage) {
    if (!window.confirm(`Delete "${pkg.title}"?`)) return;
    setError("");
    try {
      await deletePackage(pkg.id);
      setPackages((p) => (p ?? []).filter((x) => x.id !== pkg.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the package");
    }
  }

  if (!packages) {
    return error ? (
      <p className="rounded-xl bg-coral-soft px-4 py-3 text-sm text-coral">{error}</p>
    ) : (
      <p className="text-black/50">Loading packages…</p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-black/55">
        Packages are what customers book. Choose a price per guest, one fixed package price, or a price per unit for each package. Add at least one to publish your listing.
      </p>

      {error && <p className="rounded-xl bg-coral-soft px-4 py-3 text-sm text-coral">{error}</p>}

      {packages.length === 0 && editing !== "new" && (
        <p className="rounded-xl border border-dashed border-black/20 bg-white px-4 py-8 text-center text-sm text-black/50">
          No packages yet.
        </p>
      )}

      {packages.map((pkg) =>
        editing === pkg.id ? (
          <PackageForm
            key={pkg.id}
            initial={pkg}
            onSave={(data) => handleUpdate(pkg.id, data)}
            onCancel={() => setEditing(null)}
          />
        ) : (
          <div key={pkg.id} className="flex items-start justify-between gap-4 rounded-2xl border border-black/10 bg-white p-5">
            <div className="min-w-0">
              <h3 className="font-semibold text-ink">{pkg.title}</h3>
              {pkg.description && <p className="mt-1 line-clamp-2 text-sm text-black/55">{pkg.description}</p>}
              <p className="mt-2 text-sm text-ink">
                {formatPackagePrice(pkg)} · {formatDuration(pkg.durationMinutes)}
                {normalizePricingType(pkg.pricingType) === "per_guest" && pkg.minPriceValue > 0 && (
                  <span className="text-black/55"> · minimum {rand(pkg.minPriceValue)}</span>
                )}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setEditing(pkg.id)}
                aria-label={`Edit ${pkg.title}`}
                className="rounded-full border border-black/15 p-2 hover:border-ink transition-colors"
              >
                <Pencil size={16} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(pkg)}
                aria-label={`Delete ${pkg.title}`}
                className="rounded-full border border-black/15 p-2 hover:border-coral hover:text-coral transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        )
      )}

      {editing === "new" ? (
        <PackageForm onSave={handleCreate} onCancel={() => setEditing(null)} />
      ) : (
        <button
          type="button"
          onClick={() => setEditing("new")}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-black/20 bg-white py-5 text-sm font-medium text-ink hover:border-coral hover:text-coral transition-colors"
        >
          <Plus size={18} /> Add a package
        </button>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  createPackage,
  deletePackage,
  getMyListing,
  updatePackage,
  type MyPackage,
  type PackageInput,
} from "@/lib/provider-api";

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

function PackageForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: MyPackage;
  onSave: (data: PackageInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial ? String(initial.priceValue) : "");
  const [minTotal, setMinTotal] = useState(
    initial && initial.minPriceValue > 0 ? String(initial.minPriceValue) : ""
  );
  const [duration, setDuration] = useState(initial?.durationMinutes ?? 60);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Keep odd durations (e.g. from older data) selectable instead of silently changing them.
  const options = DURATIONS.some(([m]) => m === duration)
    ? DURATIONS
    : [...DURATIONS, [duration, formatDuration(duration)] as [number, string]];

  async function submit() {
    const priceValue = Number(price);
    const minPriceValue = minTotal.trim() === "" ? 0 : Number(minTotal);
    if (!title.trim()) return setError("Give the package a title.");
    if (!Number.isInteger(priceValue) || priceValue < 1)
      return setError("Enter a price of at least R1, in whole rand.");
    if (!Number.isInteger(minPriceValue) || minPriceValue < 0)
      return setError("Minimum total must be a whole number, or leave it empty.");

    setSaving(true);
    setError("");
    try {
      await onSave({
        title: title.trim(),
        description,
        priceValue,
        minPriceValue,
        durationMinutes: duration,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the package");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-black/10 bg-white p-5">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Title</label>
        <input
          className={inputClass}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Full wedding setup"
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">What's included</label>
        <textarea
          className={inputClass}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Price per guest (R)</label>
          <input
            className={inputClass}
            inputMode="numeric"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="950"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Minimum total (R)</label>
          <input
            className={inputClass}
            inputMode="numeric"
            value={minTotal}
            onChange={(e) => setMinTotal(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink/50">Duration</label>
        <select className={inputClass} value={duration} onChange={(e) => setDuration(Number(e.target.value))}>
          {options.map(([m, label]) => (
            <option key={m} value={m}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {error && <p className="rounded-xl bg-coral-soft px-4 py-3 text-sm text-coral">{error}</p>}

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-black/15 px-5 py-2.5 text-sm font-medium hover:border-ink transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="rounded-full bg-coral px-6 py-2.5 text-sm font-semibold text-white hover:bg-coral-hover transition-colors disabled:opacity-60"
        >
          {saving ? "Saving…" : initial ? "Save changes" : "Add package"}
        </button>
      </div>
    </div>
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
        Packages are what customers book. Add at least one to publish your listing.
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
                {rand(pkg.priceValue)} per guest · {formatDuration(pkg.durationMinutes)}
                {pkg.minPriceValue > 0 && (
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

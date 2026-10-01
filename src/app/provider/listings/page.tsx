"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";
import { clsx } from "clsx";
import { getMyListing, setListingStatus, type MyListing } from "@/lib/provider-api";
import { locationLabel } from "@/lib/locations";
import { useLocationCoverage } from "@/components/locations/use-location-coverage";

export default function ListingsPage() {
  const [listing, setListing] = useState<MyListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toggling, setToggling] = useState(false);
  const { coverage, error: coverageError, retry: retryCoverage, isAreaLaunched } = useLocationCoverage();
  const awaitsLaunch = !!coverage && !!listing && !listing.areasServed.some(isAreaLaunched);

  useEffect(() => {
    getMyListing()
      .then(setListing)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function togglePublish() {
    if (!listing) return;
    setToggling(true);
    setError("");
    try {
      const updated = await setListingStatus(listing.status === "live" ? "draft" : "live");
      setListing({ ...listing, status: updated.status });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update listing");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-bold text-ink">Your listings</h1>
        {listing && (
          <Link
            href="/provider/listings/edit"
            className="rounded-full border border-black/15 bg-white px-5 py-2 text-sm font-medium hover:border-ink transition-colors"
          >
            Edit listing
          </Link>
        )}
      </div>
      <p className="-mt-6 mb-8 text-sm leading-relaxed text-black/55">Starting in Limpopo. Growing across South Africa. Providers nationwide can prepare their listings now.</p>

      {error && (
        <p className="mb-6 rounded-xl bg-coral-soft px-4 py-3 text-sm text-coral">{error}</p>
      )}

      {loading ? (
        <p className="text-black/50">Loading your listing…</p>
      ) : !listing ? (
        <div className="py-6">
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                src: "/images/provider-onboarding/about-business.png",
                title: "Introduce yourself or your company",
                body: "Create your provider profile, then share what you offer and where you work.",
              },
              {
                src: "/images/provider-onboarding/preview-listing.png",
                title: "Preview your listing",
                body: "See exactly what customers will see, before anyone else does.",
              },
              {
                src: "/images/provider-onboarding/stand-out.png",
                title: "Stand out to customers",
                body: "Add photos and packages that show off your best work.",
              },
            ].map((step) => (
              <div key={step.title}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-offwhite">
                  <Image
                    src={step.src}
                    alt=""
                    fill
                    sizes="(min-width: 640px) 33vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <h3 className="mt-4 font-semibold text-ink">{step.title}</h3>
                <p className="mt-1 text-sm text-black/55">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-center text-center">
            <p className="text-lg text-ink mb-6">Create a listing and get ready for customers.</p>
            <Link
              href="/provider/listings/new"
              className="inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 font-semibold text-white hover:bg-coral-hover transition-colors"
            >
              <Plus size={18} /> Create listing
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-md rounded-2xl border border-black/10 bg-white overflow-hidden">
          <div className="aspect-[4/3] bg-offwhite">
            {listing.media[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.media[0].url} alt={listing.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-sm text-black/40">
                No photos yet
              </div>
            )}
          </div>
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-semibold text-ink">{listing.name}</h2>
                <p className="text-sm text-black/55">{listing.category}</p>
              </div>
              <span
                className={clsx(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                  listing.status === "live" && !awaitsLaunch
                    ? "bg-green-100 text-green-800"
                    : "bg-black/5 text-black/60"
                )}
              >
                {listing.status === "live" ? !coverage ? "Published" : awaitsLaunch ? "Ready for launch" : "Live" : "Draft"}
              </span>
            </div>
            <p className="mt-3 text-sm text-black/55">
              {listing.areasServed.map(locationLabel).join(" · ")} · {listing.packages.length}{" "}
              {listing.packages.length === 1 ? "package" : "packages"} · {listing.media.length}{" "}
              {listing.media.length === 1 ? "photo" : "photos"}
            </p>
            <Link
              href="/provider/listings/edit?step=1"
              className="mt-4 inline-block text-sm font-medium text-coral underline underline-offset-4"
            >
              Edit provider profile
            </Link>
            {listing.status === "draft" && (
              <p className="mt-3 text-xs text-black/50">
                {listing.packages.length === 0 ? (
                  <>
                    Add at least one package to publish.{" "}
                    <Link href="/provider/listings/edit?step=5" className="font-medium text-coral">
                      Add a package
                    </Link>
                  </>
                ) : (
                  awaitsLaunch ? "Publish now to be ready for launch. Your listing stays hidden until one of your service provinces launches." : "Drafts are hidden from customers until you publish."
                )}
              </p>
            )}
            {listing.status === "live" && awaitsLaunch && <p className="mt-3 rounded-xl bg-offwhite p-3 text-sm leading-relaxed text-black/60">Your listing is published and ready. It remains hidden from customer search until one of your service provinces launches.</p>}
            {coverageError && <p className="mt-3 text-xs leading-relaxed text-black/50">Launch information is unavailable. Publishing does not confirm customer visibility. <button type="button" onClick={retryCoverage} className="font-medium text-coral underline">Check again</button></p>}
            <button
              onClick={togglePublish}
              disabled={toggling || (listing.status === "draft" && listing.packages.length === 0)}
              className={clsx(
                "mt-5 w-full rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50",
                listing.status === "live"
                  ? "border border-black/15 text-ink hover:border-ink"
                  : "bg-coral text-white hover:bg-coral-hover"
              )}
            >
              {toggling ? "Saving…" : listing.status === "live" ? "Unpublish" : "Publish listing"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

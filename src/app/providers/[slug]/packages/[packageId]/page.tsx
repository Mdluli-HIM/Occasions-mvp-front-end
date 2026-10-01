import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Clock, MapPin, Users, X } from "lucide-react";
import { fetchProvider } from "@/lib/api";
import { getServiceLabel } from "@/lib/taxonomy";
import { normalizePricingType } from "@/lib/pricing";
import { PackageList } from "@/components/providers/package-list";

export default async function PackagePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; packageId: string }>;
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { slug, packageId } = await params;
  const { eventId } = await searchParams;
  const provider = await fetchProvider(slug);
  if (!provider) notFound();
  const pkg = provider.packages.find((candidate) => candidate.id === packageId);
  if (!pkg) notFound();

  const providerPath = `/providers/${encodeURIComponent(provider.slug)}${eventId ? `?eventId=${encodeURIComponent(eventId)}` : ""}`;
  const photo = pkg.photoUrl || provider.media[0]?.url;
  const pricingType = normalizePricingType(pkg.pricingType);
  const hours = Math.floor(pkg.durationMinutes / 60);
  const minutes = pkg.durationMinutes % 60;
  const duration = [hours ? `${hours} ${hours === 1 ? "hour" : "hours"}` : "", minutes ? `${minutes} ${minutes === 1 ? "minute" : "minutes"}` : ""].filter(Boolean).join(" ");
  const capacity = pkg.minGuests != null && pkg.maxGuests != null ? `${pkg.minGuests}–${pkg.maxGuests} guests` : pkg.minGuests != null ? `${pkg.minGuests} or more guests` : pkg.maxGuests != null ? `Up to ${pkg.maxGuests} guests` : null;

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 px-5 py-8 sm:px-6 sm:py-10">
      <Link href={providerPath} className="inline-flex items-center gap-2 text-sm text-ink/60 hover:text-ink"><ArrowLeft size={16} />Back to {provider.name}</Link>
      <div>
        <p className="text-sm font-medium text-coral">{getServiceLabel(provider.serviceSlug, provider.category)}</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl">{pkg.title}</h1>
        <p className="mt-3 text-sm text-ink/60">Provided by <Link href={providerPath} className="font-medium text-ink underline underline-offset-4">{provider.name}</Link></p>
      </div>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-10">
        <div className="min-w-0 space-y-8">
          {photo && <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-black/5"><Image src={photo} alt={pkg.title} fill sizes="(min-width: 1024px) 720px, 100vw" className="object-cover" priority unoptimized={photo.startsWith("http")} /></div>}
          <section aria-labelledby="package-description">
            <h2 id="package-description" className="text-xl font-semibold text-ink">About this package</h2>
            <p className="mt-4 whitespace-pre-line break-words leading-relaxed text-ink/70">{pkg.description || "The provider has not added a package description yet."}</p>
          </section>
          {(duration || capacity || provider.areasServed.length > 0) && <section aria-label="Package essentials" className="grid gap-5 border-y border-black/10 py-6 sm:grid-cols-2">
            {duration && <div className="flex items-start gap-3"><Clock size={20} className="mt-0.5 shrink-0 text-ink/60" /><div><h3 className="text-sm font-medium text-ink">Duration</h3><p className="mt-1 text-sm text-ink/60">{duration}</p></div></div>}
            {capacity && <div className="flex items-start gap-3"><Users size={20} className="mt-0.5 shrink-0 text-ink/60" /><div><h3 className="text-sm font-medium text-ink">Event size</h3><p className="mt-1 text-sm text-ink/60">{capacity}</p></div></div>}
            {provider.areasServed.length > 0 && <div className="flex items-start gap-3 sm:col-span-2"><MapPin size={20} className="mt-0.5 shrink-0 text-ink/60" /><div><h3 className="text-sm font-medium text-ink">Available in</h3><p className="mt-1 text-sm leading-relaxed text-ink/60">{provider.areasServed.join(", ")}</p></div></div>}
          </section>}
          {(pkg.inclusions?.length > 0 || pkg.exclusions?.length > 0) && <div className="grid gap-8 sm:grid-cols-2">
            {pkg.inclusions?.length > 0 && <section aria-labelledby="package-inclusions"><h2 id="package-inclusions" className="text-xl font-semibold text-ink">What’s included</h2><ul className="mt-4 space-y-3">{pkg.inclusions.map((item, index) => <li key={`${index}-${item}`} className="flex items-start gap-3 text-sm leading-relaxed text-ink/70"><Check size={18} className="mt-0.5 shrink-0 text-ink" /><span className="break-words">{item}</span></li>)}</ul></section>}
            {pkg.exclusions?.length > 0 && <section aria-labelledby="package-exclusions"><h2 id="package-exclusions" className="text-xl font-semibold text-ink">Not included</h2><ul className="mt-4 space-y-3">{pkg.exclusions.map((item, index) => <li key={`${index}-${item}`} className="flex items-start gap-3 text-sm leading-relaxed text-ink/70"><X size={18} className="mt-0.5 shrink-0 text-ink/50" /><span className="break-words">{item}</span></li>)}</ul></section>}
          </div>}
          {(provider.guestRequirements || provider.cancellationNote || provider.accessibilityNote) && <section aria-labelledby="package-things-to-know" className="border-t border-black/10 pt-8">
            <h2 id="package-things-to-know" className="text-xl font-semibold text-ink">Things to know</h2>
            <div className="mt-5 space-y-5">
              {provider.guestRequirements && <div><h3 className="text-sm font-medium text-ink">Guest requirements</h3><p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink/60">{provider.guestRequirements}</p></div>}
              {provider.cancellationNote && <div><h3 className="text-sm font-medium text-ink">Cancellation policy</h3><p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink/60">{provider.cancellationNote}</p></div>}
              {provider.accessibilityNote && <div><h3 className="text-sm font-medium text-ink">Accessibility</h3><p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink/60">{provider.accessibilityNote}</p></div>}
            </div>
          </section>}
        </div>
        <aside aria-label="Package price and booking" className="space-y-4 rounded-3xl border border-black/10 bg-white p-6 lg:sticky lg:top-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/50">{pricingType === "fixed" ? "Fixed package price" : pricingType === "per_unit" ? "Price per unit" : "Price per guest"}</p>
          <PackageList provider={provider} packages={[pkg]} eventId={eventId} detail />
          <p className="border-t border-black/10 pt-4 text-xs leading-relaxed text-ink/50">Review your date, event details and total in the cart. Your provider confirms the booking after you request it.</p>
          <Link href={`${providerPath}#services`} className="inline-block text-sm font-medium text-ink underline underline-offset-4">Explore more packages</Link>
        </aside>
      </div>
    </main>
  );
}

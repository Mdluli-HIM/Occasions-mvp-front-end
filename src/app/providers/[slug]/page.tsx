import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchProvider } from "@/lib/api";
import { PackageList } from "@/components/providers/package-list";
import { ProviderGallery } from "@/components/providers/provider-gallery";
import { ProviderProfileCard } from "@/components/providers/provider-profile-card";
import { getServiceLabel } from "@/lib/taxonomy";
import { providerPriceLabel } from "@/lib/pricing";
import { Star, Users, Accessibility, CalendarX } from "lucide-react";

export default async function ProviderPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ eventId?: string }>;
}) {
  const { slug } = await params;
  const { eventId } = await searchParams;
  const provider = await fetchProvider(slug);

  if (!provider) notFound();

  const serviceLabel = getServiceLabel(provider.serviceSlug, provider.category);
  const priceLabels = providerPriceLabel(provider.packages);

  return (
    <main className="w-full max-w-6xl mx-auto px-5 sm:px-6 py-8 sm:py-10 space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 lg:gap-10 items-start">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="provider-portfolio-title" className="space-y-4">
            <h2 id="provider-portfolio-title" className="text-xl sm:text-2xl font-semibold text-ink">
              My portfolio
            </h2>
            <ProviderGallery photos={provider.media} alt={provider.name} />
          </section>

          <div>
            <p className="text-sm font-medium text-coral">{serviceLabel}</p>
            <h1 className="text-2xl font-bold text-ink mt-1">{provider.name}</h1>
            <p className="text-ink/70 mt-1">{provider.tagline}</p>
            {provider.reviewCount > 0 && (
              <div className="flex items-center gap-1 mt-2 text-sm text-ink">
                <Star size={14} className="fill-ink text-ink" />
                <span className="font-medium">{provider.rating.toFixed(1)}</span>
                <span className="text-ink/50">
                  · {provider.reviewCount} review{provider.reviewCount > 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {provider.areasServed.map((area) => (
              <span
                key={area}
                className="rounded-full bg-coral-soft text-coral text-xs font-medium px-3 py-1"
              >
                {area}
              </span>
            ))}
          </div>

          {provider.description && (
            <p className="text-ink/80 leading-relaxed whitespace-pre-line">
              {provider.description}
            </p>
          )}
        </div>

        <aside className="w-full space-y-5 lg:sticky lg:top-6" aria-label="Provider information">
          {priceLabels.length > 0 && (
            <div className="rounded-3xl border border-black/10 bg-white p-6 space-y-2">
              {priceLabels.map((label) => (
                <p key={label} className="text-lg font-semibold text-ink">{label}</p>
              ))}
            </div>
          )}
          <ProviderProfileCard provider={provider} serviceLabel={serviceLabel} />
        </aside>
      </div>

      <div id="services" className="scroll-mt-6 border-t border-black/10 pt-8">
        <h2 className="text-lg font-semibold text-ink mb-4">
          {serviceLabel} services
        </h2>
        <PackageList provider={provider} packages={provider.packages} eventId={eventId} />
      </div>

      {provider.qualifications.length > 0 && (
        <div className="border-t border-black/10 pt-8">
          <h2 className="text-lg font-semibold text-ink mb-4">My qualifications</h2>
          <div className="rounded-2xl border border-black/10 bg-white p-6 flex items-start gap-6 flex-col sm:flex-row">
            <div className="flex items-center gap-3 shrink-0">
              <div className="h-16 w-16 rounded-full bg-coral-soft text-coral flex items-center justify-center text-xl font-semibold overflow-hidden relative">
                {provider.media[0] && (
                  <Image
                    src={provider.media[0].url}
                    alt={provider.name}
                    fill
                    className="object-cover"
                    unoptimized={provider.media[0].url.startsWith("http")}
                  />
                )}
              </div>
            </div>
            <div className="space-y-4 flex-1">
              {provider.qualifications.map((q) => (
                <div key={q.id}>
                  <p className="font-medium text-ink text-sm">{q.title}</p>
                  <p className="text-sm text-ink/60 mt-0.5">{q.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(provider.guestRequirements ||
        provider.accessibilityNote ||
        provider.cancellationNote) && (
        <div className="border-t border-black/10 pt-8">
          <h2 className="text-lg font-semibold text-ink mb-4">Things to know</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {provider.guestRequirements && (
              <div className="flex gap-3">
                <Users size={20} className="text-ink/60 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-ink text-sm">Guest requirements</p>
                  <p className="text-sm text-ink/60 mt-0.5">
                    {provider.guestRequirements}
                  </p>
                </div>
              </div>
            )}
            {provider.accessibilityNote && (
              <div className="flex gap-3">
                <Accessibility size={20} className="text-ink/60 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-ink text-sm">Accessibility</p>
                  <p className="text-sm text-ink/60 mt-0.5">
                    {provider.accessibilityNote}
                  </p>
                </div>
              </div>
            )}
            {provider.cancellationNote && (
              <div className="flex gap-3">
                <CalendarX size={20} className="text-ink/60 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-ink text-sm">Cancellation policy</p>
                  <p className="text-sm text-ink/60 mt-0.5">
                    {provider.cancellationNote}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

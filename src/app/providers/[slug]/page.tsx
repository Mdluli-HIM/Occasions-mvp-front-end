import Image from "next/image";
import { notFound } from "next/navigation";
import { fetchProvider } from "@/lib/api";
import { PackageList } from "@/components/providers/package-list";
import { SERVICES } from "@/lib/taxonomy";
import { Star, Users, Accessibility, CalendarX } from "lucide-react";

export default async function ProviderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const provider = await fetchProvider(slug);

  if (!provider) notFound();

  const serviceLabel =
    SERVICES.find((s) => s.slug === provider.serviceSlug)?.label ?? provider.category;
  const heroPhoto = provider.media[0]?.url ?? "/next.svg";
  const galleryPhotos = provider.media.slice(1);
  const cheapest = [...provider.packages].sort((a, b) => a.priceValue - b.priceValue)[0];

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-6">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black/5">
            <Image src={heroPhoto} alt={provider.name} fill className="object-cover" />
          </div>

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

        {cheapest && (
          <div className="rounded-2xl border border-black/10 bg-white p-6 h-fit space-y-1">
            <p className="text-sm text-ink/60">From</p>
            <p className="text-xl font-semibold text-ink">
              R {cheapest.priceValue.toLocaleString("en-ZA")} ZAR
              <span className="text-sm font-normal text-ink/60"> / guest</span>
            </p>
          </div>
        )}
      </div>

      <div className="border-t border-black/10 pt-8">
        <h2 className="text-lg font-semibold text-ink mb-4">
          {serviceLabel} services
        </h2>
        <PackageList provider={provider} packages={provider.packages} />
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

      {galleryPhotos.length > 0 && (
        <div className="border-t border-black/10 pt-8">
          <h2 className="text-lg font-semibold text-ink mb-4">My portfolio</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {galleryPhotos.map((photo) => (
              <div
                key={photo.id}
                className="relative aspect-square overflow-hidden rounded-2xl bg-black/5"
              >
                <Image
                  src={photo.url}
                  alt={provider.name}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
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

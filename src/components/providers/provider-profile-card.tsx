import Image from "next/image";
import { ArrowDown, Star } from "lucide-react";
import type { Provider } from "@/lib/api";

export function ProviderProfileCard({
  provider,
  serviceLabel,
}: {
  provider: Provider;
  serviceLabel: string;
}) {
  const profileName = provider.profileName?.trim();
  const portraitName = profileName || provider.name;
  const bio = provider.profileBio?.trim() || provider.tagline?.trim();
  const cover = provider.media.find((photo) => photo.url.trim())?.url;
  const portrait = provider.profilePhotoUrl?.trim();
  const company = provider.providerType === "company";
  const identityLabel = company
    ? "Company"
    : provider.providerType === "individual"
      ? "Individual provider"
      : null;
  const initials = portraitName
    .split(/\s+/)
    .filter((word) => word && word !== "&")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  const years = provider.yearsExperience;
  const experience = typeof years === "number" && years > 0
    ? `${years} ${years === 1 ? "year" : "years"} of experience`
    : null;

  return (
    <section aria-labelledby="provider-profile-heading" className="min-w-0 text-center">
      {cover && (
        <div className="relative aspect-[2/1] w-full overflow-hidden rounded-2xl">
          <Image
            src={cover}
            alt=""
            fill
            priority
            sizes="(min-width: 1024px) 320px, (min-width: 640px) calc(100vw - 48px), calc(100vw - 40px)"
            unoptimized={cover.startsWith("http")}
            className="object-cover"
          />
        </div>
      )}

      <div className={`relative mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-coral-soft text-xl font-semibold text-coral ring-4 ring-offwhite sm:h-24 sm:w-24 sm:text-2xl ${cover ? "-mt-10 sm:-mt-12" : "mt-2"}`}>
        {portrait ? (
          <Image
            src={portrait}
            alt={company ? `${portraitName} logo` : portraitName}
            fill
            sizes="(min-width: 640px) 96px, 80px"
            unoptimized={portrait.startsWith("http")}
            className={company ? "object-contain p-3" : "object-cover"}
          />
        ) : (
          <span aria-hidden="true">{initials || "O"}</span>
        )}
      </div>

      <div className="mx-auto max-w-lg px-2 pt-5 sm:px-4">
        <h2 id="provider-profile-heading" className="text-xl font-semibold leading-tight tracking-tight text-ink break-words">
          {portraitName}
        </h2>
        {bio && (
          <p className="mt-4 text-sm leading-relaxed text-ink/60 whitespace-pre-line break-words">
            {bio}
          </p>
        )}

        <div className="mt-5 space-y-2 text-sm leading-relaxed">
          <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-ink/85">
            {provider.reviewCount > 0 && (
              <>
                <span className="inline-flex items-center gap-1">
                  <Star size={14} aria-hidden="true" className="fill-ink text-ink" />
                  <span className="font-medium">{provider.rating.toFixed(1)}</span>
                  <span className="text-ink/55">· {provider.reviewCount} {provider.reviewCount === 1 ? "review" : "reviews"}</span>
                </span>
                <span aria-hidden="true" className="text-ink/40">·</span>
              </>
            )}
            <span>{serviceLabel}</span>
          </p>
          {provider.areasServed.length > 0 && (
            <p className="text-ink/60 break-words">
              Serving {provider.areasServed.slice(0, 3).join(", ")}
              {provider.areasServed.length > 3 && ` + ${provider.areasServed.length - 3} more`}
            </p>
          )}
          {(identityLabel || experience) && (
            <p className="text-ink/55">{[identityLabel, experience].filter(Boolean).join(" · ")}</p>
          )}
        </div>

        {provider.packages.length > 0 && <a
          href="#services"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-sm px-2 py-2 text-sm font-medium text-ink underline decoration-black/25 underline-offset-4 transition-colors hover:decoration-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-coral"
        >
          Explore packages <ArrowDown size={15} aria-hidden="true" />
        </a>}
      </div>
    </section>
  );
}

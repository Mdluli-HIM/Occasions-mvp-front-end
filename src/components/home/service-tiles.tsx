import Image from "next/image";
import Link from "next/link";
import { Armchair, Camera, Flower2, Music, Snowflake, Sparkles, Tent, Toilet, Utensils } from "lucide-react";
import { SERVICES, type ServiceSlug } from "@/lib/taxonomy";
import { getCategoryImages } from "@/lib/category-images";
import { ScrollRow } from "@/components/home/scroll-row";

const FALLBACK_ICONS = {
  catering: Utensils,
  tents: Tent,
  decor: Flower2,
  "sound-dj": Music,
  photography: Camera,
  "chairs-tables": Armchair,
  "mobile-toilets": Toilet,
  "mobile-fridges": Snowflake,
  other: Sparkles,
} satisfies Record<ServiceSlug, typeof Sparkles>;

export async function ServiceTiles({ availableServices }: { availableServices?: string[] }) {
  const images = await getCategoryImages();
  return (
    <ScrollRow title="Services for your occasion">
      {SERVICES.map((service) => {
        const image = images[service.slug];
        const Icon = FALLBACK_ICONS[service.slug];
        const available = !availableServices || availableServices.includes(service.slug);
        const className = "group flex w-[120px] shrink-0 snap-start flex-col items-center rounded-xl px-1 py-2 text-center outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 sm:w-[136px]";
        const content = <>
            <div className="relative flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
              {image ? (
                <Image
                  src={image}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 128px, 112px"
                  className="object-contain transition-transform duration-200 motion-safe:group-hover:scale-105"
                />
              ) : (
                <Icon size={56} strokeWidth={1.4} className="text-ink/65" aria-hidden="true" />
              )}
            </div>
            <span className="mt-3 flex min-h-10 items-center justify-center text-sm font-medium leading-5 text-ink transition-colors group-hover:text-coral">
              {service.label}
            </span>
            {!available && <span className="text-xs text-ink/50">Coming soon</span>}
        </>;
        return available ? <Link key={service.slug} href={`/search?services=${service.slug}`} className={className}>{content}</Link>
          : <div key={service.slug} className={className} aria-label={`${service.label}, coming soon`}>{content}</div>;
      })}
    </ScrollRow>
  );
}

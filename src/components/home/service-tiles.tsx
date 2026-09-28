import Image from "next/image";
import Link from "next/link";
import { SERVICES } from "@/lib/taxonomy";
import { ScrollRow } from "@/components/home/scroll-row";

const TILE_IMAGES: Record<string, string> = {
  catering: "/images/services/catering.jpg",
  tents: "/images/services/tents.jpg",
  decor: "/images/services/decor.jpg",
  "sound-dj": "/images/services/sound.jpg",
  photography: "/images/services/photography.jpg",
  "chairs-tables": "/images/services/chairs.jpg",
  "mobile-toilets": "/images/services/toilets.jpg",
  "mobile-fridges": "/images/services/fridges.jpg",
};

export function ServiceTiles() {
  return (
    <ScrollRow title="Services in Limpopo">
      {SERVICES.map((s) => (
        <Link key={s.slug} href={`/search?services=${s.slug}`} className="group w-[160px] shrink-0 snap-start">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-offwhite">
            <Image
              src={TILE_IMAGES[s.slug] ?? "/next.svg"}
              alt=""
              fill
              sizes="160px"
              className="object-cover group-hover:scale-105 transition-transform"
            />
          </div>
          <p className="mt-2 text-sm font-medium text-ink">{s.label}</p>
        </Link>
      ))}
    </ScrollRow>
  );
}

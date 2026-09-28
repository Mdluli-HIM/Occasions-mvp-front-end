import type { Provider } from "@/lib/api";
import { ProviderCard } from "@/components/home/provider-card";
import { ScrollRow } from "@/components/home/scroll-row";

export function ProviderRow({
  title,
  titleHref,
  providers,
  priority = false,
}: {
  title: string;
  titleHref?: string;
  providers: Provider[];
  priority?: boolean;
}) {
  return (
    <ScrollRow title={title} titleHref={titleHref}>
      {providers.map((p, i) => (
        <ProviderCard
          key={p.id}
          provider={p}
          sizes="230px"
          priority={priority && i < 4}
          className="w-[230px] shrink-0 snap-start"
        />
      ))}
    </ScrollRow>
  );
}

import { notFound } from "next/navigation";
import { fetchProvider } from "@/lib/api";
import { BookingForm } from "@/components/providers/booking-form";

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string; packageId: string }>;
}) {
  const { slug, packageId } = await params;
  const provider = await fetchProvider(slug);

  if (!provider) notFound();
  const pkg = provider.packages.find((p) => p.id === packageId);
  if (!pkg) notFound();

  return (
    <main className="max-w-2xl mx-auto px-6 py-10">
      <h1 className="text-xl font-bold text-ink mb-6">Schedule your booking</h1>
      <BookingForm provider={provider} pkg={pkg} />
    </main>
  );
}

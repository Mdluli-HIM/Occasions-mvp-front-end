import { notFound } from "next/navigation";
import { fetchCheckoutBookings } from "@/lib/api";

export default async function CheckoutConfirmationPage({
  params,
}: {
  params: Promise<{ checkoutId: string }>;
}) {
  const { checkoutId } = await params;
  const bookings = await fetchCheckoutBookings(checkoutId).catch(() => null);

  if (!bookings || bookings.length === 0) notFound();

  const total = bookings.reduce((sum, b) => sum + b.totalPrice, 0);

  return (
    <main className="max-w-lg mx-auto px-6 py-10 space-y-6">
      <div>
        <div className="rounded-full bg-coral-soft text-coral text-xs font-medium px-3 py-1 w-fit mb-3">
          Pending confirmation
        </div>
        <h1 className="text-xl font-bold text-ink">
          {bookings.length} service{bookings.length > 1 ? "s" : ""} booked
        </h1>
        <p className="text-ink/70 text-sm mt-1">
          Each provider will confirm their booking shortly.
        </p>
      </div>

      <div className="space-y-3">
        {bookings.map((b) => (
          <div
            key={b.id}
            className="rounded-2xl border border-black/10 bg-white p-4 space-y-1"
          >
            <p className="font-medium text-ink">{b.package.title}</p>
            <p className="text-sm text-ink/60">{b.provider.name}</p>
            <div className="flex justify-between text-sm text-ink/70 pt-1">
              <span>
                {b.eventDate} · {b.startTime}
              </span>
              <span className="font-medium text-ink">
                R {b.totalPrice.toLocaleString("en-ZA")} ZAR
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-5 flex items-center justify-between font-semibold text-ink">
        <span>Total paid</span>
        <span>R {total.toLocaleString("en-ZA")} ZAR</span>
      </div>
    </main>
  );
}

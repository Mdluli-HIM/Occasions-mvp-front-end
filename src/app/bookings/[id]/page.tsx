import { notFound } from "next/navigation";
import { fetchBooking } from "@/lib/api";
import { formatTime12h } from "@/lib/time-slots";

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await fetchBooking(id);

  if (!booking) notFound();

  return (
    <main className="max-w-lg mx-auto px-6 py-10">
      <div className="rounded-2xl border border-black/10 bg-white p-6 space-y-4">
        <div className="rounded-full bg-coral-soft text-coral text-xs font-medium px-3 py-1 w-fit">
          {booking.status}
        </div>
        <h1 className="text-xl font-bold text-ink">Booking request sent</h1>
        <p className="text-ink/70 text-sm">
          {booking.provider.name} will confirm your booking shortly.
        </p>

        <div className="border-t border-black/10 pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-ink/60">Package</span>
            <span className="text-ink font-medium">{booking.package.title}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/60">Date</span>
            <span className="text-ink">{booking.eventDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/60">Time</span>
            <span className="text-ink">{formatTime12h(booking.startTime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink/60">Guests</span>
            <span className="text-ink">{booking.guests}</span>
          </div>
          <div className="flex justify-between font-semibold pt-2 border-t border-black/10">
            <span className="text-ink">Total</span>
            <span className="text-ink">R {booking.totalPrice.toLocaleString("en-ZA")} ZAR</span>
          </div>
        </div>
      </div>
    </main>
  );
}

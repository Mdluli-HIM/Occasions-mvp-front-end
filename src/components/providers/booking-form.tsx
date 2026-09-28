"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Provider, Package } from "@/lib/api";
import { createBooking } from "@/lib/api";
import { generateTimeSlots, formatTime12h } from "@/lib/time-slots";

export function BookingForm({ provider, pkg }: { provider: Provider; pkg: Package }) {
  const router = useRouter();
  const [eventDate, setEventDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [guests, setGuests] = useState(1);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const slots = generateTimeSlots(provider.workingHoursStart, provider.workingHoursEnd);
  const totalPrice = pkg.priceValue * guests;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!eventDate || !startTime) {
      setErrorMsg("Please choose a date and time.");
      return;
    }
    const form = new FormData(e.currentTarget);
    setStatus("submitting");
    setErrorMsg("");

    try {
      const booking = await createBooking({
        packageId: pkg.id,
        guestName: String(form.get("name")),
        guestEmail: String(form.get("email")),
        guestPhone: String(form.get("phone")),
        guests,
        eventDate,
        startTime,
      });
      router.push(`/bookings/${booking.id}`);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-black/10 bg-white p-5 flex items-center justify-between">
        <div>
          <p className="font-medium text-ink">{pkg.title}</p>
          <p className="text-sm text-ink/60">{provider.name}</p>
        </div>
        <p className="font-semibold text-ink">R {pkg.priceValue.toLocaleString("en-ZA")} ZAR</p>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <label className="font-medium text-ink" htmlFor="guests">
            Guests
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setGuests((g) => Math.max(1, g - 1))}
              className="h-8 w-8 rounded-full border border-black/20 text-ink hover:bg-black/5"
            >
              −
            </button>
            <span className="w-6 text-center text-ink">{guests}</span>
            <button
              type="button"
              onClick={() => setGuests((g) => g + 1)}
              className="h-8 w-8 rounded-full border border-black/20 text-ink hover:bg-black/5"
            >
              +
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-ink" htmlFor="eventDate">
            Date
          </label>
          <input
            id="eventDate"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-ink outline-none focus:border-coral"
            required
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-ink">Time</p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setStartTime(slot)}
                className={`rounded-lg border px-3 py-2 text-sm transition-colors duration-150 ${
                  startTime === slot
                    ? "bg-ink text-white border-ink"
                    : "border-black/15 text-ink hover:border-coral"
                }`}
              >
                {formatTime12h(slot)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-5 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-ink">Your name</label>
          <input
            name="name"
            required
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-ink outline-none focus:border-coral"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-ink">Email</label>
          <input
            type="email"
            name="email"
            required
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-ink outline-none focus:border-coral"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-ink">Phone</label>
          <input
            type="tel"
            name="phone"
            required
            className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-ink outline-none focus:border-coral"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-5 flex items-center justify-between">
        <p className="font-medium text-ink">Total</p>
        <p className="font-semibold text-ink">R {totalPrice.toLocaleString("en-ZA")} ZAR</p>
      </div>

      {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-full bg-coral text-white font-medium py-3 hover:bg-coral-hover transition-colors duration-150 disabled:opacity-60"
      >
        {status === "submitting" ? "Confirming..." : "Confirm and pay"}
      </button>
      <p className="text-xs text-ink/50 text-center">
        No payment will be taken yet — payment integration is coming soon.
      </p>
    </form>
  );
}

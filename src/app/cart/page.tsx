"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/cart-store";
import { checkoutCart } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { Trash2 } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { items, removeItem, updateItem, clear } = useCartStore();
  const { user, token } = useAuthStore();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!user) router.replace("/login?redirect=/cart");
  }, [user, router]);

  const total = items.reduce((sum, i) => sum + i.priceValue * i.guests, 0);
  const allScheduled = items.every((i) => i.eventDate && i.startTime);

  async function handleCheckout(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!allScheduled) {
      setErrorMsg("Please pick a date and time for every service before paying.");
      return;
    }
    const form = new FormData(e.currentTarget);
    setStatus("submitting");
    setErrorMsg("");

    try {
      const { checkoutId } = await checkoutCart({
        token: token!,
        guestName: String(form.get("name")),
        guestEmail: String(form.get("email")),
        guestPhone: String(form.get("phone")),
        items: items.map((i) => ({
          packageId: i.packageId,
          guests: i.guests,
          eventDate: i.eventDate,
          startTime: i.startTime,
        })),
      });
      clear();
      router.push(`/checkout/${checkoutId}`);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (!user) return null;

  if (items.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-16 text-center space-y-3">
        <h1 className="text-xl font-bold text-ink">Your cart is empty</h1>
        <p className="text-ink/60">Browse providers and add services for your event.</p>
        <Link
          href="/"
          className="inline-block rounded-full bg-coral text-white font-medium px-6 py-3 hover:bg-coral-hover transition-colors duration-150"
        >
          Browse providers
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-6 py-10 space-y-6">
      <h1 className="text-xl font-bold text-ink">Your event</h1>
      <p className="text-ink/60 text-sm">
        Set a date and time for each service, then pay for everything at once.
      </p>

      <div className="space-y-4">
        {items.map((item) => (
          <div
            key={item.packageId}
            className="rounded-2xl border border-black/10 bg-white p-4 space-y-3"
          >
            <div className="flex gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-black/5">
                {item.photoUrl && (
                  <Image
                    src={item.photoUrl}
                    alt={item.packageTitle}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-ink">{item.packageTitle}</p>
                <p className="text-sm text-ink/60">{item.providerName}</p>
                <p className="text-sm text-ink">
                  R {item.priceValue.toLocaleString("en-ZA")} ZAR / guest
                </p>
              </div>
              <button
                onClick={() => removeItem(item.packageId)}
                className="self-start text-ink/40 hover:text-red-600"
                aria-label="Remove"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs text-ink/60">Date</label>
                <input
                  type="date"
                  value={item.eventDate}
                  onChange={(e) =>
                    updateItem(item.packageId, { eventDate: e.target.value })
                  }
                  className="w-full rounded-lg border border-black/15 px-2 py-1.5 text-sm text-ink outline-none focus:border-coral"
                />
              </div>
              <div>
                <label className="text-xs text-ink/60">Time</label>
                <input
                  type="time"
                  value={item.startTime}
                  onChange={(e) =>
                    updateItem(item.packageId, { startTime: e.target.value })
                  }
                  className="w-full rounded-lg border border-black/15 px-2 py-1.5 text-sm text-ink outline-none focus:border-coral"
                />
              </div>
              <div>
                <label className="text-xs text-ink/60">Guests</label>
                <input
                  type="number"
                  min={1}
                  value={item.guests}
                  onChange={(e) =>
                    updateItem(item.packageId, {
                      guests: Math.max(1, Number(e.target.value)),
                    })
                  }
                  className="w-full rounded-lg border border-black/15 px-2 py-1.5 text-sm text-ink outline-none focus:border-coral"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleCheckout} className="space-y-4">
        <div className="rounded-2xl border border-black/10 bg-white p-5 space-y-4">
          <h2 className="font-semibold text-ink">Your details</h2>
          <div className="space-y-1">
            <label className="text-sm font-medium text-ink">Name</label>
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
          <p className="font-medium text-ink">
            Total ({items.length} service{items.length > 1 ? "s" : ""})
          </p>
          <p className="text-lg font-semibold text-ink">
            R {total.toLocaleString("en-ZA")} ZAR
          </p>
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
    </main>
  );
}

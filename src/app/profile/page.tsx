"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { User, Mail, Phone, LogOut, CalendarDays } from "lucide-react";
import { fetchMyBookings, type Booking } from "@/lib/api";

const STATUS_STYLES: Record<string, string> = {
  Pending: "bg-amber-100 text-amber-800",
  Confirmed: "bg-green-100 text-green-800",
  Cancelled: "bg-black/5 text-black/55",
};

const rand = (n: number) => `R${n.toLocaleString("en-ZA")}`;

function formatDate(eventDate: string) {
  const d = new Date(`${eventDate}T00:00:00`);
  return isNaN(d.getTime())
    ? eventDate
    : d.toLocaleDateString("en-ZA", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, token, logout } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [bookingsError, setBookingsError] = useState("");

  useEffect(() => {
    if (!user) router.replace("/login?redirect=/profile");
  }, [user, router]);

  useEffect(() => {
    if (!token) return;
    fetchMyBookings(token)
      .then(setBookings)
      .catch((e) => setBookingsError(e instanceof Error ? e.message : "Could not load your bookings"));
  }, [token]);

  if (!user) return null;

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-offwhite px-4 py-10">
      <div className="max-w-md mx-auto rounded-3xl bg-white shadow-sm p-10 space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-coral-soft text-coral flex items-center justify-center text-xl font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">{user.name}</h1>
            <p className="text-sm text-ink/60 capitalize">{user.role}</p>
          </div>
        </div>

        <div className="space-y-4 border-t border-black/10 pt-6">
          <div className="flex items-center gap-3 text-sm">
            <Mail size={16} className="text-ink/40" />
            <span className="text-ink">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone size={16} className="text-ink/40" />
            <span className="text-ink">{user.phone || "No phone on file"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <User size={16} className="text-ink/40" />
            <span className="text-ink capitalize">{user.role} account</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-full border border-black/15 text-ink font-medium py-3 hover:bg-black/5 transition-colors duration-150"
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>
      <div className="max-w-2xl mx-auto mt-6 rounded-3xl bg-white shadow-sm p-10 space-y-5">
        <h2 className="text-lg font-bold text-ink">Your bookings</h2>
        {bookingsError ? (
          <p className="rounded-xl bg-coral-soft px-4 py-3 text-sm text-coral">{bookingsError}</p>
        ) : bookings === null ? (
          <p className="text-sm text-black/50">Loading…</p>
        ) : bookings.length === 0 ? (
          <p className="text-sm text-black/50">
            No bookings yet. Bookings made while you're logged in will show up here.
          </p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-4 rounded-2xl border border-black/10 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink truncate">{b.package.title}</p>
                  <p className="text-sm text-black/55 truncate">{b.provider.name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-black/55">
                    <CalendarDays size={14} /> {formatDate(b.eventDate)} · {b.startTime}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[b.status] ?? "bg-black/5 text-black/55"}`}>
                    {b.status}
                  </span>
                  <p className="mt-1 text-sm font-medium text-ink">{rand(b.totalPrice)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

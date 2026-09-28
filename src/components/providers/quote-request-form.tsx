"use client";

import { useState } from "react";
import { submitQuickEnquiry } from "@/lib/api";

export function QuoteRequestForm({
  providerId,
  providerName,
}: {
  providerId: string;
  providerName: string;
}) {
  const [status, setStatus] = useState<"idle" | "submitting" | "sent" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus("submitting");
    setErrorMsg("");

    try {
      await submitQuickEnquiry({
        providerId,
        name: String(form.get("name")),
        email: String(form.get("email")),
        phone: String(form.get("phone")),
        message: String(form.get("message")),
      });
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-black/10 bg-coral-soft p-6">
        <p className="font-medium text-ink">Request sent!</p>
        <p className="text-sm text-ink/70 mt-1">
          {providerName} will get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-black/10 bg-white p-6 space-y-4"
    >
      <h3 className="font-semibold text-lg text-ink">Request a quote</h3>

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

      <div className="space-y-1">
        <label className="text-sm font-medium text-ink">Message</label>
        <textarea
          name="message"
          rows={3}
          placeholder="Tell them about your event..."
          className="w-full rounded-lg border border-black/15 px-3 py-2 text-sm text-ink outline-none focus:border-coral"
        />
      </div>

      {status === "error" && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full rounded-full bg-coral text-white font-medium py-3 hover:bg-coral-hover transition-colors duration-150 disabled:opacity-60"
      >
        {status === "submitting" ? "Sending..." : "Send request"}
      </button>
    </form>
  );
}

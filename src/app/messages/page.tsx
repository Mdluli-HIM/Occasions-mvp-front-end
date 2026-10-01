import { Suspense } from "react";
import type { Metadata } from "next";
import { MessagingInbox } from "@/components/messages/messaging-inbox";

export const metadata: Metadata = { title: "Messages | Occasions", description: "Talk privately with event service providers on Occasions." };
export default function MessagesPage() {
  return <Suspense fallback={<main className="mx-auto max-w-7xl px-6 py-12"><p role="status" className="text-ink/60">Loading messages…</p></main>}><MessagingInbox /></Suspense>;
}

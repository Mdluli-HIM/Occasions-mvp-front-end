import { EventWorkspace } from "@/components/events/event-workspace";

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventWorkspace key={id} eventId={id} />;
}

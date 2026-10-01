import { EventForm } from "@/components/events/event-form";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EventForm key={id} eventId={id} />;
}

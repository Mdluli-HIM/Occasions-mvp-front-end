import CustomerBookingPage from "@/components/bookings/customer-booking-page";

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerBookingPage kind="booking" id={id} />;
}

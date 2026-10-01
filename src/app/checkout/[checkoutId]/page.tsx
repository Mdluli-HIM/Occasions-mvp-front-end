import CustomerBookingPage from "@/components/bookings/customer-booking-page";

export default async function CheckoutConfirmationPage({
  params,
}: {
  params: Promise<{ checkoutId: string }>;
}) {
  const { checkoutId } = await params;
  return <CustomerBookingPage kind="checkout" id={checkoutId} />;
}

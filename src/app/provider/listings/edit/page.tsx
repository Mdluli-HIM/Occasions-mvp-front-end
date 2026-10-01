import { ListingForm } from "@/components/provider/listing-form";

export default async function EditListingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const { step } = await searchParams;
  const parsed = Number(step);
  return <ListingForm mode="edit" initialStep={Number.isInteger(parsed) ? Math.min(Math.max(parsed, 0), 5) : 0} />;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type Package = {
  id: string;
  providerId: string;
  title: string;
  description: string;
  photoUrl: string;
  priceValue: number;
  minPriceValue: number;
  durationMinutes: number;
};

export type Qualification = {
  id: string;
  title: string;
  detail: string;
};

export type Provider = {
  id: string;
  slug: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  areasServed: string[];
  serviceSlug: string;
  workingHoursStart: string;
  workingHoursEnd: string;
  rating: number;
  reviewCount: number;
  guestRequirements: string;
  accessibilityNote: string;
  cancellationNote: string;
  media: { id: string; url: string }[];
  packages: Package[];
  qualifications: Qualification[];
};

export type Booking = {
  id: string;
  providerId: string;
  packageId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guests: number;
  eventDate: string;
  startTime: string;
  totalPrice: number;
  status: string;
  package: Package;
  provider: Provider;
};

export async function fetchProviders(params: {
  area?: string;
  services?: string;
  minPrice?: string;
  maxPrice?: string;
}): Promise<Provider[]> {
  const qs = new URLSearchParams();
  if (params.area) qs.set("area", params.area);
  if (params.services) qs.set("services", params.services);
  if (params.minPrice) qs.set("minPrice", params.minPrice);
  if (params.maxPrice) qs.set("maxPrice", params.maxPrice);

  const res = await fetch(`${API_URL}/api/providers?${qs.toString()}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch providers");
  return res.json();
}

export async function fetchProvider(slug: string): Promise<Provider | null> {
  const res = await fetch(`${API_URL}/api/providers/${slug}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch provider");
  return res.json();
}

export async function createBooking(data: {
  packageId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  guests: number;
  eventDate: string;
  startTime: string;
}): Promise<Booking> {
  const res = await fetch(`${API_URL}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Failed to create booking");
  }
  return res.json();
}

export async function fetchBooking(id: string): Promise<Booking | null> {
  const res = await fetch(`${API_URL}/api/bookings/${id}`, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch booking");
  return res.json();
}

export async function checkoutCart(data: {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  items: {
    packageId: string;
    guests: number;
    eventDate: string;
    startTime: string;
  }[];
}): Promise<{ checkoutId: string; bookings: Booking[] }> {
  const res = await fetch(`${API_URL}/api/bookings/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Checkout failed");
  }
  return res.json();
}

export async function fetchCheckoutBookings(checkoutId: string): Promise<Booking[]> {
  const res = await fetch(`${API_URL}/api/bookings/checkout/${checkoutId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch checkout");
  return res.json();
}

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: "customer" | "provider";
};

export async function signup(data: {
  email: string;
  password: string;
  name: string;
  phone: string;
  role?: "customer" | "provider";
}): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API_URL}/api/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...data, role: data.role ?? "customer" }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.error === "string" ? err.error : "Signup failed");
  }
  return res.json();
}

export async function login(data: {
  email: string;
  password: string;
}): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.error === "string" ? err.error : "Login failed");
  }
  return res.json();
}

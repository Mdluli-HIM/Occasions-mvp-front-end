"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signup } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { safeRedirect } from "@/lib/safe-redirect";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [role, setRole] = useState<"customer" | "provider">(() => params.get("role") === "provider" ? "provider" : "customer");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus("submitting");
    setErrorMsg("");

    try {
      const { token, user } = await signup({
        name: String(form.get("name")),
        email: String(form.get("email")),
        phone: String(form.get("phone")),
        password: String(form.get("password")),
        role,
      });
      setAuth(token, user);
      router.push(
        safeRedirect(params.get("redirect"), role === "provider" ? "/provider/listings/new" : "/")
      );
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <main className="min-h-[calc(100vh-73px)] flex items-center justify-center bg-offwhite px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-sm p-10 space-y-6">
        <div>
          <p className="text-2xl font-extrabold text-coral">Occasions</p>
          <h1 className="text-2xl font-bold text-ink mt-4">Create an account</h1>
          <p className="text-ink/60 text-sm mt-1">
            Create an account to plan events and book services, or list your
            business.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setRole("customer")}
            aria-pressed={role === "customer"}
            className={`rounded-full py-3 text-sm font-medium transition-colors duration-150 ${
              role === "customer"
                ? "bg-coral text-white"
                : "border border-black/15 text-ink hover:bg-black/5"
            }`}
          >
            I&apos;m a customer
          </button>
          <button
            type="button"
            onClick={() => setRole("provider")}
            aria-pressed={role === "provider"}
            className={`rounded-full py-3 text-sm font-medium transition-colors duration-150 ${
              role === "provider"
                ? "bg-coral text-white"
                : "border border-black/15 text-ink hover:bg-black/5"
            }`}
          >
            I&apos;m a provider
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide text-ink/50 uppercase">
              Full name
            </label>
            <input
              name="name"
              required
              className="w-full rounded-xl border border-black/15 px-4 py-3 text-sm text-ink outline-none focus:border-coral"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide text-ink/50 uppercase">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-xl border border-black/15 px-4 py-3 text-sm text-ink outline-none focus:border-coral"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide text-ink/50 uppercase">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              required
              placeholder="068 000 0000"
              className="w-full rounded-xl border border-black/15 px-4 py-3 text-sm text-ink outline-none focus:border-coral placeholder:text-ink/30"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide text-ink/50 uppercase">
              Password
            </label>
            <input
              type="password"
              name="password"
              minLength={8}
              required
              placeholder="At least 8 characters"
              className="w-full rounded-xl border border-black/15 px-4 py-3 text-sm text-ink outline-none focus:border-coral placeholder:text-ink/30"
            />
          </div>

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-full bg-ink text-white font-medium py-3.5 hover:bg-black/80 transition-colors duration-150 disabled:opacity-60"
          >
            {status === "submitting" ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="text-sm text-ink/60 text-center">
          Already have an account?{" "}
          <Link href={params.get("redirect") ? `/login?redirect=${encodeURIComponent(safeRedirect(params.get("redirect")))}` : "/login"} className="text-coral font-medium">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";
import { useAuthStore } from "@/lib/auth-store";
import { safeRedirect } from "@/lib/safe-redirect";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setStatus("submitting");
    setErrorMsg("");

    try {
      const { token, user } = await login({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      setAuth(token, user);
      router.push(safeRedirect(params.get("redirect")));
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <main className="min-h-[calc(100vh-73px)] flex items-center justify-center bg-offwhite px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-sm p-10 space-y-6">
        <div>
          <p className="text-2xl font-extrabold text-coral">Occasions</p>
          <h1 className="text-2xl font-bold text-ink mt-4">Log in</h1>
          <p className="text-ink/60 text-sm mt-1">
            Log in to plan your events, view bookings or manage your listing.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide text-ink/50 uppercase">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="name@example.com"
              className="w-full rounded-xl border border-black/15 px-4 py-3 text-sm text-ink outline-none focus:border-coral"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold tracking-wide text-ink/50 uppercase">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full rounded-xl border border-black/15 px-4 py-3 text-sm text-ink outline-none focus:border-coral"
            />
          </div>

          {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-full bg-coral text-white font-medium py-3.5 hover:bg-coral-hover transition-colors duration-150 disabled:opacity-60"
          >
            {status === "submitting" ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-sm text-ink/60 text-center">
          Don&apos;t have an account?{" "}
          <Link href={params.get("redirect") ? `/signup?redirect=${encodeURIComponent(safeRedirect(params.get("redirect")))}` : "/signup"} className="text-coral font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}

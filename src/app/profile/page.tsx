"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { User, Mail, Phone, LogOut } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  useEffect(() => {
    if (!user) router.replace("/login?redirect=/profile");
  }, [user, router]);

  if (!user) return null;

  function handleLogout() {
    logout();
    router.push("/");
  }

  return (
    <main className="min-h-[calc(100vh-73px)] bg-offwhite px-4 py-10">
      <div className="max-w-md mx-auto rounded-3xl bg-white shadow-sm p-10 space-y-8">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-coral-soft text-coral flex items-center justify-center text-xl font-semibold">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-ink">{user.name}</h1>
            <p className="text-sm text-ink/60 capitalize">{user.role}</p>
          </div>
        </div>

        <div className="space-y-4 border-t border-black/10 pt-6">
          <div className="flex items-center gap-3 text-sm">
            <Mail size={16} className="text-ink/40" />
            <span className="text-ink">{user.email}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <Phone size={16} className="text-ink/40" />
            <span className="text-ink">{user.phone || "No phone on file"}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <User size={16} className="text-ink/40" />
            <span className="text-ink capitalize">{user.role} account</span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-full border border-black/15 text-ink font-medium py-3 hover:bg-black/5 transition-colors duration-150"
        >
          <LogOut size={16} />
          Log out
        </button>
      </div>
    </main>
  );
}

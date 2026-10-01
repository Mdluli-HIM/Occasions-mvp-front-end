"use client";

import { useEffect, useState } from "react";
import { fetchUnreadMessageCount } from "@/lib/message-api";
import { useAuthStore } from "@/lib/auth-store";
import { useAuthHydrated } from "@/lib/use-auth-hydrated";
import { handleMessageAuthError, startVisiblePolling } from "@/components/messages/polling";

export function useMessageUnread() {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.user?.id);
  const [attempt, setAttempt] = useState(0);
  const key = JSON.stringify([token, userId]);
  const [result, setResult] = useState<{ key: string; count: number; error: string } | null>(null);
  useEffect(() => {
    if (!hydrated || !token || !userId) return;
    const poll = startVisiblePolling(async (signal) => {
      try {
        const { count } = await fetchUnreadMessageCount(token, signal);
        if (!signal.aborted && useAuthStore.getState().token === token) setResult({ key, count, error: "" });
      } catch (error) {
        if (signal.aborted) return;
        handleMessageAuthError(error, token);
        if (useAuthStore.getState().token === token) setResult((previous) => ({ key, count: previous?.key === key ? previous.count : 0, error: "Unread messages couldn't be checked." }));
      }
    }, 30000, true);
    return poll.stop;
  }, [hydrated, token, userId, key, attempt]);
  const current = hydrated && token && userId && result?.key === key ? result : null;
  return { count: current?.count ?? 0, loading: hydrated && !!token && !!userId && !current, error: current?.error ?? "", refresh: () => setAttempt((value) => value + 1) };
}

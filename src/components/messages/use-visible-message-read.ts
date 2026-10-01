"use client";

import { useCallback, useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { markConversationRead } from "@/lib/message-api";
import { handleMessageAuthError, notifyMessagesChanged } from "./polling";

export function useVisibleMessageRead(id: string | null, token: string) {
  const confirmed = useRef(new Map<string, number>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<AbortController | null>(null);
  const desired = useRef(0);
  const active = useRef<string | null>(null);
  useEffect(() => {
    active.current = id; desired.current = 0;
    const cancel = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; pending.current?.abort(); pending.current = null; };
    const hidden = () => { if (document.visibilityState === "hidden") cancel(); };
    document.addEventListener("visibilitychange", hidden);
    return () => { active.current = null; cancel(); document.removeEventListener("visibilitychange", hidden); };
  }, [id, token]);
  return useCallback((sequence: number) => {
    if (!id || active.current !== id || document.visibilityState === "hidden" || sequence <= (confirmed.current.get(id) ?? 0)) return;
    desired.current = Math.max(desired.current, sequence);
    if (timer.current || pending.current) return;
    timer.current = setTimeout(async () => {
      timer.current = null;
      if (active.current !== id || document.visibilityState === "hidden" || useAuthStore.getState().token !== token) return;
      const throughSequence = desired.current;
      const controller = new AbortController(); pending.current = controller;
      try {
        await markConversationRead(id, throughSequence, token, controller.signal);
        if (controller.signal.aborted || active.current !== id || useAuthStore.getState().token !== token) return;
        confirmed.current.set(id, Math.max(confirmed.current.get(id) ?? 0, throughSequence));
        notifyMessagesChanged();
      } catch (error) {
        if (!controller.signal.aborted) handleMessageAuthError(error, token);
      } finally {
        if (pending.current === controller) pending.current = null;
      }
    }, 300);
  }, [id, token]);
}

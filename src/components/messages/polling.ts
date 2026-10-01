"use client";

import { useAuthStore } from "@/lib/auth-store";
import { MessageApiError } from "@/lib/message-api";

export const MESSAGES_CHANGED_EVENT = "occasions:messages-changed";
export function notifyMessagesChanged() { window.dispatchEvent(new Event(MESSAGES_CHANGED_EVENT)); }
export function handleMessageAuthError(error: unknown, token: string) {
  if (error instanceof MessageApiError && error.status === 401 && useAuthStore.getState().token === token) useAuthStore.getState().logout();
}
export function startVisiblePolling(read: (signal: AbortSignal) => Promise<void>, interval: number, listenForChanges = false) {
  let stopped = false;
  let pending: AbortController | null = null;
  const refresh = () => {
    pending?.abort();
    if (stopped || document.visibilityState === "hidden") return;
    pending = new AbortController();
    void read(pending.signal);
  };
  const visible = () => { if (document.visibilityState === "hidden") pending?.abort(); else refresh(); };
  const timer = window.setInterval(refresh, interval);
  document.addEventListener("visibilitychange", visible);
  if (listenForChanges) window.addEventListener(MESSAGES_CHANGED_EVENT, refresh);
  refresh();
  return { refresh, stop: () => {
    stopped = true; pending?.abort(); window.clearInterval(timer);
    document.removeEventListener("visibilitychange", visible);
    if (listenForChanges) window.removeEventListener(MESSAGES_CHANGED_EVENT, refresh);
  } };
}

import { API_URL } from "@/lib/api";

export const MAX_MESSAGE_LENGTH = 4000;
export type ProviderContact = { id: string; slug: string; name: string; profileName: string; profilePhotoUrl: string; category: string };
export type ChatMessage = { id: string; sequence: number; body: string; createdAt: string; direction: "sent" | "received" };
export type ConversationSummary = {
  id: string;
  viewerRole: "customer" | "provider";
  provider: ProviderContact;
  otherParticipant: { name: string; photoUrl: string };
  lastMessage: { body: string; createdAt: string; direction: "sent" | "received" } | null;
  unreadCount: number;
  updatedAt: string;
};
export type ConversationPage = { conversations: ConversationSummary[]; nextCursor: string | null };
export type ThreadPage = { conversation: ConversationSummary; messages: ChatMessage[]; hasOlder: boolean; hasMore: boolean };
export type ProviderMessageContact = { provider: ProviderContact; conversationId: string | null; canMessage: boolean; unavailableReason?: string };

export class MessageApiError extends Error {
  constructor(public readonly status: number, message: string) { super(message); this.name = "MessageApiError"; }
}

async function request<T>(path: string, token: string, init: RequestInit = {}, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timer = setTimeout(abort, 30000);
  try {
    const response = await fetch(`${API_URL}/api/messages${path}`, {
      ...init, signal: controller.signal, cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, ...(init.body ? { "Content-Type": "application/json" } : {}) },
    });
    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const error = body && typeof body === "object" && "error" in body ? body.error : null;
      throw new MessageApiError(response.status, typeof error === "string" ? error
        : response.status === 401 ? "Please log in again to continue messaging."
        : response.status === 404 ? "This conversation or provider is no longer available."
        : response.status === 429 ? "Please wait a moment before trying again."
        : "We couldn't complete this request. Please try again.");
    }
    if (body === null) throw new MessageApiError(0, "The response couldn't be confirmed. Please try again.");
    return body as T;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error instanceof MessageApiError) throw error;
    throw new MessageApiError(0, "The connection was interrupted. Please try again.");
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

export const fetchMessageConversations = (token: string, cursor?: string | null, signal?: AbortSignal) =>
  request<ConversationPage>(`/conversations${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`, token, {}, signal);
export const fetchUnreadMessageCount = (token: string, signal?: AbortSignal) => request<{ count: number }>("/unread", token, {}, signal);
export const fetchProviderMessageContact = (slug: string, token: string, signal?: AbortSignal) => request<ProviderMessageContact>(`/providers/${encodeURIComponent(slug)}`, token, {}, signal);
export function fetchMessageThread(id: string, token: string, page: { after?: number; before?: number } = {}, signal?: AbortSignal) {
  const query = new URLSearchParams();
  if (page.after !== undefined) query.set("after", String(page.after));
  if (page.before !== undefined) query.set("before", String(page.before));
  return request<ThreadPage>(`/conversations/${encodeURIComponent(id)}${query.size ? `?${query}` : ""}`, token, {}, signal);
}
export const createMessageConversation = (providerSlug: string, body: string, clientMessageId: string, token: string) =>
  request<{ conversation: ConversationSummary; message: ChatMessage }>("/conversations", token, { method: "POST", body: JSON.stringify({ providerSlug, body, clientMessageId }) });
export const sendConversationMessage = (id: string, body: string, clientMessageId: string, token: string) =>
  request<{ message: ChatMessage }>(`/conversations/${encodeURIComponent(id)}/messages`, token, { method: "POST", body: JSON.stringify({ body, clientMessageId }) });
export const markConversationRead = (id: string, throughSequence: number, token: string, signal?: AbortSignal) =>
  request<{ ok: true }>(`/conversations/${encodeURIComponent(id)}/read`, token, { method: "POST", body: JSON.stringify({ throughSequence }) }, signal);

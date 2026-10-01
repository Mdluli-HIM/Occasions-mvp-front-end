"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { ChatMessage, ConversationSummary, fetchMessageConversations, fetchMessageThread, fetchProviderMessageContact, ProviderMessageContact } from "@/lib/message-api";
import { handleMessageAuthError, startVisiblePolling } from "./polling";

const errorText = (error: unknown) => error instanceof Error ? error.message : "Messages couldn't be loaded. Please try again.";
const validSession = (token: string, signal: AbortSignal) => !signal.aborted && useAuthStore.getState().token === token;
export function mergeMessages(previous: ChatMessage[], incoming: ChatMessage[]) {
  const byId = new Map(previous.map((message) => [message.id, message]));
  incoming.forEach((message) => byId.set(message.id, message));
  return [...byId.values()].sort((a, b) => a.sequence - b.sequence);
}
function mergeConversations(previous: ConversationSummary[], incoming: ConversationSummary[]) {
  const byId = new Map(previous.map((conversation) => [conversation.id, conversation]));
  incoming.forEach((conversation) => byId.set(conversation.id, conversation));
  return [...byId.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || b.id.localeCompare(a.id));
}

export function useConversationInbox(token: string) {
  const [data, setData] = useState<{ conversations: ConversationSummary[]; nextCursor: string | null } | null>(null);
  const [error, setError] = useState("");
  const [moreError, setMoreError] = useState("");
  const [loadingMore, setLoadingMore] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const paginated = useRef(false);
  const olderRequest = useRef<AbortController | null>(null);
  useEffect(() => {
    const poll = startVisiblePolling(async (signal) => {
      try {
        const page = await fetchMessageConversations(token, null, signal);
        if (!validSession(token, signal)) return;
        setData((previous) => ({ conversations: mergeConversations(previous?.conversations ?? [], page.conversations), nextCursor: paginated.current && previous ? previous.nextCursor : page.nextCursor }));
        setError("");
      } catch (error) {
        if (signal.aborted) return;
        handleMessageAuthError(error, token);
        if (useAuthStore.getState().token === token) setError(errorText(error));
      }
    }, 30000, true);
    const hidden = () => { if (document.visibilityState === "hidden") olderRequest.current?.abort(); };
    document.addEventListener("visibilitychange", hidden);
    return () => { poll.stop(); olderRequest.current?.abort(); document.removeEventListener("visibilitychange", hidden); };
  }, [token, attempt]);
  const loadMore = async () => {
    if (!data?.nextCursor || loadingMore || document.visibilityState === "hidden") return;
    const controller = new AbortController();
    olderRequest.current?.abort(); olderRequest.current = controller;
    setLoadingMore(true); setMoreError("");
    try {
      const page = await fetchMessageConversations(token, data.nextCursor, controller.signal);
      if (!validSession(token, controller.signal)) return;
      paginated.current = true;
      setData((previous) => ({ conversations: mergeConversations(previous?.conversations ?? [], page.conversations), nextCursor: page.nextCursor }));
    } catch (error) {
      if (!controller.signal.aborted) { handleMessageAuthError(error, token); setMoreError(errorText(error)); }
    } finally {
      if (olderRequest.current === controller) setLoadingMore(false);
    }
  };
  const upsert = useCallback((conversation: ConversationSummary) => {
    setData((previous) => ({ conversations: mergeConversations(previous?.conversations ?? [], [conversation]), nextCursor: previous?.nextCursor ?? null }));
  }, []);
  return { conversations: data?.conversations ?? [], loading: !data && !error, error, nextCursor: data?.nextCursor, loadingMore, moreError, loadMore, upsert, retry: () => setAttempt((value) => value + 1) };
}

type ThreadState = { id: string; conversation: ConversationSummary; messages: ChatMessage[]; hasOlder: boolean; fetchedSequence: number };
export function useMessageThread(id: string | null, token: string) {
  const [data, setData] = useState<ThreadState | null>(null);
  const [failure, setFailure] = useState<{ id: string; error: string } | null>(null);
  const [olderStatus, setOlderStatus] = useState<{ id: string; loading: boolean; error: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const snapshot = useRef<ThreadState | null>(null);
  const olderRequest = useRef<AbortController | null>(null);
  useEffect(() => { snapshot.current = data; }, [data]);
  useEffect(() => {
    if (!id) return;
    const poll = startVisiblePolling(async (signal) => {
      try {
        const current = snapshot.current?.id === id ? snapshot.current : null;
        let after = current?.fetchedSequence;
        // Catch up in order without skipping pages when many messages arrive together.
        for (let pageNumber = 0; pageNumber < 20; pageNumber++) {
          const page = await fetchMessageThread(id, token, after === undefined ? {} : { after }, signal);
          if (!validSession(token, signal)) return;
          const newestFetched = page.messages.at(-1)?.sequence ?? after ?? 0;
          const isIncremental = after !== undefined && after > 0;
          setData((previous) => ({ id, conversation: page.conversation, messages: mergeMessages(previous?.id === id ? previous.messages : [], page.messages), hasOlder: previous?.id === id && isIncremental ? previous.hasOlder : page.hasOlder, fetchedSequence: Math.max(previous?.id === id ? previous.fetchedSequence : 0, newestFetched) }));
          setFailure(null);
          const next = page.messages.at(-1)?.sequence;
          if (!page.hasMore || next === undefined || (after !== undefined && next <= after)) break;
          after = next;
        }
      } catch (error) {
        if (signal.aborted) return;
        handleMessageAuthError(error, token);
        if (useAuthStore.getState().token === token) setFailure({ id, error: errorText(error) });
      }
    }, 12000);
    const hidden = () => { if (document.visibilityState === "hidden") olderRequest.current?.abort(); };
    document.addEventListener("visibilitychange", hidden);
    return () => { poll.stop(); olderRequest.current?.abort(); document.removeEventListener("visibilitychange", hidden); };
  }, [id, token, attempt]);
  const current = data?.id === id ? data : null;
  const loadEarlier = async () => {
    const before = current?.messages[0]?.sequence;
    if (!id || before === undefined || !current?.hasOlder || (olderStatus?.id === id && olderStatus.loading) || document.visibilityState === "hidden") return;
    const controller = new AbortController(); olderRequest.current?.abort(); olderRequest.current = controller;
    setOlderStatus({ id, loading: true, error: "" });
    try {
      const page = await fetchMessageThread(id, token, { before }, controller.signal);
      if (!validSession(token, controller.signal)) return;
      setData((previous) => previous?.id === id ? { ...previous, messages: mergeMessages(previous.messages, page.messages), hasOlder: page.hasOlder } : previous);
    } catch (error) {
      if (!controller.signal.aborted) { handleMessageAuthError(error, token); setOlderStatus({ id, loading: false, error: errorText(error) }); }
    } finally {
      if (olderRequest.current === controller) setOlderStatus((previous) => previous?.id === id ? { ...previous, loading: false } : previous);
    }
  };
  const addMessage = useCallback((conversationId: string, message: ChatMessage, conversation?: ConversationSummary) => {
    setData((previous) => previous?.id === conversationId ? { ...previous, conversation: conversation ?? previous.conversation, messages: mergeMessages(previous.messages, [message]) } : conversation ? { id: conversationId, conversation, messages: [message], hasOlder: message.sequence > 1, fetchedSequence: 0 } : previous);
  }, []);
  const error = failure?.id === id ? failure.error : "";
  return { conversation: current?.conversation, messages: current?.messages ?? [], readThrough: current?.fetchedSequence ?? 0, hasOlder: current?.hasOlder ?? false, loading: !!id && !current && !error, error, loadingOlder: olderStatus?.id === id && olderStatus.loading, olderError: olderStatus?.id === id ? olderStatus.error : "", loadEarlier, addMessage, retry: () => setAttempt((value) => value + 1) };
}

export function useProviderContact(slug: string | null, token: string) {
  const [result, setResult] = useState<{ slug: string; contact: ProviderMessageContact | null; error: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!slug) return;
    const poll = startVisiblePolling(async (signal) => {
      try {
        const contact = await fetchProviderMessageContact(slug, token, signal);
        if (validSession(token, signal)) setResult({ slug, contact, error: "" });
      } catch (error) {
        if (signal.aborted) return;
        handleMessageAuthError(error, token);
        if (useAuthStore.getState().token === token) setResult({ slug, contact: null, error: errorText(error) });
      }
    }, 30000);
    return poll.stop;
  }, [slug, token, attempt]);
  const current = result?.slug === slug ? result : null;
  return { contact: current?.contact ?? null, error: current?.error ?? "", loading: !!slug && !current, retry: () => setAttempt((value) => value + 1) };
}

"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MessageCircle, Send } from "lucide-react";
import { useAuthStore } from "@/lib/auth-store";
import { useAuthHydrated } from "@/lib/use-auth-hydrated";
import { safeRedirect } from "@/lib/safe-redirect";
import { ConversationSummary, createMessageConversation, MAX_MESSAGE_LENGTH, sendConversationMessage } from "@/lib/message-api";
import { handleMessageAuthError, notifyMessagesChanged } from "./polling";
import { useConversationInbox, useMessageThread, useProviderContact } from "./use-message-data";
import { MessageTimeline, messageTime } from "./message-timeline";
import { useVisibleMessageRead } from "./use-visible-message-read";

function Avatar({ name, photo }: { name: string; photo?: string }) {
  const [failed, setFailed] = useState(false);
  const source = photo && ((photo.startsWith("/") && !photo.startsWith("//")) || /^https?:\/\//.test(photo)) ? photo : null;
  return <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-coral-soft text-sm font-bold text-coral">
    {source && !failed ? <Image src={source} alt="" fill sizes="44px" unoptimized onError={() => setFailed(true)} className="object-cover" /> : name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?"}
  </span>;
}
function participant(conversation: ConversationSummary) {
  return conversation.viewerRole === "customer"
    ? { name: conversation.provider.profileName || conversation.provider.name, photo: conversation.provider.profilePhotoUrl || conversation.otherParticipant.photoUrl, label: "Provider" }
    : { name: conversation.otherParticipant.name || "Customer", photo: conversation.otherParticipant.photoUrl, label: "Customer" };
}
function RetryError({ message, retry }: { message: string; retry: () => void }) {
  return <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800"><p>{message}</p><button type="button" onClick={retry} className="mt-2 font-semibold underline underline-offset-4">Try again</button></div>;
}
function BlankState({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center"><MessageCircle size={32} className="mb-4 text-coral" aria-hidden="true" /><h2 className="font-semibold text-ink">{title}</h2><div className="mt-2 max-w-sm text-sm leading-6 text-ink/60">{children}</div></div>;
}

export function MessagingInbox() {
  const hydrated = useAuthHydrated();
  const token = useAuthStore((state) => state.token);
  const userId = useAuthStore((state) => state.user?.id);
  const params = useSearchParams();
  const router = useRouter();
  const query = params.toString();
  const destination = safeRedirect(`/messages${query ? `?${query}` : ""}`, "/messages");
  useEffect(() => {
    if (hydrated && (!token || !userId)) router.replace(`/login?redirect=${encodeURIComponent(destination)}`);
  }, [hydrated, token, userId, router, destination]);
  if (!hydrated || !token || !userId) return <main className="mx-auto max-w-7xl px-6 py-12"><p role="status" className="text-sm text-ink/60">{hydrated ? "Taking you to login…" : "Loading messages…"}</p></main>;
  return <InboxSession key={`${userId}:${token}`} token={token} providerSlug={params.get("provider")} conversationId={params.get("conversation")} />;
}

type Draft = { body: string; attempt?: { body: string; nonce: string }; error?: string };
function InboxSession({ token, providerSlug, conversationId }: { token: string; providerSlug: string | null; conversationId: string | null }) {
  const router = useRouter();
  const inbox = useConversationInbox(token);
  const contactState = useProviderContact(conversationId ? null : providerSlug, token);
  const contact = contactState.contact;
  const activeId = conversationId || contact?.conversationId || null;
  const thread = useMessageThread(activeId, token);
  const summary = thread.conversation ?? inbox.conversations.find((conversation) => conversation.id === activeId);
  const readVisible = useVisibleMessageRead(activeId, token);
  const draftKey = conversationId ? `conversation:${conversationId}` : providerSlug ? `provider:${providerSlug}` : activeId ? `conversation:${activeId}` : "";
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [sending, setSending] = useState<string[]>([]);
  const sendingKeys = useRef(new Set<string>());
  const selectedKey = useRef(draftKey);
  const alive = useRef(true);
  useEffect(() => { selectedKey.current = draftKey; }, [draftKey]);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const draft = drafts[draftKey] ?? { body: "" };
  const isSending = sending.includes(draftKey);
  const selected = !!(conversationId || providerSlug || activeId);
  const party = summary ? participant(summary) : contact ? { name: contact.provider.profileName || contact.provider.name, photo: contact.provider.profilePhotoUrl, label: "Provider" } : null;
  const canCompose = !!draftKey && (!!thread.conversation || (!activeId && !!contact?.canMessage));
  const selectThread = (id: string) => { selectedKey.current = `conversation:${id}`; router.push(`/messages?conversation=${encodeURIComponent(id)}`, { scroll: false }); };
  const back = () => { selectedKey.current = ""; router.push("/messages", { scroll: false }); };
  const updateDraft = (body: string) => setDrafts((previous) => ({ ...previous, [draftKey]: { ...previous[draftKey], body, error: "" } }));
  async function send() {
    const body = draft.body.trim();
    if (!canCompose || !body || body.length > MAX_MESSAGE_LENGTH || sendingKeys.current.has(draftKey)) return;
    const key = draftKey;
    let nonce: string;
    try { nonce = draft.attempt?.body === body ? draft.attempt.nonce : crypto.randomUUID(); }
    catch { setDrafts((previous) => ({ ...previous, [key]: { ...previous[key], body: draft.body, error: "This browser couldn't prepare a safe retry. Please reload and try again." } })); return; }
    sendingKeys.current.add(key); setSending((previous) => [...previous, key]);
    setDrafts((previous) => ({ ...previous, [key]: { ...previous[key], body: draft.body, attempt: { body, nonce }, error: "" } }));
    try {
      if (activeId) {
        const { message } = await sendConversationMessage(activeId, body, nonce, token);
        if (!alive.current || useAuthStore.getState().token !== token) return;
        thread.addMessage(activeId, message);
        if (summary) inbox.upsert({ ...summary, lastMessage: { body: message.body, createdAt: message.createdAt, direction: "sent" }, updatedAt: message.createdAt });
        // Fetch from the last server-read cursor, never from the sent echo's sequence.
        thread.retry();
      } else {
        if (!providerSlug || !contact?.canMessage) return;
        const { conversation, message } = await createMessageConversation(providerSlug, body, nonce, token);
        if (!alive.current || useAuthStore.getState().token !== token) return;
        inbox.upsert(conversation);
        if (selectedKey.current === key) {
          thread.addMessage(conversation.id, message, conversation);
          router.replace(`/messages?conversation=${encodeURIComponent(conversation.id)}`, { scroll: false });
        }
      }
      setDrafts((previous) => ({ ...previous, [key]: { body: previous[key]?.body.trim() === body ? "" : previous[key]?.body ?? "" } }));
      notifyMessagesChanged();
    } catch (error) {
      if (!alive.current || useAuthStore.getState().token !== token) return;
      handleMessageAuthError(error, token);
      if (useAuthStore.getState().token === token) setDrafts((previous) => ({ ...previous, [key]: { ...previous[key], body: previous[key]?.body ?? draft.body, attempt: { body, nonce }, error: error instanceof Error ? error.message : "Your message couldn't be confirmed. Please try again." } }));
    } finally {
      sendingKeys.current.delete(key);
      if (alive.current) setSending((previous) => previous.filter((item) => item !== key));
    }
  }
  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-5"><h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">Messages</h1><p className="mt-1 text-sm leading-6 text-ink/60">Talk privately about services and your event. No booking needed to get started.</p></div>
      <div className="flex h-[calc(100dvh-260px)] min-h-[400px] overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm md:h-[calc(100dvh-220px)] md:rounded-3xl">
        <aside aria-label="Message conversations" className={`${selected ? "hidden md:flex" : "flex"} w-full shrink-0 flex-col border-black/10 md:w-80 md:border-r lg:w-96`}>
          <div className="border-b border-black/10 px-5 py-4"><h2 className="font-semibold">Your conversations</h2><p className="mt-1 text-xs text-ink/50">Customers and providers, all in one place.</p></div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {inbox.loading && <p role="status" className="p-6 text-sm text-ink/60">Loading conversations…</p>}
            {inbox.error && <div className="p-4"><RetryError message={inbox.error} retry={inbox.retry} /></div>}
            {!inbox.loading && !inbox.error && !inbox.conversations.length && <BlankState title="Your inbox is ready"><p>Message a provider from their profile to ask about their services.</p><Link href="/search" className="mt-4 inline-block font-semibold text-coral underline underline-offset-4">Find providers</Link></BlankState>}
            <ul>{inbox.conversations.map((conversation) => {
              const person = participant(conversation);
              return <li key={conversation.id}><button type="button" onClick={() => selectThread(conversation.id)} aria-current={activeId === conversation.id ? "true" : undefined} className={`flex w-full gap-3 border-b border-black/5 px-4 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-coral ${activeId === conversation.id ? "bg-coral-soft" : "hover:bg-offwhite"}`}>
                <Avatar key={`${person.name}:${person.photo}`} name={person.name} photo={person.photo} />
                <span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span className="truncate text-sm font-semibold">{person.name}</span><span className="shrink-0 text-[11px] text-ink/45">{messageTime(conversation.updatedAt)}</span></span><span className="mt-0.5 block text-[11px] text-ink/50">{person.label}{conversation.viewerRole === "provider" ? ` · ${conversation.provider.profileName || conversation.provider.name}` : ""}</span><span className="mt-1 flex items-center gap-2"><span className="block flex-1 truncate text-xs text-ink/60">{conversation.lastMessage ? `${conversation.lastMessage.direction === "sent" ? "You: " : ""}${conversation.lastMessage.body}` : "Start the conversation"}</span>{conversation.unreadCount > 0 && <span aria-label={`${conversation.unreadCount} unread messages`} className="flex min-w-5 shrink-0 items-center justify-center rounded-full bg-coral px-1.5 py-0.5 text-[10px] font-bold text-white">{conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}</span>}</span></span>
              </button></li>;
            })}</ul>
            {inbox.moreError && <div className="p-4"><RetryError message={inbox.moreError} retry={inbox.loadMore} /></div>}
            {inbox.nextCursor && <div className="p-4 text-center"><button type="button" disabled={inbox.loadingMore} onClick={inbox.loadMore} className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold hover:bg-black/5 disabled:opacity-50">{inbox.loadingMore ? "Loading…" : "Load more conversations"}</button></div>}
          </div>
        </aside>
        <section aria-label="Selected conversation" className={`${selected ? "flex" : "hidden md:flex"} min-w-0 flex-1 flex-col`}>
          {!selected ? <BlankState title="A conversation starts with hello"><p>Choose a conversation or find a provider to ask about packages, dates or your plans.</p><Link href="/search" className="mt-4 inline-block font-semibold text-coral underline underline-offset-4">Find providers</Link></BlankState> : <>
            <div className="flex shrink-0 items-center gap-3 border-b border-black/10 px-4 py-4 sm:px-6"><button type="button" onClick={back} aria-label="Back to conversations" className="rounded-full p-2 hover:bg-black/5 md:hidden"><ArrowLeft size={20} /></button>{party && <Avatar key={`${party.name}:${party.photo}`} name={party.name} photo={party.photo} />}<div className="min-w-0"><h2 className="truncate text-sm font-semibold sm:text-base">{party?.name ?? "Conversation"}</h2><p className="mt-0.5 text-xs text-ink/50">{party?.label ?? "Private messages"}{summary?.viewerRole === "provider" ? ` · ${summary.provider.profileName || summary.provider.name}` : ""}</p></div></div>
            {contactState.loading && !activeId ? <p role="status" className="p-6 text-sm text-ink/60">Finding this provider…</p> : contactState.error && !activeId ? <div className="p-6"><RetryError message={contactState.error} retry={contactState.retry} /></div> : contact && !contact.canMessage && !activeId ? <BlankState title="You can’t message this profile"><p>{contact.unavailableReason || "This is your own provider profile. Customers can message you here from your profile."}</p><button type="button" onClick={back} className="mt-4 font-semibold text-coral underline underline-offset-4">Back to messages</button></BlankState> : activeId ? <>
              {thread.error && <div className="shrink-0 px-4 pt-4 sm:px-6"><RetryError message={thread.error} retry={thread.retry} /></div>}
              {thread.loading ? <p role="status" className="flex-1 p-6 text-sm text-ink/60">Loading messages…</p> : thread.conversation ? <MessageTimeline key={activeId} messages={thread.messages} readThrough={thread.readThrough} hasOlder={thread.hasOlder} loadingOlder={!!thread.loadingOlder} olderError={thread.olderError} loadEarlier={thread.loadEarlier} onVisibleSequence={readVisible} /> : <div className="flex-1" />}
            </> : contact?.canMessage ? <BlankState title="Say hello"><p>Ask about availability, packages or what you have in mind. Your first message will start a private conversation.</p></BlankState> : <div className="flex-1" />}
            {canCompose && <form className="shrink-0 border-t border-black/10 p-4 sm:px-6" onSubmit={(event) => { event.preventDefault(); void send(); }}>
              {draft.error && <div role="alert" className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800"><p>{draft.error}</p><p className="mt-1 text-xs">Your draft is still here. Retry the same text to safely confirm this message.</p></div>}
              <label htmlFor="message-body" className="sr-only">Write a message</label>
              <textarea id="message-body" value={draft.body} onChange={(event) => updateDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && !event.nativeEvent.isComposing) { event.preventDefault(); void send(); } }} disabled={isSending} maxLength={MAX_MESSAGE_LENGTH} rows={3} placeholder="Write a message…" className="block w-full resize-none rounded-xl border border-black/15 bg-white px-3 py-2.5 text-sm leading-6 outline-none focus:border-coral disabled:bg-offwhite" />
              <div className="mt-2 flex items-center justify-between gap-3"><p className="text-[11px] text-ink/45"><span className="hidden sm:inline">Ctrl / ⌘ + Enter to send · </span>{draft.body.length.toLocaleString()} / {MAX_MESSAGE_LENGTH.toLocaleString()}</p><button type="submit" disabled={!draft.body.trim() || isSending || draft.body.trim().length > MAX_MESSAGE_LENGTH} className="inline-flex items-center gap-2 rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-hover disabled:opacity-50"><Send size={15} aria-hidden="true" />{isSending ? "Sending…" : draft.error ? "Retry send" : "Send"}</button></div>
            </form>}
          </>}
        </section>
      </div>
    </main>
  );
}

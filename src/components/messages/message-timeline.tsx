"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { ChatMessage } from "@/lib/message-api";

export function messageTime(raw: string, detailed = false) {
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-ZA", detailed ? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" } : { day: "numeric", month: "short" }).format(date);
}

export function MessageTimeline({ messages, readThrough, hasOlder, loadingOlder, olderError, loadEarlier, onVisibleSequence }: {
  messages: ChatMessage[]; readThrough: number; hasOlder: boolean; loadingOlder: boolean; olderError: string; loadEarlier: () => void; onVisibleSequence: (sequence: number) => void;
}) {
  const viewport = useRef<HTMLDivElement>(null);
  const previous = useRef<{ first?: string; last?: string; height: number; nearBottom: boolean } | null>(null);
  useLayoutEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const old = previous.current;
    const first = messages[0]?.id;
    const last = messages.at(-1);
    if (!old || old.nearBottom || (last?.id !== old.last && last?.direction === "sent")) node.scrollTop = node.scrollHeight;
    else if (first !== old.first && last?.id === old.last) node.scrollTop += node.scrollHeight - old.height;
    previous.current = { first, last: last?.id, height: node.scrollHeight, nearBottom: node.scrollHeight - node.scrollTop - node.clientHeight < 80 };
  }, [messages, hasOlder, olderError]);
  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    let frame = 0;
    const inspect = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (document.visibilityState === "hidden") return;
        const bounds = node.getBoundingClientRect();
        const top = Math.max(bounds.top, 0);
        const bottom = Math.min(bounds.bottom, window.innerHeight);
        if (bottom <= top) return;
        let sequence = 0;
        node.querySelectorAll<HTMLElement>("[data-message-sequence]").forEach((message) => {
          const rect = message.getBoundingClientRect();
          const candidate = Number(message.dataset.messageSequence);
          if (candidate <= readThrough && rect.bottom > top && rect.top < bottom && rect.right > 0 && rect.left < window.innerWidth) sequence = Math.max(sequence, candidate);
        });
        if (sequence > 0) onVisibleSequence(sequence);
      });
    };
    const scroll = () => {
      if (previous.current) previous.current.nearBottom = node.scrollHeight - node.scrollTop - node.clientHeight < 80;
      inspect();
    };
    node.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("scroll", inspect, { passive: true });
    window.addEventListener("resize", inspect);
    document.addEventListener("visibilitychange", inspect);
    inspect();
    return () => { cancelAnimationFrame(frame); node.removeEventListener("scroll", scroll); window.removeEventListener("scroll", inspect); window.removeEventListener("resize", inspect); document.removeEventListener("visibilitychange", inspect); };
  }, [messages, readThrough, onVisibleSequence]);
  return (
    <div ref={viewport} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6" aria-label="Conversation messages" tabIndex={0}>
      {hasOlder && <div className="mb-5 text-center"><button type="button" onClick={loadEarlier} disabled={loadingOlder} className="rounded-full border border-black/15 px-4 py-2 text-xs font-semibold hover:bg-black/5 disabled:opacity-50">{loadingOlder ? "Loading earlier messages…" : "Load earlier messages"}</button></div>}
      {olderError && <p role="alert" className="mb-4 text-center text-sm text-red-700">{olderError}</p>}
      <ol className="space-y-4">
        {messages.map((message) => <li key={message.id} data-message-sequence={message.sequence} className={`flex ${message.direction === "sent" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[78%] ${message.direction === "sent" ? "rounded-br-sm bg-ink text-white" : "rounded-bl-sm bg-offwhite text-ink"}`}>
            <span className="sr-only">{message.direction === "sent" ? "You: " : "Received: "}</span>
            <p className="whitespace-pre-wrap break-words text-sm leading-6 [overflow-wrap:anywhere]">{message.body}</p>
            <time dateTime={message.createdAt} className={`mt-2 block text-[11px] ${message.direction === "sent" ? "text-white/60" : "text-ink/50"}`}>{messageTime(message.createdAt, true)}</time>
          </div>
        </li>)}
      </ol>
      {!messages.length && <p className="py-10 text-center text-sm text-ink/60">Say hello and start the conversation.</p>}
    </div>
  );
}

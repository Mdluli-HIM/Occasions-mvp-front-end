"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays, X } from "lucide-react";

export function PlanEventButton() {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogId = useId();
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousFocus = triggerRef.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const previousOverflow = document.body.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
    const bodyPadding = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth) document.body.style.paddingRight = `${bodyPadding + scrollbarWidth}px`;
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    closeRef.current?.focus({ preventScroll: true });

    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-controls={dialogId}
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2 text-sm font-medium text-white transition-colors duration-150 hover:bg-coral-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
      >
        <CalendarDays size={16} aria-hidden="true" />
        Plan an event
      </button>

      <dialog
        ref={dialogRef}
        id={dialogId}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={(event) => { event.preventDefault(); setOpen(false); }}
        onClose={() => { if (!dialogRef.current?.open) setOpen(false); }}
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled), a[href]")).filter((control) => control.tabIndex >= 0);
          const first = controls[0];
          const last = controls.at(-1);
          if (!first || !last) return;
          const active = document.activeElement;
          if (!event.currentTarget.contains(active) || (event.shiftKey ? active === first : active === last)) {
            event.preventDefault();
            (event.shiftKey ? last : first).focus();
          }
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget) return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) setOpen(false);
        }}
        className="fixed inset-0 m-auto max-h-[calc(100dvh_-_2rem)] w-[calc(100%_-_2rem)] max-w-xl overflow-y-auto overscroll-contain rounded-3xl border border-black/10 bg-white p-0 text-ink shadow-xl backdrop:bg-black/30 backdrop:backdrop-blur-sm"
      >
        <div className="relative px-6 pb-7 pt-16 sm:px-10 sm:pb-10 sm:pt-20">
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close event planning introduction"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-offwhite text-ink transition-colors hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          >
            <X size={20} strokeWidth={1.7} aria-hidden="true" />
          </button>

          <p className="flex items-center gap-2 text-sm font-medium text-coral sm:text-base">
            <CalendarDays size={20} strokeWidth={1.7} className="shrink-0" aria-hidden="true" />
            Your occasion, brought together
          </p>
          <h2 id={titleId} className="mt-5 text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">Plan your event in one place</h2>
          <p id={descriptionId} className="mt-4 text-base leading-relaxed text-black/55 sm:text-lg">Choose your occasion, find the services you need, and keep every booking together.</p>

          <div className="mt-8 flex flex-col gap-3">
            <Link
              href="/events/new"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-coral px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-coral-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
            >
              Plan an event
              <ArrowRight size={19} aria-hidden="true" />
            </Link>
            <Link
              href="/events"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-black/15 bg-white px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-offwhite focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
            >
              View my events
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}

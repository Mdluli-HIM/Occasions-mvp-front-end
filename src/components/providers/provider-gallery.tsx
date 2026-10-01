"use client";

import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { clsx } from "clsx";
import { Images, X } from "lucide-react";

type Photo = { id: string; url: string };

function subscribeColumns(onChange: () => void) {
  const queries = [window.matchMedia("(min-width: 640px)"), window.matchMedia("(min-width: 1024px)")];
  queries.forEach((query) => query.addEventListener("change", onChange));
  return () => queries.forEach((query) => query.removeEventListener("change", onChange));
}

function currentColumns(): number {
  if (window.matchMedia("(min-width: 1024px)").matches) return 3;
  return window.matchMedia("(min-width: 640px)").matches ? 2 : 1;
}

const serverColumns = () => 1;

export function ProviderGallery({ photos, alt }: { photos: Photo[]; alt: string }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const columnCount = useSyncExternalStore(subscribeColumns, currentColumns, serverColumns);
  const portfolio = useMemo(() => {
    const seenIds = new Set<string>();
    const seenUrls = new Set<string>();
    return photos.filter((photo) => {
      if (!photo.url || seenIds.has(photo.id) || seenUrls.has(photo.url)) return false;
      seenIds.add(photo.id);
      seenUrls.add(photo.url);
      return true;
    });
  }, [photos]);
  const hasPhotos = portfolio.length > 0;
  const visibleColumns = Math.min(columnCount, portfolio.length || 1);
  const providerName = alt.trim() || "Provider portfolio";

  useEffect(() => {
    if (!open || !hasPhotos) return;
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
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    closeRef.current?.focus({ preventScroll: true });

    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPadding;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [open, hasPhotos]);

  function openPortfolio(trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setOpen(true);
  }

  if (!portfolio.length) {
    return <div className="flex aspect-video w-full items-center justify-center rounded-2xl bg-black/5 text-sm text-black/40">No portfolio photos yet</div>;
  }

  return (
    <>
      <div className="relative">
        <div className={clsx("grid w-full gap-2 overflow-hidden rounded-2xl bg-white sm:rounded-3xl", portfolio.length === 1 ? "aspect-video grid-cols-1" : portfolio.length === 2 ? "aspect-[3/2] grid-cols-2" : "aspect-[3/2] grid-cols-[2fr_1fr] grid-rows-2")}>
          {portfolio.slice(0, 3).map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={(event) => openPortfolio(event.currentTarget)}
              aria-label={`Open ${providerName} portfolio, photo ${index + 1} of ${portfolio.length}`}
              aria-haspopup="dialog"
              className={clsx("group relative min-h-0 min-w-0 cursor-zoom-in overflow-hidden rounded-lg bg-black/5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-coral", portfolio.length > 2 && index === 0 && "row-span-2")}
            >
              <Image src={photo.url} alt={`${providerName} — portfolio photo ${index + 1}`} fill priority={index === 0} sizes={index === 0 && portfolio.length > 2 ? "(min-width: 1024px) 45vw, 66vw" : "(min-width: 1024px) 33vw, 50vw"} unoptimized={photo.url.startsWith("http")} className="object-cover transition-[filter] group-hover:brightness-95" />
            </button>
          ))}
        </div>
        <button type="button" onClick={(event) => openPortfolio(event.currentTarget)} aria-label={`View all ${portfolio.length} portfolio ${portfolio.length === 1 ? "photo" : "photos"}`} aria-haspopup="dialog" className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-full bg-white/90 p-3 text-sm font-semibold text-ink shadow-sm transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-coral sm:px-4">
          <Images size={20} strokeWidth={1.7} />
          <span className="hidden sm:inline">{portfolio.length === 1 ? "View photo" : "View all photos"}</span>
        </button>
      </div>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onCancel={(event) => { event.preventDefault(); setOpen(false); }}
        onClose={() => { if (!dialogRef.current?.open) setOpen(false); }}
        onKeyDown={(event) => {
          // The close button is the portfolio's only interactive control.
          // Native modal semantics keep the rest of the page inert as well.
          if (event.key === "Tab") { event.preventDefault(); closeRef.current?.focus(); }
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none border-0 bg-white p-0 text-ink backdrop:bg-white"
      >
        <div ref={scrollRef} className="h-full overflow-y-auto overscroll-contain">
          <header className="sticky top-0 z-10 grid h-20 grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3 bg-white px-3 sm:h-24 sm:px-5">
            <span aria-hidden="true" />
            <h2 id={titleId} className="truncate text-center text-sm font-normal text-black/55 sm:text-base">{providerName}</h2>
            <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close portfolio" className="flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-coral"><X size={23} strokeWidth={1.7} /></button>
          </header>
          <p id={descriptionId} className="sr-only">{portfolio.length} portfolio {portfolio.length === 1 ? "photo" : "photos"}. Scroll to explore. Press Escape to close.</p>
          <div className={clsx("grid items-start gap-3 px-3 pb-6 pt-3 sm:gap-4 sm:px-4", visibleColumns === 3 ? "grid-cols-3" : visibleColumns === 2 ? "grid-cols-2" : "grid-cols-1", portfolio.length === 1 && "mx-auto max-w-3xl")}>
            {Array.from({ length: visibleColumns }, (_, column) => (
              <div key={column} className="min-w-0 space-y-3 sm:space-y-4">
                {portfolio.map((photo, index) => ({ photo, index })).filter(({ index }) => index % visibleColumns === column).map(({ photo, index }) => (
                  <figure key={photo.id} className="overflow-hidden rounded-2xl bg-black/5">
                    {/* Natural dimensions keep portraits and landscape work uncropped. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={`${providerName} — portfolio photo ${index + 1} of ${portfolio.length}`} loading={index < visibleColumns ? "eager" : "lazy"} decoding="async" className="block h-auto w-full" />
                  </figure>
                ))}
              </div>
            ))}
          </div>
        </div>
      </dialog>
    </>
  );
}

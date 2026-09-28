"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

// A titled horizontal scroller with prev/next arrows, like the Airbnb rows.
export function ScrollRow({
  title,
  titleHref,
  children,
}: {
  title: string;
  titleHref?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update, children]);

  function scroll(direction: 1 | -1) {
    const el = ref.current;
    if (el) el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
  }

  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-ink">
          {titleHref ? (
            <Link href={titleHref} className="inline-flex items-center gap-2 hover:text-coral transition-colors">
              {title}
              <ArrowRight size={18} />
            </Link>
          ) : (
            title
          )}
        </h2>
        {(canPrev || canNext) && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => scroll(-1)}
              disabled={!canPrev}
              aria-label={`Scroll ${title} left`}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-black/15 bg-white hover:border-ink disabled:opacity-30 disabled:hover:border-black/15 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => scroll(1)}
              disabled={!canNext}
              aria-label={`Scroll ${title} right`}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-black/15 bg-white hover:border-ink disabled:opacity-30 disabled:hover:border-black/15 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
      <div
        ref={ref}
        onScroll={update}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </section>
  );
}

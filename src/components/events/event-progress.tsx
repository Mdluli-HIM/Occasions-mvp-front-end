import { Check } from "lucide-react";
import type { EventProgress } from "@/lib/event-api";

export function EventProgressSummary({ progress, compact = false }: {
  progress: EventProgress;
  compact?: boolean;
}) {
  const percentage = progress.needed ? Math.min(100, progress.confirmed / progress.needed * 100) : 0;
  return (
    <div className={compact ? "space-y-3" : "space-y-5"}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <p className="font-semibold text-ink">{progress.confirmed} of {progress.needed} services confirmed</p>
        {progress.eventCompleted && <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-800"><Check size={14} />Event completed</span>}
      </div>
      <div role="progressbar" aria-label="Services confirmed" aria-valuenow={progress.confirmed} aria-valuemin={0} aria-valuemax={progress.needed || 1} className="h-2 overflow-hidden rounded-full bg-black/5">
        <div className="h-full rounded-full bg-coral transition-all" style={{ width: `${percentage}%` }} />
      </div>
      {!compact && (
        <div className="grid grid-cols-3 gap-3 text-center">
          {[{ value: progress.reserved, label: "Requested" }, { value: progress.confirmed, label: "Confirmed" }, { value: progress.completed, label: "Completed" }].map(({ value, label }) => (
            <div key={label} className="rounded-xl bg-offwhite px-2 py-4"><p className="text-2xl font-semibold text-ink">{value}<span className="text-sm font-normal text-black/40"> / {progress.needed}</span></p><p className="mt-1 text-xs text-black/55">{label}</p></div>
          ))}
        </div>
      )}
      {!compact && <p className="text-xs leading-relaxed text-black/50">Counts track services, rather than individual packages. Requests include confirmed and completed bookings. An occasion is completed when every active booking is completed.</p>}
    </div>
  );
}

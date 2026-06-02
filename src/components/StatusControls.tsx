"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type AppStatus =
  | "DISCOVERED"
  | "APPLY"
  | "MAYBE"
  | "SKIP"
  | "APPLIED"
  | "INTERVIEW"
  | "REJECTED"
  | "OFFER";

export const STATUS_LABELS: Record<AppStatus, string> = {
  DISCOVERED: "Discovered",
  APPLY: "To Apply",
  MAYBE: "Maybe",
  SKIP: "Skipped",
  APPLIED: "Applied",
  INTERVIEW: "Interview",
  REJECTED: "Rejected",
  OFFER: "Offer",
};

export const STATUS_COLORS: Record<AppStatus, string> = {
  DISCOVERED: "bg-zinc-100 text-zinc-700",
  APPLY: "bg-emerald-100 text-emerald-800",
  MAYBE: "bg-amber-100 text-amber-800",
  SKIP: "bg-zinc-200 text-zinc-500",
  APPLIED: "bg-sky-100 text-sky-800",
  INTERVIEW: "bg-violet-100 text-violet-800",
  REJECTED: "bg-rose-100 text-rose-800",
  OFFER: "bg-emerald-200 text-emerald-900",
};

const TRANSITIONS: Record<AppStatus, AppStatus[]> = {
  DISCOVERED: ["APPLY", "MAYBE", "SKIP"],
  APPLY: ["APPLIED", "MAYBE", "SKIP"],
  MAYBE: ["APPLY", "APPLIED", "SKIP"],
  SKIP: ["APPLY", "MAYBE"],
  APPLIED: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["OFFER", "REJECTED"],
  OFFER: [],
  REJECTED: ["APPLY"],
};

const TRANSITION_LABELS: Record<AppStatus, string> = {
  DISCOVERED: "Move to Discovered",
  APPLY: "Mark to Apply",
  MAYBE: "Mark Maybe",
  SKIP: "Skip",
  APPLIED: "Mark Applied",
  INTERVIEW: "Mark Interview",
  REJECTED: "Mark Rejected",
  OFFER: "Mark Offer",
};

const TRANSITION_STYLES: Record<AppStatus, string> = {
  DISCOVERED: "border-zinc-200 text-zinc-600 hover:bg-zinc-50",
  APPLY: "border-emerald-200 text-emerald-700 hover:bg-emerald-50",
  MAYBE: "border-amber-200 text-amber-700 hover:bg-amber-50",
  SKIP: "border-zinc-200 text-zinc-500 hover:bg-zinc-50",
  APPLIED: "border-sky-200 text-sky-700 hover:bg-sky-50",
  INTERVIEW: "border-violet-200 text-violet-700 hover:bg-violet-50",
  REJECTED: "border-rose-200 text-rose-600 hover:bg-rose-50",
  OFFER: "border-emerald-300 text-emerald-800 hover:bg-emerald-50",
};

export function StatusBadge({ status }: { status: AppStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

export function StatusControls({
  jobId,
  currentStatus,
}: {
  jobId: string;
  currentStatus: AppStatus;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<AppStatus | null>(null);

  const transitions = TRANSITIONS[currentStatus] ?? [];

  async function moveTo(next: AppStatus) {
    setLoading(next);
    try {
      await fetch(`/api/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ applicationStatus: next }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Current status
        </span>
        <StatusBadge status={currentStatus} />
      </div>

      {transitions.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
            Move to
          </span>
          {transitions.map((next) => (
            <button
              key={next}
              type="button"
              disabled={loading !== null}
              onClick={() => moveTo(next)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 ${TRANSITION_STYLES[next]}`}
            >
              {loading === next ? "Saving…" : TRANSITION_LABELS[next]}
            </button>
          ))}
        </div>
      )}

      {transitions.length === 0 && (
        <p className="text-xs text-zinc-400">No further transitions available.</p>
      )}
    </div>
  );
}

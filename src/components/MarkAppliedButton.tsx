"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MarkAppliedButton({
  jobId,
  isApplied,
}: {
  jobId: string;
  isApplied: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onClick() {
    if (isApplied) return;
    setLoading(true);
    try {
      await fetch(`/api/jobs/${jobId}/mark-applied`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (isApplied) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700">
        ✓ Marked as Applied
      </span>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      type="button"
      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
    >
      {loading ? "Marking…" : "Mark as Applied"}
    </button>
  );
}

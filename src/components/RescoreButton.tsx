"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RescoreButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function rescore() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/jobs/rescore", { method: "POST" });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to rescore");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900 disabled:opacity-50"
        type="button"
        onClick={rescore}
        disabled={loading}
      >
        {loading ? "Rescoring…" : "Re-score all"}
      </button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

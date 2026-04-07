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
    <div className="flex flex-col items-start gap-2">
      <button
        className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 disabled:opacity-50"
        type="button"
        onClick={rescore}
        disabled={loading}
      >
        {loading ? "Rescoring..." : "Re-score all jobs"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

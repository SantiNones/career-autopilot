"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function GenerateCvButton(props: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${props.jobId}/generate-cv`, {
        method: "POST",
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to generate CV");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-400 hover:bg-zinc-50 disabled:opacity-50"
        onClick={generate}
        disabled={loading}
        type="button"
      >
        {loading ? "Generating…" : "Generate Tailored CV"}
      </button>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}

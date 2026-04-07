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
    <div className="flex flex-col gap-2">
      <button
        className="w-fit rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        onClick={generate}
        disabled={loading}
        type="button"
      >
        {loading ? "Generating..." : "Generate tailored CV (Markdown)"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

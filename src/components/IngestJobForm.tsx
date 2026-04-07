"use client";

import { useState } from "react";

export function IngestJobForm() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = url.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/jobs/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });

      const data = (await res.json()) as { jobId?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to ingest");
      if (!data.jobId) throw new Error("Missing jobId in response");

      setUrl("");
      window.location.href = `/jobs/${data.jobId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <label className="text-sm font-medium">Job URL</label>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm"
          placeholder="https://..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          className="rounded-md bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
          disabled={loading || !url.trim()}
          type="submit"
        >
          {loading ? "Ingesting..." : "Ingest"}
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <p className="text-xs text-zinc-500">
        Tip: start with a public job post (LinkedIn often blocks; try company
        career pages).
      </p>
    </form>
  );
}

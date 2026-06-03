"use client";

import { useState } from "react";

export function IngestJobForm() {
  const [url, setUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = url.trim();
    const pasted = pastedText.trim();
    if (!trimmed && !pasted) return;

    setLoading(true);
    try {
      const res = await fetch("/api/jobs/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: trimmed || undefined, pastedText: pasted || undefined }),
      });

      const data = (await res.json()) as { jobId?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to ingest");
      if (!data.jobId) throw new Error("Missing jobId in response");

      setUrl("");
      setPastedText("");
      window.location.href = `/jobs/${data.jobId}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-500">
          Job URL
        </label>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            placeholder="https://company.com/careers/role"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          <button
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            disabled={loading || (!url.trim() && !pastedText.trim())}
            type="submit"
          >
            {loading ? "Ingesting…" : "Ingest"}
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-zinc-500">
          Or paste job description
        </label>
        <textarea
          className="min-h-24 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          placeholder="Paste the full job description here…"
          value={pastedText}
          onChange={(e) => setPastedText(e.target.value)}
        />
      </div>

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      <p className="text-xs text-zinc-400">
        Some job boards block automated reading — if parsing fails, a job record is still created
        so you can paste the full description manually on the job detail page.
      </p>
    </form>
  );
}

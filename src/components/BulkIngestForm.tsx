"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BulkIngestForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ingested: number; deduped: number; errors: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const items = text
      .split(/\n\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    if (!items.length) return;

    setLoading(true);
    try {
      const res = await fetch("/api/jobs/bulk-ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        results?: Array<{ jobId?: string; error?: string; deduped?: boolean }>;
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Failed");

      const results = data.results ?? [];
      const ingested = results.filter((r) => r.jobId && !r.deduped).length;
      const deduped = results.filter((r) => r.deduped).length;
      const errors = results.filter((r) => r.error).length;
      setResult({ ingested, deduped, errors });
      if (ingested > 0 || deduped > 0) {
        setText("");
        router.refresh();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <textarea
        className="min-h-32 resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        placeholder={
          "Paste multiple URLs or descriptions — separate each with a blank line:\n\nhttps://company.com/careers/123\n\nhttps://company.com/careers/456\n\nSenior React Engineer at Acme Corp..."
        }
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-400">Separate entries with a blank line.</p>
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Ingesting…" : "Ingest All"}
        </button>
      </div>
      {result && (
        <p className="text-xs font-medium text-emerald-700">
          ✓ {result.ingested} ingested
          {result.deduped > 0 ? `, ${result.deduped} already existed` : ""}
          {result.errors > 0 ? `, ${result.errors} failed` : ""}
        </p>
      )}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </form>
  );
}

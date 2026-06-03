"use client";

import { useState } from "react";

export function UpdateDescriptionForm({ jobId }: { jobId: string }) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/update-description`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rawText: trimmed }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
      <textarea
        className="min-h-32 w-full resize-y rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        placeholder="Paste the full job description here…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save and Re-analyze"}
        </button>
        <span className="text-xs text-amber-700">
          Re-runs scoring and fit analysis with the new description.
        </span>
      </div>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ClearAllJobsButton() {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs/clear", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch {
      setLoading(false);
      setConfirm(false);
    }
  }

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="text-xs text-zinc-400 underline transition-colors hover:text-rose-500"
      >
        Clear all jobs
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-rose-500">This will delete every job. Are you sure?</span>
      <button
        type="button"
        disabled={loading}
        onClick={handleDelete}
        className="rounded-md bg-rose-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
      >
        {loading ? "Deleting…" : "Yes, delete all"}
      </button>
      <button
        type="button"
        onClick={() => setConfirm(false)}
        className="text-xs text-zinc-500 underline transition-colors hover:text-zinc-700"
      >
        Cancel
      </button>
    </div>
  );
}

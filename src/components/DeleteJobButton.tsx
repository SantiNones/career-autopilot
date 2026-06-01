"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);

  async function onDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/");
    } catch {
      setLoading(false);
      setConfirm(false);
    }
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        type="button"
        className="rounded-lg border border-rose-200 px-4 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-zinc-500">Are you sure?</span>
      <button
        onClick={onDelete}
        disabled={loading}
        type="button"
        className="rounded-lg bg-rose-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
      >
        {loading ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        onClick={() => setConfirm(false)}
        type="button"
        className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50"
      >
        Cancel
      </button>
    </div>
  );
}

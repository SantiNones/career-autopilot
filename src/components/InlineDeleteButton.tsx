"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InlineDeleteButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch {
      setLoading(false);
      setConfirm(false);
    }
  }

  function handleShowConfirm(e: React.MouseEvent) {
    e.stopPropagation();
    setConfirm(true);
  }

  function handleCancel(e: React.MouseEvent) {
    e.stopPropagation();
    setConfirm(false);
  }

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={handleShowConfirm}
        className="rounded-md px-2 py-1 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
        title="Delete job"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <span className="text-xs text-rose-500">Delete?</span>
      <button
        type="button"
        disabled={loading}
        onClick={handleDelete}
        className="rounded-md bg-rose-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
      >
        {loading ? "…" : "Yes"}
      </button>
      <button
        type="button"
        onClick={handleCancel}
        className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-50"
      >
        No
      </button>
    </div>
  );
}

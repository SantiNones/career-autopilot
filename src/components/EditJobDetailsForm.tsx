"use client";

import { useState } from "react";

type Props = {
  jobId: string;
  initialTitle: string;
  initialCompany: string;
  initialSourceUrl: string;
};

type FieldErrors = {
  title?: string;
  sourceUrl?: string;
};

export function EditJobDetailsForm({
  jobId,
  initialTitle,
  initialCompany,
  initialSourceUrl,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [company, setCompany] = useState(initialCompany);
  const [sourceUrl, setSourceUrl] = useState(initialSourceUrl);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  function startEdit() {
    setTitle(initialTitle);
    setCompany(initialCompany);
    setSourceUrl(initialSourceUrl);
    setFieldErrors({});
    setApiError(null);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
    setFieldErrors({});
    setApiError(null);
  }

  function validate(): boolean {
    const errs: FieldErrors = {};
    if (title.trim().length < 3) {
      errs.title = "Job title must be at least 3 characters.";
    }
    if (sourceUrl.trim()) {
      try {
        new URL(sourceUrl.trim());
      } catch {
        errs.sourceUrl = "Must be a valid URL (e.g. https://…).";
      }
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function save() {
    if (!validate()) return;
    setSaving(true);
    setApiError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          companyName: company.trim(),
          sourceUrl: sourceUrl.trim(),
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to save.");
      setEditing(false);
      showToast("Job details updated");
      // Reload so the server component reflects the new values
      window.location.reload();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Unknown error");
      setSaving(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const isManualUrl = initialSourceUrl.startsWith("manual:");

  if (!editing) {
    return (
      <>
        {toast && (
          <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
            {toast}
          </div>
        )}
        <button
          onClick={startEdit}
          className="mt-2 text-xs font-medium text-indigo-600 hover:underline"
        >
          Edit job details
        </button>
      </>
    );
  }

  return (
    <>
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg">
          {toast}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-3">
        {/* Title */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Job Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={saving}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
            placeholder="e.g. Senior Frontend Engineer"
          />
          {fieldErrors.title && (
            <p className="mt-1 text-xs text-rose-600">{fieldErrors.title}</p>
          )}
        </div>

        {/* Company */}
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">Company</label>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            disabled={saving}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
            placeholder="e.g. Acme Corp"
          />
        </div>

        {/* Source URL */}
        {!isManualUrl && (
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Source URL</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              disabled={saving}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
              placeholder="https://…"
            />
            {fieldErrors.sourceUrl && (
              <p className="mt-1 text-xs text-rose-600">{fieldErrors.sourceUrl}</p>
            )}
          </div>
        )}

        {apiError && <p className="text-xs text-rose-600">{apiError}</p>}

        <div className="flex items-center gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <button
            onClick={cancel}
            disabled={saving}
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}

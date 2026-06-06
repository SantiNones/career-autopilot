"use client";

import { useRef, useState } from "react";

type ResumeSections = {
  rawText: string;
  summary: string;
  experience: string;
  projects: string;
  skills: string;
  education: string;
  languages: string;
  links: string;
};

type Props = {
  initial: ResumeSections | null;
};

const SECTION_LABELS: Array<{ key: keyof Omit<ResumeSections, "rawText">; label: string }> = [
  { key: "summary", label: "Summary" },
  { key: "experience", label: "Experience" },
  { key: "projects", label: "Projects" },
  { key: "skills", label: "Skills" },
  { key: "education", label: "Education" },
  { key: "languages", label: "Languages" },
  { key: "links", label: "Links" },
];

const ACCEPTED_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
const ACCEPTED_EXTENSIONS = [".pdf", ".docx"];
const MAX_BYTES = 5 * 1024 * 1024;

function emptyState(): ResumeSections {
  return {
    rawText: "",
    summary: "",
    experience: "",
    projects: "",
    skills: "",
    education: "",
    languages: "",
    links: "",
  };
}

function normalizeUrl(raw: string): string {
  const withoutLabel = raw.replace(/^[^:]+:\s+(?=https?:\/\/)/i, "").trim();
  const noTrail = withoutLabel.replace(/[.,;)]+$/, "");
  try {
    const u = new URL(noTrail);
    const pathname = u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "");
    return `${u.protocol}//${u.hostname.toLowerCase()}${pathname}${u.search}${u.hash}`;
  } catch {
    return noTrail.toLowerCase();
  }
}

function mergeLinks(existing: string, newLinks: string[]): string {
  if (!newLinks.length) return existing;
  const existingLines = existing.split("\n").map((l) => l.trim()).filter(Boolean);
  const existingNorms = new Set(existingLines.map(normalizeUrl));
  const toAdd = newLinks.filter((l) => !existingNorms.has(normalizeUrl(l)));
  if (!toAdd.length) return existing;
  return [...existingLines, ...toAdd].join("\n");
}

export function MasterResumeForm({ initial }: Props) {
  const [data, setData] = useState<ResumeSections>(initial ?? emptyState());
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function updateField(key: keyof ResumeSections, value: string) {
    setData((prev) => ({ ...prev, [key]: value }));
    setSaveMsg(null);
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setSaveMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/profile/resume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to save");
      setSaveMsg("Saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleClearResume() {
    setClearing(true);
    setSaveMsg(null);
    setError(null);
    try {
      const empty = emptyState();
      const res = await fetch("/api/profile/resume", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(empty),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to clear");
      setData(empty);
      setSaveMsg("Resume cleared.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setClearing(false);
      setConfirmClear(false);
    }
  }

  async function handleParse() {
    if (!data.rawText.trim()) return;
    setParsing(true);
    setSaveMsg(null);
    setError(null);
    try {
      const res = await fetch("/api/profile/resume/parse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rawText: data.rawText }),
      });
      const json = (await res.json()) as { parsed?: Omit<ResumeSections, "rawText">; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to parse");
      if (json.parsed) {
        setData((prev) => {
          const parsed = json.parsed!;
          const mergedLinks = mergeLinks(prev.links, (parsed.links ?? "").split("\n").map((l) => l.trim()).filter(Boolean));
          return { ...prev, ...parsed, links: mergedLinks };
        });
        setSaveMsg("Parsed — review sections below and save when ready.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setParsing(false);
    }
  }

  async function handleUploadFile(file: File) {
    setError(null);
    setSaveMsg(null);

    const lowerName = file.name.toLowerCase();
    const validType = ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
    if (!validType) {
      setError("Unsupported file type. Please upload a PDF or DOCX file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("File too large. Maximum size is 5 MB.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profile/resume/upload", {
        method: "POST",
        body: formData,
      });
      const json = (await res.json()) as { rawText?: string; links?: string[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Upload failed. Please try again.");
      if (!json.rawText?.trim()) {
        setError("Could not extract text from this file. The file may be empty or image-only.");
        return;
      }
      setData((prev) => ({
        ...prev,
        rawText: json.rawText!,
        links: mergeLinks(prev.links, json.links ?? []),
      }));
      setSaveMsg("Resume extracted. Review and parse sections below.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void handleUploadFile(file);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleUploadFile(file);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave() {
    setDragOver(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Upload area */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Upload your master CV
        </label>
        <p className="mb-2 text-xs text-zinc-500">PDF or DOCX accepted · max 5 MB</p>
        <div
          role="button"
          tabIndex={0}
          aria-label="Upload CV file"
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={[
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition-colors",
            dragOver
              ? "border-indigo-400 bg-indigo-50"
              : "border-zinc-300 bg-zinc-50 hover:border-indigo-300 hover:bg-indigo-50/40",
          ].join(" ")}
        >
          {uploading ? (
            <>
              <svg className="h-6 w-6 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              <span className="text-sm font-medium text-indigo-600">Extracting resume…</span>
            </>
          ) : (
            <>
              <svg className="h-8 w-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-sm font-medium text-zinc-700">
                {dragOver ? "Drop to upload" : "Drag & drop or click to select"}
              </span>
              <span className="text-xs text-zinc-400">PDF or DOCX</span>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={handleFileInputChange}
        />
      </div>

      {/* Raw CV paste */}
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          Paste your master CV
        </label>
        <p className="mb-2 text-xs text-zinc-500">
          Career Autopilot will use this as the source of truth for tailored applications.
        </p>
        <textarea
          className="min-h-48 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          placeholder={"John Smith\njohn@example.com · github.com/john\n\nSummary\nSenior Software Engineer...\n\nExperience\nAccme Corp — Lead Engineer\n2020–present\n..."}
          value={data.rawText}
          onChange={(e) => updateField("rawText", e.target.value)}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleParse}
            disabled={parsing || !data.rawText.trim()}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50"
          >
            {parsing ? "Parsing…" : "Parse Resume"}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Resume"}
          </button>
          {!confirmClear ? (
            <button
              type="button"
              onClick={() => setConfirmClear(true)}
              disabled={clearing}
              className="ml-auto rounded-lg border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-600 transition-colors hover:border-rose-400 hover:bg-rose-50 disabled:opacity-50"
            >
              Clear Resume
            </button>
          ) : (
            <span className="ml-auto flex items-center gap-2">
              <span className="text-xs text-zinc-500">Are you sure? This cannot be undone.</span>
              <button
                type="button"
                onClick={() => void handleClearResume()}
                disabled={clearing}
                className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
              >
                {clearing ? "Clearing…" : "Yes, clear"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                disabled={clearing}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50"
              >
                Cancel
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Parsed sections */}
      <div>
        <h3 className="mb-1 text-sm font-semibold text-zinc-800">Parsed Sections</h3>
        <p className="mb-4 text-xs text-zinc-500">
          Career Autopilot should only adapt your real experience, not invent new experience.
          Review and correct each section before using for applications.
        </p>
        <div className="flex flex-col gap-4">
          {SECTION_LABELS.map(({ key, label }) => (
            <div key={key}>
              <label className="mb-1 block text-xs font-medium text-zinc-600 uppercase tracking-wide">
                {label}
              </label>
              <textarea
                className="min-h-20 w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                placeholder={`Your ${label.toLowerCase()}…`}
                value={data[key]}
                onChange={(e) => updateField(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      {saveMsg && <p className="text-xs font-medium text-emerald-700">✓ {saveMsg}</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}

      {/* Save bottom */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Resume"}
        </button>
      </div>
    </div>
  );
}

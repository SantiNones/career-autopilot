"use client";

import { useState } from "react";

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

export function MasterResumeForm({ initial }: Props) {
  const [data, setData] = useState<ResumeSections>(initial ?? emptyState());
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        setData((prev) => ({ ...prev, ...json.parsed }));
        setSaveMsg("Parsed — review sections below and save when ready.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setParsing(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
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
        <div className="mt-2 flex items-center gap-2">
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

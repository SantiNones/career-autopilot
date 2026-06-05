"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Material = {
  id: string;
  type: string;
  content: string | null;
  version: number;
  status: string;
};

const TYPE_LABELS: Record<string, string> = {
  TAILORED_CV: "Tailored CV V2",
  COVER_LETTER: "Cover Letter",
  RECRUITER_MESSAGE: "Recruiter Message",
  SCREENING_ANSWERS: "Screening Answers",
};

const TYPE_ORDER = ["TAILORED_CV", "COVER_LETTER", "RECRUITER_MESSAGE", "SCREENING_ANSWERS"];

// ── Filename builder ────────────────────────────────────────────────────────
function buildFilename(
  type: "cv" | "cover-letter",
  format: "pdf" | "docx",
  candidateName?: string,
  companyName?: string,
): string {
  const namePart  = candidateName?.trim().replace(/\s+/g, "_") ?? "";
  const coName    = companyName?.trim().replace(/\s+/g, "_") ?? "";
  const label     = type === "cv" ? "CV" : "Cover_Letter";
  const parts     = [namePart, label, coName].filter(Boolean);
  return `${parts.join("_")}.${format}`;
}

// ── Export button ─────────────────────────────────────────────────────────────
function ExportButton({
  label,
  apiPath,
  content,
  filename,
}: {
  label: string;
  apiPath: string;
  content: string;
  filename: string;
}) {
  const [loading, setLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  async function handleExport() {
    setLoading(true);
    setExportError(null);
    try {
      const res = await fetch(apiPath, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content, filename }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Unable to generate export. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <button
        type="button"
        onClick={() => void handleExport()}
        disabled={loading}
        className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50"
      >
        {loading ? "Exporting…" : label}
      </button>
      {exportError && <span className="text-xs text-rose-500">{exportError}</span>}
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function MaterialCard({
  mat,
  jobId,
  candidateName,
  companyName,
}: {
  mat: Material;
  jobId: string;
  candidateName?: string;
  companyName?: string;
}) {
  const router = useRouter();
  const [marking, setMarking] = useState(false);

  async function markReviewed() {
    setMarking(true);
    await fetch(`/api/jobs/${jobId}/materials/${mat.id}/review`, { method: "POST" });
    setMarking(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-900">{TYPE_LABELS[mat.type] ?? mat.type}</span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">v{mat.version}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              mat.status === "REVIEWED"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {mat.status === "REVIEWED" ? "Reviewed" : "Draft"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {mat.content && mat.type === "TAILORED_CV" && (
            <>
              <ExportButton
                label="PDF"
                apiPath="/api/export/cv/pdf"
                content={mat.content}
                filename={buildFilename("cv", "pdf", candidateName, companyName)}
              />
              <ExportButton
                label="DOCX"
                apiPath="/api/export/cv/docx"
                content={mat.content}
                filename={buildFilename("cv", "docx", candidateName, companyName)}
              />
            </>
          )}
          {mat.content && mat.type === "COVER_LETTER" && (
            <>
              <ExportButton
                label="PDF"
                apiPath="/api/export/cover-letter/pdf"
                content={mat.content}
                filename={buildFilename("cover-letter", "pdf", candidateName, companyName)}
              />
              <ExportButton
                label="DOCX"
                apiPath="/api/export/cover-letter/docx"
                content={mat.content}
                filename={buildFilename("cover-letter", "docx", candidateName, companyName)}
              />
            </>
          )}
          {mat.content && <CopyButton text={mat.content} />}
          {mat.status !== "REVIEWED" && (
            <button
              type="button"
              onClick={() => void markReviewed()}
              disabled={marking}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
            >
              {marking ? "Saving…" : "Mark Reviewed"}
            </button>
          )}
        </div>
      </div>
      <div className="px-5 py-4">
        <pre className="max-h-[440px] overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-800">
          {mat.content ?? "(empty)"}
        </pre>
      </div>
    </div>
  );
}

type Selection = {
  cv: boolean;
  coverLetter: boolean;
  recruiterMessage: boolean;
  screeningAnswers: boolean;
};

const SELECTION_LABELS: Array<{ key: keyof Selection; label: string }> = [
  { key: "cv",               label: "Tailored CV" },
  { key: "coverLetter",      label: "Cover Letter" },
  { key: "recruiterMessage", label: "Recruiter Message" },
  { key: "screeningAnswers", label: "Screening Answers" },
];

export function MaterialsSection({
  jobId,
  initialMaterials,
  candidateName,
  companyName,
}: {
  jobId: string;
  initialMaterials: Material[];
  candidateName?: string;
  companyName?: string;
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("TAILORED_CV");
  const [generatedBy, setGeneratedBy] = useState<"openai" | "template" | null>(null);
  const [selection, setSelection] = useState<Selection>({
    cv: true,
    coverLetter: true,
    recruiterMessage: true,
    screeningAnswers: true,
  });

  const latestByType = new Map<string, Material>();
  for (const mat of initialMaterials) {
    const existing = latestByType.get(mat.type);
    if (!existing || mat.version > existing.version) {
      latestByType.set(mat.type, mat);
    }
  }

  const hasMaterials = latestByType.size > 0;
  const activeMat = latestByType.get(activeTab) ?? null;

  const noneSelected = !selection.cv && !selection.coverLetter && !selection.recruiterMessage && !selection.screeningAnswers;
  const allSelected  =  selection.cv &&  selection.coverLetter &&  selection.recruiterMessage &&  selection.screeningAnswers;

  function toggleAll(checked: boolean) {
    setSelection({ cv: checked, coverLetter: checked, recruiterMessage: checked, screeningAnswers: checked });
  }

  function toggleOne(key: keyof Selection, checked: boolean) {
    setSelection((prev) => ({ ...prev, [key]: checked }));
  }

  async function handleGenerate() {
    if (noneSelected) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/generate-materials`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          generateCv:              selection.cv,
          generateCoverLetter:     selection.coverLetter,
          generateRecruiterMessage:selection.recruiterMessage,
          generateScreeningAnswers:selection.screeningAnswers,
        }),
      });
      const json = (await res.json()) as { error?: string; generatedBy?: "openai" | "template" };
      if (!res.ok) throw new Error(json.error ?? "Failed");
      if (json.generatedBy) setGeneratedBy(json.generatedBy);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white">
      {/* Section header */}
      <div className="border-b border-zinc-100 px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Application Materials</h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Drafts are generated from your saved profile and master resume. Review before sending.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {generatedBy && (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                  generatedBy === "openai"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {generatedBy === "openai" ? "AI Generated" : "Template Generated"}
              </span>
            )}
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={generating || noneSelected}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {generating ? "Generating…" : "Generate Selected"}
            </button>
          </div>
        </div>

        {/* Material selector */}
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
          {/* Select All */}
          <label className="flex cursor-pointer items-center gap-1.5">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={(e) => toggleAll(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-300 accent-indigo-600"
            />
            <span className="text-xs font-semibold text-zinc-700">Select All</span>
          </label>

          <span className="text-zinc-200">|</span>

          {SELECTION_LABELS.map(({ key, label }) => (
            <label key={key} className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={selection[key]}
                onChange={(e) => toggleOne(key, e.target.checked)}
                className="h-3.5 w-3.5 rounded border-zinc-300 accent-indigo-600"
              />
              <span className="text-xs text-zinc-600">{label}</span>
            </label>
          ))}

          {noneSelected && (
            <span className="text-xs text-rose-500">Select at least one material.</span>
          )}
        </div>
      </div>

      {generatedBy === "openai" && (
        <div className="border-b border-amber-100 bg-amber-50 px-5 py-2.5 text-xs text-amber-700">
          AI-generated materials should be reviewed before sending.
        </div>
      )}
      {error && (
        <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-xs text-rose-700">
          {error}
        </div>
      )}

      {!hasMaterials ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-zinc-400">No materials yet.</p>
          <p className="mt-1 text-xs text-zinc-300">
            Click &ldquo;Generate Selected&rdquo; to create tailored drafts.
          </p>
        </div>
      ) : (
        <div>
          {/* Tab strip */}
          <div className="flex gap-1 border-b border-zinc-100 px-5 pt-3">
            {TYPE_ORDER.map((type) => {
              const mat = latestByType.get(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveTab(type)}
                  className={`mb-[-1px] rounded-t-lg px-4 py-2 text-xs font-medium transition-colors ${
                    activeTab === type
                      ? "border border-b-white border-zinc-200 bg-white text-indigo-600"
                      : "text-zinc-500 hover:text-zinc-800"
                  }`}
                >
                  {TYPE_LABELS[type]}
                  {mat?.status === "REVIEWED" && (
                    <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Active card */}
          <div className="p-5">
            {activeMat ? (
              <MaterialCard mat={activeMat} jobId={jobId} candidateName={candidateName} companyName={companyName} />
            ) : (
              <p className="py-8 text-center text-sm text-zinc-400">
                No material for this type yet. Click &ldquo;Regenerate All&rdquo;.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

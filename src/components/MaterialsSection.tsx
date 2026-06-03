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

function MaterialCard({ mat, jobId }: { mat: Material; jobId: string }) {
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

export function MaterialsSection({
  jobId,
  initialMaterials,
}: {
  jobId: string;
  initialMaterials: Material[];
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("TAILORED_CV");
  const [generatedBy, setGeneratedBy] = useState<"openai" | "template" | null>(null);

  const latestByType = new Map<string, Material>();
  for (const mat of initialMaterials) {
    const existing = latestByType.get(mat.type);
    if (!existing || mat.version > existing.version) {
      latestByType.set(mat.type, mat);
    }
  }

  const hasMaterials = latestByType.size > 0;
  const activeMat = latestByType.get(activeTab) ?? null;

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/generate-materials`, { method: "POST" });
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
      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
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
            disabled={generating}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
          >
            {generating ? "Generating…" : hasMaterials ? "Regenerate All" : "Generate All Materials"}
          </button>
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
            Click &ldquo;Generate All Materials&rdquo; to create tailored drafts.
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
              <MaterialCard mat={activeMat} jobId={jobId} />
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

import Link from "next/link";

import { prisma } from "@/lib/db";
import { DeleteJobButton } from "@/components/DeleteJobButton";
import { EditJobDetailsForm } from "@/components/EditJobDetailsForm";
import { MaterialsSection } from "@/components/MaterialsSection";
import { StatusControls, StatusBadge } from "@/components/StatusControls";
import { UpdateDescriptionForm } from "@/components/UpdateDescriptionForm";
import type { AppStatus } from "@/components/StatusControls";

export const dynamic = "force-dynamic";

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-emerald-100 text-emerald-800"
      : score >= 50
        ? "bg-amber-100 text-amber-800"
        : "bg-rose-100 text-rose-800";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold tabular-nums ${color}`}
    >
      {score}
    </span>
  );
}

function LabelBadge({ label }: { label: string }) {
  const styles: Record<string, string> = {
    APPLY: "bg-emerald-100 text-emerald-800",
    MAYBE: "bg-amber-100 text-amber-800",
    SKIP: "bg-rose-100 text-rose-800",
  };
  const style = styles[label] ?? "bg-zinc-100 text-zinc-600";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${style}`}>
      {label}
    </span>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, Math.max(0, value));
  const barColor =
    pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 flex-shrink-0 text-xs text-zinc-500">{label}</div>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100">
        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-7 text-right text-xs font-semibold tabular-nums text-zinc-700">
        {value}
      </div>
    </div>
  );
}

function TagList({ items, chipClass }: { items: unknown[]; chipClass: string }) {
  const arr = Array.isArray(items)
    ? (items.filter((i) => typeof i === "string") as string[])
    : [];
  if (!arr.length) {
    return <p className="text-xs text-zinc-400">None identified.</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {arr.map((item, i) => (
        <span key={i} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${chipClass}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

export default async function JobDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  const job = await prisma.jobPosting.findUnique({
    where: { id },
    include: {
      evaluations: { orderBy: { createdAt: "desc" }, take: 1 },
      materials: { orderBy: { createdAt: "desc" } },
      fitAnalysis: true,
    },
  });

  if (!job) {
    return (
      <div className="min-h-screen bg-zinc-50">
        <main className="mx-auto max-w-3xl px-6 py-10">
          <p className="text-sm text-zinc-600">Job not found.</p>
          <Link href="/" className="mt-2 inline-block text-sm font-medium text-indigo-600 hover:underline">
            ← Back to dashboard
          </Link>
        </main>
      </div>
    );
  }

  const ev = job.evaluations[0] ?? null;
  const appStatus = job.applicationStatus as AppStatus;
  const hasMaterials = job.materials.length > 0;
  const parsed = job.parsedJson as unknown as Record<string, unknown> | null;
  const blocked = Boolean(parsed?.["blocked"]);
  const blockedReason = (parsed?.["blockedReason"] as string | undefined) ?? undefined;
  const textLength =
    (parsed?.["textLength"] as number | undefined) ?? job.rawText?.length ?? 0;
  const needsDescription = Boolean(parsed?.["needsDescription"]);

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top nav */}
      <nav className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              CA
            </div>
            <span className="text-sm font-semibold text-zinc-900">Career Autopilot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/applications" className="text-sm text-zinc-500 transition-colors hover:text-zinc-900">Pipeline</Link>
            <Link href="/" className="text-sm text-zinc-500 transition-colors hover:text-zinc-900">← Dashboard</Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl space-y-5 px-6 py-8">
        {/* Header card */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl font-semibold text-zinc-900">
                {job.title ?? "(untitled job)"}
              </h1>
              <p className="text-sm text-zinc-500">
                {job.companyName ?? "Unknown company"}
                {job.location ? ` · ${job.location}` : ""}
                {job.workMode ? ` · ${job.workMode}` : ""}
              </p>
              {!job.sourceUrl.startsWith("manual:") && (
                <a
                  href={job.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 break-all text-xs text-indigo-600 hover:underline"
                >
                  {job.sourceUrl}
                </a>
              )}
              <p className="mt-1 text-xs text-zinc-400">
                Added{" "}
                {new Date(job.createdAt).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
                {job.source ? ` · ${job.source}` : ""}
              </p>
              <EditJobDetailsForm
                jobId={job.id}
                initialTitle={job.title ?? ""}
                initialCompany={job.companyName ?? ""}
                initialSourceUrl={job.sourceUrl}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
              {ev && (
                <div className="flex flex-col items-end gap-0.5">
                  <span className="text-xs text-zinc-400">Job Score</span>
                  <ScorePill score={ev.totalScore} />
                </div>
              )}
              {ev && <LabelBadge label={ev.label} />}
              <StatusBadge status={appStatus} />
            </div>
          </div>
        </div>

        {/* Needs-description banner — URL was parsed but no usable content found */}
        {needsDescription && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-5">
            <h3 className="text-sm font-semibold text-amber-900">
              ⚠ Job description not available
            </h3>
            <p className="mt-1 text-sm text-amber-800">
              This job URL could not be parsed reliably. Paste the full job description below to
              re-analyze it — scores, fit analysis, and generated materials will update automatically.
            </p>
            <p className="mt-1 text-xs text-amber-700">
              Some job boards block automated reading. If parsing fails, paste the job description manually.
            </p>
            <UpdateDescriptionForm jobId={job.id} />
          </div>
        )}

        {/* Lighter parsing warning for non-needs-description blocked/short pages */}
        {!needsDescription && (blocked || textLength < 800) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-sm font-semibold text-amber-900">⚠ Parsing warning</h3>
            <p className="mt-1 text-sm text-amber-800">
              This page may be blocked or extracted text is too short to score reliably.
              {blockedReason ? ` Reason: ${blockedReason}.` : ""}
            </p>
            <p className="mt-1 text-xs text-amber-700">
              Some job boards block automated reading. Paste the full job description below to improve analysis.
            </p>
            <UpdateDescriptionForm jobId={job.id} />
          </div>
        )}

        {/* Pipeline Status */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">Pipeline Status</h2>
          <StatusControls jobId={job.id} currentStatus={appStatus} />
        </div>

        {/* Application strategy / narrative */}
        {ev?.narrativeSuggestion && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-500">
              Application Strategy
            </h2>
            <p className="text-sm leading-relaxed text-zinc-800">{ev.narrativeSuggestion}</p>
          </div>
        )}

        {/* Fit Analysis */}
        {job.fitAnalysis && (() => {
          const fa = job.fitAnalysis;
          const matchingSkills = fa.matchingSkills as string[];
          const strengths = fa.strengths as string[];
          const gaps = fa.gaps as string[];
          const projects = fa.matchingProjects as string[];
          const scoreColor =
            fa.confidenceScore >= 70
              ? "bg-emerald-100 text-emerald-800"
              : fa.confidenceScore >= 45
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-800";
          return (
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="mb-4 text-sm font-semibold text-zinc-900">Fit Analysis</h2>

              {/* Top row: score + badges */}
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold tabular-nums ${scoreColor}`}>
                  {fa.confidenceScore}% fit confidence
                </span>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                  {fa.recommendedAngle}
                </span>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">
                  {fa.jobFocus}
                </span>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">
                  {fa.seniorityDetected}
                </span>
                <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-600">
                  {fa.companyType}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Matching skills */}
                {matchingSkills.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Matching Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {matchingSkills.map((s, i) => (
                        <span key={i} className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gaps */}
                {gaps.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Skill Gaps</p>
                    <div className="flex flex-wrap gap-1.5">
                      {gaps.map((g, i) => (
                        <span key={i} className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                {strengths.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Strengths</p>
                    <ul className="flex flex-col gap-1.5">
                      {strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-zinc-700">
                          <span className="mt-0.5 text-emerald-500">✓</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Matching projects */}
                {projects.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">Relevant Projects</p>
                    <ul className="flex flex-col gap-1.5">
                      {projects.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-zinc-700">
                          <span className="mt-0.5 text-indigo-400">▸</span>
                          {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* Score breakdown + Reasons / Risks / Gaps */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* Score breakdown */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-zinc-900">Score Breakdown</h2>
            {ev ? (
              <div className="flex flex-col gap-3">
                <ScoreBar label="Seniority" value={ev.seniorityFit} />
                <ScoreBar label="Stack" value={ev.stackFit} />
                <ScoreBar label="Domain" value={ev.domainFit} />
                <ScoreBar label="Language" value={ev.languageFit} />
                <ScoreBar label="Geography" value={ev.geographyFit} />
                <ScoreBar label="Salary" value={ev.salaryFit} />
                <ScoreBar label="Screening" value={ev.screeningFit} />
                <ScoreBar label="Honesty" value={ev.honestyFit} />
                <ScoreBar label="Effort / Reward" value={ev.effortReward} />
                <ScoreBar label="Strategic" value={ev.strategicValue} />
              </div>
            ) : (
              <p className="text-sm text-zinc-400">No evaluation yet.</p>
            )}
          </div>

          {/* Reasons / Risks / Gaps */}
          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Reasons to Apply
              </h2>
              <TagList
                items={(ev?.reasons ?? []) as unknown[]}
                chipClass="bg-emerald-50 text-emerald-800"
              />
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Risks
              </h2>
              <TagList
                items={(ev?.risks ?? []) as unknown[]}
                chipClass="bg-rose-50 text-rose-800"
              />
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Gaps
              </h2>
              <TagList
                items={(ev?.gaps ?? []) as unknown[]}
                chipClass="bg-amber-50 text-amber-800"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-zinc-900">Actions</h2>
          <div className="flex flex-wrap items-center gap-3">
            <DeleteJobButton jobId={job.id} />
          </div>
        </div>

        {/* Materials */}
        <MaterialsSection jobId={job.id} initialMaterials={job.materials} />

        {/* Raw text debug */}
        <details className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <summary className="cursor-pointer px-5 py-4 text-sm font-medium text-zinc-500 transition-colors hover:bg-zinc-50">
            Raw extracted text (debug)
          </summary>
          <div className="px-5 pb-5">
            <pre className="max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-xs text-zinc-500">
              {(job.rawText ?? "").slice(0, 12000)}
            </pre>
          </div>
        </details>
      </main>
    </div>
  );
}

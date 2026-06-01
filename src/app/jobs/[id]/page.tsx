import Link from "next/link";

import { prisma } from "@/lib/db";
import { GenerateCvButton } from "@/components/GenerateCvButton";
import { MarkAppliedButton } from "@/components/MarkAppliedButton";
import { DeleteJobButton } from "@/components/DeleteJobButton";

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
      applications: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { materials: { orderBy: { createdAt: "desc" }, take: 1 } },
      },
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
  const latestMaterial = job.applications[0]?.materials[0] ?? null;
  const isApplied =
    job.status === "APPLIED" || job.applications[0]?.status === "applied";
  const parsed = job.parsedJson as unknown as Record<string, unknown> | null;
  const blocked = Boolean(parsed?.["blocked"]);
  const blockedReason = (parsed?.["blockedReason"] as string | undefined) ?? undefined;
  const textLength =
    (parsed?.["textLength"] as number | undefined) ?? job.rawText?.length ?? 0;

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
          <Link href="/" className="text-sm text-zinc-500 transition-colors hover:text-zinc-900">
            ← Dashboard
          </Link>
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
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
              {ev && <ScorePill score={ev.totalScore} />}
              {ev && <LabelBadge label={ev.label} />}
              {isApplied && (
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
                  ✓ Applied
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Parsing warning */}
        {(blocked || textLength < 800) && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <h3 className="text-sm font-semibold text-amber-900">⚠ Parsing warning</h3>
            <p className="mt-1 text-sm text-amber-800">
              This page may be blocked or extracted text is too short to score reliably.
              {blockedReason ? ` Reason: ${blockedReason}.` : ""}
            </p>
            <p className="mt-2 text-sm text-amber-800">
              Recommended: copy and paste the full job description using the{" "}
              <Link href="/" className="font-medium underline">
                dashboard ingest form
              </Link>
              .
            </p>
          </div>
        )}

        {/* Application strategy / narrative */}
        {ev?.narrativeSuggestion && (
          <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-indigo-500">
              Application Strategy
            </h2>
            <p className="text-sm leading-relaxed text-zinc-800">{ev.narrativeSuggestion}</p>
          </div>
        )}

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
            <GenerateCvButton jobId={job.id} />
            <MarkAppliedButton jobId={job.id} isApplied={isApplied} />
            <DeleteJobButton jobId={job.id} />
          </div>
        </div>

        {/* Tailored CV */}
        {latestMaterial?.content && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">
              Tailored CV{" "}
              <span className="font-normal text-zinc-400">(v{latestMaterial.version})</span>
            </h2>
            <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-800">
              {latestMaterial.content}
            </pre>
          </div>
        )}

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

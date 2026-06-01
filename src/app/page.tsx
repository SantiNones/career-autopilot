import Link from "next/link";

import { prisma } from "@/lib/db";
import { IngestJobForm } from "@/components/IngestJobForm";
import { BulkIngestForm } from "@/components/BulkIngestForm";
import { RescoreButton } from "@/components/RescoreButton";
import { JobTableRow } from "@/components/JobTableRow";

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
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${color}`}
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
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${style}`}
    >
      {label}
    </span>
  );
}

export default async function Home() {
  const jobs = await prisma.jobPosting.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      evaluations: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const total = jobs.length;
  const applyCount = jobs.filter((j) => j.evaluations[0]?.label === "APPLY").length;
  const maybeCount = jobs.filter((j) => j.evaluations[0]?.label === "MAYBE").length;
  const skipCount = jobs.filter((j) => j.evaluations[0]?.label === "SKIP").length;
  const appliedCount = jobs.filter((j) => j.status === "APPLIED").length;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Top nav */}
      <nav className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              CA
            </div>
            <span className="text-sm font-semibold text-zinc-900">Career Autopilot</span>
            <span className="hidden rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700 sm:inline">
              MVP
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/profile" className="text-sm text-zinc-500 transition-colors hover:text-zinc-900">
              Profile
            </Link>
            <RescoreButton />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            Track, score, and apply to jobs with AI-powered analysis.
          </p>
        </div>

        {/* Metric cards */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {(
            [
              { label: "Total Jobs", value: total, valueColor: "text-zinc-900", cardClass: "border-zinc-200 bg-white" },
              { label: "Apply", value: applyCount, valueColor: "text-emerald-700", cardClass: "border-emerald-200 bg-emerald-50" },
              { label: "Maybe", value: maybeCount, valueColor: "text-amber-700", cardClass: "border-amber-200 bg-amber-50" },
              { label: "Skip", value: skipCount, valueColor: "text-rose-700", cardClass: "border-rose-200 bg-rose-50" },
              { label: "Applied", value: appliedCount, valueColor: "text-indigo-700", cardClass: "border-indigo-200 bg-indigo-50" },
            ] as const
          ).map((card) => (
            <div key={card.label} className={`rounded-xl border p-4 ${card.cardClass}`}>
              <div className={`text-2xl font-bold tabular-nums ${card.valueColor}`}>{card.value}</div>
              <div className="mt-1 text-xs font-medium text-zinc-500">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Ingest panels */}
        <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-3 text-sm font-semibold text-zinc-900">Add a Job</h2>
            <IngestJobForm />
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <h2 className="mb-1 text-sm font-semibold text-zinc-900">Bulk Ingest</h2>
            <p className="mb-3 text-xs text-zinc-400">
              Paste multiple URLs or descriptions separated by a blank line.
            </p>
            <BulkIngestForm />
          </div>
        </div>

        {/* Job table */}
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-zinc-900">Job Postings</h2>
            <p className="mt-0.5 text-xs text-zinc-400">Click any row to view details and actions.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/70">
                  <th className="px-5 py-3 text-xs font-medium text-zinc-400">Score</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-400">Label</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-400">Role</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-400">Source</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-400">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {jobs.map((job) => {
                  const ev = job.evaluations[0];
                  const isApplied = job.status === "APPLIED";
                  return (
                    <JobTableRow key={job.id} href={`/jobs/${job.id}`}>
                      <td className="px-5 py-3.5">
                        {ev ? (
                          <ScorePill score={ev.totalScore} />
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {ev ? (
                            <LabelBadge label={ev.label} />
                          ) : (
                            <span className="text-zinc-300">—</span>
                          )}
                          {isApplied && (
                            <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                              Applied
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-zinc-900">
                          {job.title ?? "(untitled)"}
                        </div>
                        {job.companyName && (
                          <div className="mt-0.5 text-xs text-zinc-400">{job.companyName}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                          {job.source ?? "manual"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-zinc-400">
                        {new Date(job.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </JobTableRow>
                  );
                })}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <p className="text-sm text-zinc-400">No jobs yet.</p>
                      <p className="mt-1 text-xs text-zinc-300">
                        Paste a URL or job description above to get started.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

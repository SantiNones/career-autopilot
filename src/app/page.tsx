import Link from "next/link";

import { prisma } from "@/lib/db";
import { calculateMetrics } from "@/lib/metrics";
import { IngestJobForm } from "@/components/IngestJobForm";
import { BulkIngestForm } from "@/components/BulkIngestForm";
import { RescoreButton } from "@/components/RescoreButton";
import { JobTableRow } from "@/components/JobTableRow";
import { ClearAllJobsButton } from "@/components/ClearAllJobsButton";

export const dynamic = "force-dynamic";

export default async function Home() {
  const jobs = await prisma.jobPosting.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      evaluations: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const m = calculateMetrics(jobs);

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
            <Link
              href="/applications"
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
            >
              Pipeline
            </Link>
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

        {/* Metric cards — row 1: counts */}
        <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {(
            [
              { label: "Total Jobs",  value: m.total,      valueColor: "text-zinc-900",    cardClass: "border-zinc-200 bg-white" },
              { label: "To Apply",    value: m.applyLabel,  valueColor: "text-emerald-700", cardClass: "border-emerald-200 bg-emerald-50" },
              { label: "Maybe",       value: m.maybeLabel,  valueColor: "text-amber-700",   cardClass: "border-amber-200 bg-amber-50" },
              { label: "Applied",     value: m.applied,     valueColor: "text-sky-700",     cardClass: "border-sky-200 bg-sky-50" },
              { label: "Interviews",  value: m.interviews,  valueColor: "text-violet-700",  cardClass: "border-violet-200 bg-violet-50" },
              { label: "Offers",      value: m.offers,      valueColor: "text-emerald-800", cardClass: "border-emerald-300 bg-emerald-100" },
            ] as const
          ).map((card) => (
            <div key={card.label} className={`rounded-xl border p-4 ${card.cardClass}`}>
              <div className={`text-2xl font-bold tabular-nums ${card.valueColor}`}>{card.value}</div>
              <div className="mt-1 text-xs font-medium text-zinc-500">{card.label}</div>
            </div>
          ))}
        </div>

        {/* Metric cards — row 2: rates */}
        <div className="mb-8 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
            <div className="text-2xl font-bold tabular-nums text-violet-700">{m.interviewRate}%</div>
            <div className="mt-1 text-xs font-medium text-zinc-500">
              Interview rate <span className="text-zinc-400">(applied → interview)</span>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-300 bg-emerald-100 p-4">
            <div className="text-2xl font-bold tabular-nums text-emerald-800">{m.offerRate}%</div>
            <div className="mt-1 text-xs font-medium text-zinc-500">
              Offer rate <span className="text-zinc-400">(interview → offer)</span>
            </div>
          </div>
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
                  <th className="px-5 py-3 text-xs font-medium text-zinc-400">AI Label</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-400">Status</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-400">Role</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-400">Source</th>
                  <th className="px-5 py-3 text-xs font-medium text-zinc-400">Added</th>
                  <th className="px-5 py-3 text-right text-xs font-medium text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {jobs.map((job) => (
                  <JobTableRow key={job.id} job={job} />
                ))}
                {jobs.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
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
        <div className="mt-3 flex justify-end">
          <ClearAllJobsButton />
        </div>
      </main>
    </div>
  );
}

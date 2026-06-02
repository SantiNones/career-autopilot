import Link from "next/link";

import { prisma } from "@/lib/db";
import { calculateMetrics } from "@/lib/metrics";
import type { ApplicationStatus } from "@prisma/client";
import { STATUS_COLORS, STATUS_LABELS } from "@/components/StatusControls";
import type { AppStatus } from "@/components/StatusControls";

export const dynamic = "force-dynamic";

type Column = {
  status: ApplicationStatus;
  headerBg: string;
  headerText: string;
  bodyBg: string;
  borderColor: string;
};

const COLUMNS: Column[] = [
  {
    status: "DISCOVERED",
    headerBg: "bg-zinc-100",
    headerText: "text-zinc-700",
    bodyBg: "bg-zinc-50",
    borderColor: "border-zinc-200",
  },
  {
    status: "APPLY",
    headerBg: "bg-emerald-100",
    headerText: "text-emerald-800",
    bodyBg: "bg-emerald-50/50",
    borderColor: "border-emerald-200",
  },
  {
    status: "MAYBE",
    headerBg: "bg-amber-100",
    headerText: "text-amber-800",
    bodyBg: "bg-amber-50/50",
    borderColor: "border-amber-200",
  },
  {
    status: "APPLIED",
    headerBg: "bg-sky-100",
    headerText: "text-sky-800",
    bodyBg: "bg-sky-50/50",
    borderColor: "border-sky-200",
  },
  {
    status: "INTERVIEW",
    headerBg: "bg-violet-100",
    headerText: "text-violet-800",
    bodyBg: "bg-violet-50/50",
    borderColor: "border-violet-200",
  },
  {
    status: "OFFER",
    headerBg: "bg-emerald-200",
    headerText: "text-emerald-900",
    bodyBg: "bg-emerald-50",
    borderColor: "border-emerald-300",
  },
  {
    status: "REJECTED",
    headerBg: "bg-rose-100",
    headerText: "text-rose-800",
    bodyBg: "bg-rose-50/50",
    borderColor: "border-rose-200",
  },
];

function ScorePill({ score }: { score: number }) {
  const color =
    score >= 70
      ? "bg-emerald-100 text-emerald-800"
      : score >= 50
        ? "bg-amber-100 text-amber-800"
        : "bg-rose-100 text-rose-800";
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums ${color}`}>
      {score}
    </span>
  );
}

export default async function ApplicationsPage() {
  const jobs = await prisma.jobPosting.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      evaluations: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const metrics = calculateMetrics(jobs);

  const byStatus = new Map<ApplicationStatus, typeof jobs>();
  for (const col of COLUMNS) {
    byStatus.set(col.status, []);
  }
  for (const job of jobs) {
    const group = byStatus.get(job.applicationStatus);
    if (group) group.push(job);
    else {
      const discovered = byStatus.get("DISCOVERED");
      if (discovered) discovered.push(job);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Nav */}
      <nav className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              CA
            </div>
            <span className="text-sm font-semibold text-zinc-900">Career Autopilot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-zinc-500 transition-colors hover:text-zinc-900">
              Dashboard
            </Link>
            <Link
              href="/applications"
              className="text-sm font-medium text-indigo-600"
            >
              Pipeline
            </Link>
            <Link
              href="/profile"
              className="text-sm text-zinc-500 transition-colors hover:text-zinc-900"
            >
              Profile
            </Link>
          </div>
        </div>
      </nav>

      <main className="px-6 py-8">
        {/* Page heading + rates */}
        <div className="mx-auto mb-6 max-w-7xl flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Application Pipeline</h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              {jobs.length} jobs tracked across all stages.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-2 text-center">
              <div className="text-lg font-bold tabular-nums text-violet-700">
                {metrics.interviewRate}%
              </div>
              <div className="text-xs text-zinc-500">Interview rate</div>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-center">
              <div className="text-lg font-bold tabular-nums text-emerald-700">
                {metrics.offerRate}%
              </div>
              <div className="text-xs text-zinc-500">Offer rate</div>
            </div>
          </div>
        </div>

        {/* Kanban board */}
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4" style={{ minWidth: `${COLUMNS.length * 248}px` }}>
            {COLUMNS.map((col) => {
              const colJobs = byStatus.get(col.status) ?? [];
              return (
                <div
                  key={col.status}
                  className={`w-58 flex-shrink-0 overflow-hidden rounded-xl border ${col.borderColor}`}
                  style={{ width: "232px" }}
                >
                  {/* Column header */}
                  <div
                    className={`flex items-center justify-between px-3 py-2.5 ${col.headerBg}`}
                  >
                    <span className={`text-xs font-semibold uppercase tracking-wide ${col.headerText}`}>
                      {STATUS_LABELS[col.status as AppStatus]}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${STATUS_COLORS[col.status as AppStatus]}`}
                    >
                      {colJobs.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className={`flex flex-col gap-2 p-2 min-h-24 ${col.bodyBg}`}>
                    {colJobs.map((job) => {
                      const ev = job.evaluations[0];
                      return (
                        <Link
                          key={job.id}
                          href={`/jobs/${job.id}`}
                          className="block rounded-lg border border-zinc-100 bg-white p-3 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
                        >
                          <p className="text-xs font-semibold leading-snug text-zinc-900 line-clamp-2">
                            {job.title ?? "(untitled)"}
                          </p>
                          {job.companyName && (
                            <p className="mt-0.5 text-xs text-zinc-400 truncate">
                              {job.companyName}
                            </p>
                          )}
                          {ev && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <ScorePill score={ev.totalScore} />
                              <span className="text-xs text-zinc-400">{ev.label}</span>
                            </div>
                          )}
                          <p className="mt-1.5 text-xs text-zinc-300">
                            {new Date(job.updatedAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </p>
                        </Link>
                      );
                    })}
                    {colJobs.length === 0 && (
                      <p className="px-2 py-4 text-center text-xs text-zinc-300">Empty</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";

type RecommendedJob = {
  id: string;
  title: string;
  company: string;
  location: string | null;
  applyUrl: string;
  source: string;
  provider: string;
  matchScore: number;
  label: string | null;
  reasons: unknown;
  risks: unknown;
};

type DiscoverySummary = {
  providersRun: number;
  companiesScanned: number;
  jobsFetched: number;
  afterDedupe: number;
  jobsSaved: number;
  topMatches: Array<{ company: string; title: string; matchScore: number }>;
};

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 70
      ? "bg-emerald-100 text-emerald-800"
      : score >= 50
        ? "bg-amber-100 text-amber-800"
        : "bg-rose-100 text-rose-800";
  return (
    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold tabular-nums ${cls}`}>
      {score}
    </span>
  );
}

function LabelBadge({ label }: { label: string | null }) {
  if (!label) return null;
  const cls =
    label === "APPLY"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : label === "MAYBE"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-zinc-50 text-zinc-500 border-zinc-200";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {label}
    </span>
  );
}

export function RecommendedJobsSection({ initialJobs }: { initialJobs: RecommendedJob[] }) {
  const [jobs, setJobs] = useState<RecommendedJob[]>(initialJobs);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<DiscoverySummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDiscover() {
    setIsRunning(true);
    setError(null);
    setSummary(null);

    try {
      const runRes = await fetch("/api/discovery/run", { method: "POST" });
      const runData = await runRes.json();

      if (!runData.success) {
        setError(runData.error ?? "Discovery failed");
        return;
      }

      setSummary(runData as DiscoverySummary);

      const listRes = await fetch("/api/discovery/recommended");
      const listData = await listRes.json();
      if (listData.success) {
        setJobs(listData.jobs as RecommendedJob[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Discovery failed");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Recommended Jobs</h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Public jobs discovered from Greenhouse, Lever, and Ashby, scored against your preferences.
          </p>
        </div>
        <button
          onClick={handleDiscover}
          disabled={isRunning}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Discovering…
            </>
          ) : (
            "Discover Jobs"
          )}
        </button>
      </div>

      {error && (
        <div className="border-b border-rose-100 bg-rose-50 px-5 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      {summary && (
        <div className="border-b border-zinc-100 bg-zinc-50/70 px-5 py-3 text-xs text-zinc-600">
          Scanned <strong>{summary.companiesScanned}</strong> companies across{" "}
          <strong>{summary.providersRun}</strong> providers · fetched{" "}
          <strong>{summary.jobsFetched}</strong> jobs · <strong>{summary.afterDedupe}</strong>{" "}
          after dedupe · saved <strong>{summary.jobsSaved}</strong> recommendations.
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-zinc-400">No recommended jobs yet.</p>
          <p className="mt-1 text-xs text-zinc-300">
            Click “Discover Jobs” to fetch and score public jobs.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-100">
          {jobs.map((job) => {
            const reasons = toStringArray(job.reasons);
            const risks = toStringArray(job.risks);
            return (
              <li key={job.id} className="flex items-start gap-4 px-5 py-4">
                <ScoreBadge score={job.matchScore} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-zinc-900">{job.title}</span>
                    <LabelBadge label={job.label} />
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500">
                    {job.company}
                    {job.location ? ` · ${job.location}` : ""} ·{" "}
                    <span className="text-zinc-400">{job.source}</span>
                  </div>
                  {reasons.length > 0 && (
                    <p className="mt-1.5 text-xs text-emerald-700">
                      {reasons.slice(0, 2).join(" · ")}
                    </p>
                  )}
                  {risks.length > 0 && (
                    <p className="mt-0.5 text-xs text-rose-600">
                      {risks.slice(0, 2).join(" · ")}
                    </p>
                  )}
                </div>
                <a
                  href={job.applyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                >
                  Apply ↗
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

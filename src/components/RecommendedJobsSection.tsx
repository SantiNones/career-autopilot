"use client";

import { useState } from "react";

interface RecommendedJob {
  id: string;
  title: string;
  company: string;
  location: string | null;
  source: string;
  matchScore: number;
  applyUrl: string;
  createdAt: Date;
}

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

export function RecommendedJobsSection({
  initialJobs,
}: {
  initialJobs: RecommendedJob[];
}) {
  const [jobs, setJobs] = useState<RecommendedJob[]>(initialJobs);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [lastResult, setLastResult] = useState<{
    totalFetched: number;
    afterDedupe: number;
    saved: number;
  } | null>(null);

  async function handleDiscover() {
    setIsDiscovering(true);
    setLastResult(null);

    try {
      const response = await fetch("/api/jobs/discover", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setLastResult({
          totalFetched: data.totalFetched,
          afterDedupe: data.afterDedupe,
          saved: data.saved,
        });
        // Refresh the page to get updated jobs
        window.location.reload();
      } else {
        console.error("Discovery failed:", data.error);
        alert(`Discovery failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Discovery error:", error);
      alert("Discovery failed. Please try again.");
    } finally {
      setIsDiscovering(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">Recommended Jobs</h2>
        <button
          onClick={handleDiscover}
          disabled={isDiscovering}
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDiscovering ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Discovering...
            </>
          ) : (
            "Discover Jobs"
          )}
        </button>
      </div>

      {lastResult && (
        <div className="rounded-md bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          Found {lastResult.totalFetched} jobs, deduped to {lastResult.afterDedupe},
          saved {lastResult.saved} top matches.
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="rounded-lg border border-zinc-200 bg-white px-6 py-12 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100">
            <svg
              className="h-6 w-6 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-zinc-900">No recommended jobs yet</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Click "Discover Jobs" to find and score jobs from top companies.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Match
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Job
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Location
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Source
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-zinc-50">
                  <td className="px-5 py-3.5">
                    <ScorePill score={job.matchScore} />
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-zinc-900">{job.title}</div>
                    <div className="mt-0.5 text-xs text-zinc-500">{job.company}</div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-zinc-600">
                    {job.location || "Not specified"}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">
                      {job.source}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center rounded-md bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
                    >
                      Apply
                      <svg
                        className="ml-1 h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

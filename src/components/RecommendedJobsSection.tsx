"use client";

import { useState, useMemo } from "react";

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
  gaps: unknown;
  description?: string | null;
  discoveredAt?: string | null;
  createdJobId?: string | null;
  // V1.2 Discovery fields
  locationCategory?: string | null;
  locationEligible?: boolean;
  seniorityLevel?: string | null;
  seniorityAllowed?: boolean;
  baseScore?: number;
  finalScore?: number;
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

function LocationBadge({ category, eligible }: { category: string | null; eligible: boolean | null }) {
  if (!category) return null;
  
  const getCategoryDisplay = (cat: string) => {
    switch (cat) {
      case "barcelona": return "Barcelona";
      case "spain": return "Spain";
      case "europe": return "Europe";
      case "remote_global": return "Remote Global";
      case "remote_europe": return "Remote Europe";
      case "remote_spain": return "Remote Spain";
      case "remote_us_only": return "Remote US Only";
      case "remote_unknown": return "Remote";
      case "onsite_incompatible": return "Incompatible";
      case "unknown": return "Unknown";
      default: return cat;
    }
  };

  const cls = eligible 
    ? "bg-blue-50 text-blue-700 border-blue-200"
    : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {getCategoryDisplay(category)}
    </span>
  );
}

function SeniorityBadge({ level, allowed }: { level: string | null; allowed: boolean | null }) {
  if (!level) return null;
  
  const getLevelDisplay = (lvl: string) => {
    switch (lvl) {
      case "internship": return "Internship";
      case "new_grad": return "New Grad";
      case "junior": return "Junior";
      case "associate": return "Associate";
      case "mid": return "Mid";
      case "senior": return "Senior";
      case "staff": return "Staff";
      case "lead": return "Lead";
      case "manager": return "Manager";
      case "unknown": return "Unknown";
      default: return lvl;
    }
  };

  const cls = allowed 
    ? "bg-purple-50 text-purple-700 border-purple-200"
    : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${cls}`}>
      {getLevelDisplay(level)}
    </span>
  );
}

export function RecommendedJobsSection({ initialJobs }: { initialJobs: RecommendedJob[] }) {
  const [jobs, setJobs] = useState<RecommendedJob[]>(initialJobs);
  const [isRunning, setIsRunning] = useState(false);
  const [summary, setSummary] = useState<DiscoverySummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<"all" | "apply" | "maybe" | "remote" | "eligible" | "eligible_junior">("eligible_junior");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [creatingJobId, setCreatingJobId] = useState<string | null>(null);
  const [createJobSuccess, setCreateJobSuccess] = useState<string | null>(null);
  
  const JOBS_PER_PAGE = 10;

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

  // Filter and paginate jobs
  const filteredJobs = useMemo(() => {
    let filtered = jobs;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job => 
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        (job.location && job.location.toLowerCase().includes(query)) ||
        (job.description && job.description.toLowerCase().includes(query)) ||
        job.provider.toLowerCase().includes(query)
      );
    }
    
    // Apply quick filters
    if (selectedFilter === "apply") {
      filtered = filtered.filter(job => job.label === "APPLY");
    } else if (selectedFilter === "maybe") {
      filtered = filtered.filter(job => job.label === "MAYBE");
    } else if (selectedFilter === "remote") {
      filtered = filtered.filter(job => 
        job.location && (job.location.toLowerCase().includes("remote") || job.location.toLowerCase().includes("anywhere"))
      );
    } else if (selectedFilter === "eligible") {
      filtered = filtered.filter(job => job.locationEligible === true);
    } else if (selectedFilter === "eligible_junior") {
      filtered = filtered.filter(job => 
        job.locationEligible === true && 
        job.seniorityAllowed === true
      );
    }
    
    return filtered;
  }, [jobs, searchQuery, selectedFilter]);
  
  const totalPages = Math.ceil(filteredJobs.length / JOBS_PER_PAGE);
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    return filteredJobs.slice(startIndex, startIndex + JOBS_PER_PAGE);
  }, [filteredJobs, currentPage]);
  
  // Reset to page 1 when filters change
  const handleFilterChange = (newFilter: typeof selectedFilter) => {
    setSelectedFilter(newFilter);
    setCurrentPage(1);
  };
  
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };
  
  // Create job from recommended job
  const handleCreateJob = async (jobId: string) => {
    setCreatingJobId(jobId);
    setCreateJobSuccess(null);
    
    try {
      const response = await fetch(`/api/discovery/recommended/${jobId}/create-job`, {
        method: "POST"
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCreateJobSuccess(jobId);
        // Update the job to show it's been created
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, createdJobId: data.createdJobId } : job
        ));
        
        // Navigate to job detail after a short delay
        setTimeout(() => {
          if (data.jobUrl) {
            window.location.href = data.jobUrl;
          }
        }, 1500);
      } else {
        setError(data.error || "Failed to create job");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create job");
    } finally {
      setCreatingJobId(null);
    }
  };
  
  // Summary for collapsed state
  const collapsedSummary = useMemo(() => {
    const applyCount = jobs.filter(job => job.label === "APPLY").length;
    const maybeCount = jobs.filter(job => job.label === "MAYBE").length;
    const topMatch = jobs[0];
    
    return {
      total: jobs.length,
      applyCount,
      maybeCount,
      topMatch: topMatch ? `${topMatch.title} at ${topMatch.company}` : null
    };
  }, [jobs]);

  return (
    <div className="mb-6 overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="shrink-0 rounded-lg p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
          >
            <svg 
              className={`h-4 w-4 transition-transform ${isCollapsed ? "rotate-90" : ""}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">Recommended Jobs</h2>
            {!isCollapsed && (
              <p className="mt-0.5 text-xs text-zinc-400">
                Public jobs discovered from Greenhouse, Lever, and Ashby, scored against your preferences.
              </p>
            )}
          </div>
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
      
      {isCollapsed && jobs.length > 0 && (
        <div className="px-5 py-3 text-xs text-zinc-600 bg-zinc-50/50">
          <strong>{collapsedSummary.total}</strong> jobs · 
          <strong className="text-emerald-600">{collapsedSummary.applyCount}</strong> apply · 
          <strong className="text-amber-600">{collapsedSummary.maybeCount}</strong> maybe
          {collapsedSummary.topMatch && (
            <span className="ml-2 text-zinc-500">Top: {collapsedSummary.topMatch}</span>
          )}
        </div>
      )}

      {!isCollapsed && summary && (
        <div className="border-b border-zinc-100 bg-zinc-50/70 px-5 py-3 text-xs text-zinc-600">
          Scanned <strong>{summary.companiesScanned}</strong> companies across{" "}
          <strong>{summary.providersRun}</strong> providers · fetched{" "}
          <strong>{summary.jobsFetched}</strong> jobs · <strong>{summary.afterDedupe}</strong>{" "}
          after dedupe · saved <strong>{summary.jobsSaved}</strong> recommendations.
        </div>
      )}

      {!isCollapsed && (
        <>
          {/* Search and Filters */}
          {jobs.length > 0 && (
            <div className="border-b border-zinc-100 px-5 py-3">
              <div className="flex flex-col gap-3">
                {/* Search Bar */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by title, company, location, description..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm placeholder-zinc-400 focus:border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-300"
                  />
                  <svg className="absolute right-3 top-2.5 h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                
                {/* Quick Filters */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleFilterChange("all")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedFilter === "all"
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    All ({jobs.length})
                  </button>
                  <button
                    onClick={() => handleFilterChange("apply")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedFilter === "apply"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                  >
                    Apply ({jobs.filter(job => job.label === "APPLY").length})
                  </button>
                  <button
                    onClick={() => handleFilterChange("maybe")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedFilter === "maybe"
                        ? "bg-amber-600 text-white"
                        : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                    }`}
                  >
                    Maybe ({jobs.filter(job => job.label === "MAYBE").length})
                  </button>
                  <button
                    onClick={() => handleFilterChange("remote")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedFilter === "remote"
                        ? "bg-blue-600 text-white"
                        : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                    }`}
                  >
                    Remote ({jobs.filter(job => 
                      job.location && (job.location.toLowerCase().includes("remote") || job.location.toLowerCase().includes("anywhere"))
                    ).length})
                  </button>
                  <button
                    onClick={() => handleFilterChange("eligible")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedFilter === "eligible"
                        ? "bg-indigo-600 text-white"
                        : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                    }`}
                  >
                    Eligible ({jobs.filter(job => job.locationEligible === true).length})
                  </button>
                  <button
                    onClick={() => handleFilterChange("eligible_junior")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                      selectedFilter === "eligible_junior"
                        ? "bg-purple-600 text-white"
                        : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                    }`}
                  >
                    Eligible + Junior ({jobs.filter(job => 
                      job.locationEligible === true && job.seniorityAllowed === true
                    ).length})
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {jobs.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-zinc-400">No recommended jobs yet.</p>
              <p className="mt-1 text-xs text-zinc-300">
                Click "Discover Jobs" to fetch and score public jobs.
              </p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm text-zinc-400">No jobs match your filters.</p>
              <p className="mt-1 text-xs text-zinc-300">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <>
              <ul className="divide-y divide-zinc-100">
                {paginatedJobs.map((job) => {
                  const reasons = toStringArray(job.reasons);
                  const risks = toStringArray(job.risks);
                  const gaps = toStringArray(job.gaps);
                  const isExpanded = expandedJobId === job.id;
                  const isCreated = !!job.createdJobId;
                  const showCreateSuccess = createJobSuccess === job.id;
                  
                  return (
                    <li key={job.id} className="border-b border-zinc-100 last:border-b-0">
                      <div className="px-5 py-4">
                        <div className="flex items-start gap-4">
                          <ScoreBadge score={job.matchScore} />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                                className="text-sm font-medium text-zinc-900 hover:text-zinc-600 transition-colors text-left"
                              >
                                {job.title}
                              </button>
                              <LabelBadge label={job.label} />
                              <LocationBadge category={job.locationCategory || null} eligible={job.locationEligible ?? null} />
                              <SeniorityBadge level={job.seniorityLevel || null} allowed={job.seniorityAllowed ?? null} />
                              {isCreated && (
                                <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[11px] font-medium">
                                  Created ✓
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 text-xs text-zinc-500">
                              {job.company}
                              {job.location ? ` · ${job.location}` : ""} ·{" "}
                              <span className="text-zinc-400">{job.source}</span>
                            </div>
                            
                            {/* Collapsible details */}
                            {isExpanded && (
                              <div className="mt-3 space-y-2">
                                {reasons.length > 0 && (
                                  <div className="rounded-lg bg-emerald-50 p-3">
                                    <p className="text-xs font-medium text-emerald-800 mb-1">Why it matches:</p>
                                    <ul className="text-xs text-emerald-700 space-y-0.5">
                                      {reasons.map((reason, idx) => (
                                        <li key={idx} className="flex items-start gap-1">
                                          <span className="text-emerald-500 mt-0.5">•</span>
                                          <span>{reason}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {risks.length > 0 && (
                                  <div className="rounded-lg bg-rose-50 p-3">
                                    <p className="text-xs font-medium text-rose-800 mb-1">Potential risks:</p>
                                    <ul className="text-xs text-rose-700 space-y-0.5">
                                      {risks.map((risk, idx) => (
                                        <li key={idx} className="flex items-start gap-1">
                                          <span className="text-rose-500 mt-0.5">•</span>
                                          <span>{risk}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {gaps.length > 0 && (
                                  <div className="rounded-lg bg-amber-50 p-3">
                                    <p className="text-xs font-medium text-amber-800 mb-1">Experience gaps:</p>
                                    <ul className="text-xs text-amber-700 space-y-0.5">
                                      {gaps.map((gap, idx) => (
                                        <li key={idx} className="flex items-start gap-1">
                                          <span className="text-amber-500 mt-0.5">•</span>
                                          <span>{gap}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                
                                {job.description && (
                                  <div className="rounded-lg bg-zinc-50 p-3">
                                    <p className="text-xs font-medium text-zinc-800 mb-1">Description preview:</p>
                                    <p className="text-xs text-zinc-700 line-clamp-3">
                                      {job.description.slice(0, 300)}...
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2 shrink-0">
                            <a
                              href={job.applyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100 text-center"
                            >
                              Apply ↗
                            </a>
                            
                            {!isCreated && (
                              <button
                                onClick={() => handleCreateJob(job.id)}
                                disabled={creatingJobId === job.id}
                                className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50 text-center"
                              >
                                {creatingJobId === job.id ? (
                                  <span className="flex items-center gap-1">
                                    <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating...
                                  </span>
                                ) : (
                                  "Create Job"
                                )}
                              </button>
                            )}
                            
                            {showCreateSuccess && (
                              <div className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-800 text-center">
                                Opening Job...
                              </div>
                            )}
                            
                            {isCreated && !showCreateSuccess && (
                              <a
                                href={`/jobs/${job.createdJobId}`}
                                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 text-center"
                              >
                                Open Job →
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-t border-zinc-100 px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-zinc-500">
                      Showing {((currentPage - 1) * JOBS_PER_PAGE) + 1}-{Math.min(currentPage * JOBS_PER_PAGE, filteredJobs.length)} of {filteredJobs.length}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 disabled:bg-zinc-50 disabled:text-zinc-400"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 disabled:bg-zinc-50 disabled:text-zinc-400"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

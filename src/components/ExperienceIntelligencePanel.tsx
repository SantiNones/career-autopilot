"use client";

import { useEffect, useState } from "react";

type InsightEntry = {
  company: string;
  role: string;
  responsibilities: string[];
  skills: string[];
  keywords: string[];
  metrics: string[];
  transferableNarratives: string[];
  workEnvironment: string[];
  professionalThemes: string[];
};

type ApiResponse = {
  insights: InsightEntry[] | null;
  analyzedAt: string | null;
  error?: string;
};

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function Pill({ text, color }: { text: string; color: string }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {text}
    </span>
  );
}

function InsightCard({ entry }: { entry: InsightEntry }) {
  const [open, setOpen] = useState(false);

  const hasContent =
    entry.responsibilities.length > 0 ||
    entry.skills.length > 0 ||
    entry.keywords.length > 0 ||
    entry.metrics.length > 0 ||
    (entry.transferableNarratives?.length ?? 0) > 0 ||
    (entry.workEnvironment?.length ?? 0) > 0 ||
    (entry.professionalThemes?.length ?? 0) > 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-zinc-50"
        aria-expanded={open}
      >
        <div>
          <p className="text-sm font-semibold text-zinc-900">{entry.company}</p>
          <p className="mt-0.5 text-xs text-zinc-500">{entry.role}</p>
        </div>
        {hasContent && <ChevronIcon open={open} />}
      </button>

      {open && hasContent && (
        <div className="border-t border-zinc-100 px-5 pb-5 pt-4 flex flex-col gap-4">
          {entry.responsibilities.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Core Responsibilities
              </p>
              <ul className="flex flex-col gap-1">
                {entry.responsibilities.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {entry.skills.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Transferable Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {entry.skills.map((s, i) => (
                  <Pill key={i} text={s} color="bg-indigo-50 text-indigo-700" />
                ))}
              </div>
            </div>
          )}

          {entry.keywords.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Keywords
              </p>
              <div className="flex flex-wrap gap-1.5">
                {entry.keywords.map((k, i) => (
                  <Pill key={i} text={k} color="bg-zinc-100 text-zinc-600" />
                ))}
              </div>
            </div>
          )}

          {entry.metrics.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Metrics
              </p>
              <div className="flex flex-wrap gap-1.5">
                {entry.metrics.map((m, i) => (
                  <Pill key={i} text={m} color="bg-emerald-50 text-emerald-700" />
                ))}
              </div>
            </div>
          )}

          {(entry.transferableNarratives?.length ?? 0) > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Transferable Narratives
              </p>
              <ul className="flex flex-col gap-1">
                {entry.transferableNarratives.map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-zinc-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(entry.workEnvironment?.length ?? 0) > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Work Environment
              </p>
              <div className="flex flex-wrap gap-1.5">
                {entry.workEnvironment.map((w, i) => (
                  <Pill key={i} text={w} color="bg-sky-50 text-sky-700" />
                ))}
              </div>
            </div>
          )}

          {(entry.professionalThemes?.length ?? 0) > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Professional Themes
              </p>
              <div className="flex flex-wrap gap-1.5">
                {entry.professionalThemes.map((t, i) => (
                  <Pill key={i} text={t} color="bg-violet-50 text-violet-700" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ExperienceIntelligencePanel() {
  const [insights, setInsights] = useState<InsightEntry[] | null>(null);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/profile/experience-intelligence");
        const data = (await res.json()) as ApiResponse;
        if (data.insights) setInsights(data.insights);
        if (data.analyzedAt) setAnalyzedAt(data.analyzedAt);
      } catch {
        // silently ignore on initial load
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/experience-intelligence/analyze", { method: "POST" });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) {
        setError(data.error ?? "Analysis failed. Please try again.");
        return;
      }
      setInsights(data.insights);
      setAnalyzedAt(data.analyzedAt);
    } catch {
      setError("Analysis failed. Please check your connection and try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-500 mt-0.5">
            AI-generated structured insights from your experience section.
          </p>
          {analyzedAt && (
            <p className="text-xs text-zinc-400 mt-0.5">
              Last analyzed{" "}
              {new Date(analyzedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => void handleAnalyze()}
          disabled={analyzing}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {analyzing ? (
            <span className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Analyzing…
            </span>
          ) : insights ? (
            "Re-analyze"
          ) : (
            "Analyze Experience"
          )}
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
          {error}
        </p>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Loading…
        </div>
      )}

      {!loading && !insights && !analyzing && !error && (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-8 text-center">
          <p className="text-sm font-medium text-zinc-600">No insights yet</p>
          <p className="mt-1 text-xs text-zinc-400">
            Click <span className="font-semibold">Analyze Experience</span> to generate structured insights from your master resume experience section.
          </p>
        </div>
      )}

      {insights && insights.length > 0 && (
        <div className="flex flex-col gap-3">
          {insights.map((entry, i) => (
            <InsightCard key={i} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}

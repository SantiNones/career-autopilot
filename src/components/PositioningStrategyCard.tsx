"use client";

import { useState, useEffect } from "react";

import type { PositioningProfile } from "@/app/api/jobs/[id]/positioning/analyze/route";

// ─── Staged Loading Messages ────────────────────────────────────────────────

const LOADING_STAGES = [
  "Analyzing role requirements...",
  "Identifying strongest narrative...",
  "Evaluating risks and gaps...",
  "Building positioning strategy...",
  "Finalizing recommendations...",
];

function useLoadingStage(isAnalyzing: boolean) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!isAnalyzing) {
      setStage(0);
      return;
    }

    const interval = setInterval(() => {
      setStage((s) => (s < LOADING_STAGES.length - 1 ? s + 1 : s));
    }, 4000); // Change stage every 4 seconds

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  return LOADING_STAGES[stage];
}

// ─── UI Components ──────────────────────────────────────────────────────────

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

function Section({
  title,
  children,
  color = "zinc",
}: {
  title: string;
  children: React.ReactNode;
  color?: "green" | "blue" | "indigo" | "amber" | "orange" | "purple" | "cyan" | "neutral" | "zinc" | "red";
}) {
  const colorStyles: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-800 border-emerald-200",
    blue: "bg-sky-50 text-sky-800 border-sky-200",
    indigo: "bg-indigo-50 text-indigo-800 border-indigo-200",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    orange: "bg-orange-50 text-orange-800 border-orange-200",
    purple: "bg-violet-50 text-violet-800 border-violet-200",
    cyan: "bg-cyan-50 text-cyan-800 border-cyan-200",
    red: "bg-rose-50 text-rose-800 border-rose-200",
    neutral: "bg-zinc-100 text-zinc-700 border-zinc-200",
    zinc: "bg-white text-zinc-700 border-zinc-200",
  };

  return (
    <div className={`rounded-lg border p-4 ${colorStyles[color]}`}>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide opacity-70">{title}</p>
      <div className="text-sm leading-relaxed">{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-xs text-zinc-400">None identified.</p>;
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-50" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function NumberedList({ items }: { items: string[] }) {
  if (!items.length) return <p className="text-xs text-zinc-400">None identified.</p>;
  return (
    <ol className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
            {i + 1}
          </span>
          <span className="font-medium">{item}</span>
        </li>
      ))}
    </ol>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-emerald-100 text-emerald-800" : score >= 60 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold tabular-nums ${color}`}>
      {score}%
    </span>
  );
}

export function PositioningStrategyCard({
  profile,
  analyzedAt,
  jobId,
  onAnalyze,
  isAnalyzing,
}: {
  profile: PositioningProfile | null;
  analyzedAt: string | null;
  jobId: string;
  onAnalyze?: () => void;
  isAnalyzing?: boolean;
}) {
  const [open, setOpen] = useState(true);
  const loadingStage = useLoadingStage(isAnalyzing ?? false);

  const hasProfile = profile !== null;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-3 text-left transition-colors hover:bg-zinc-50 -ml-2 rounded-lg px-2 py-1"
          aria-expanded={open}
        >
          <div>
            <p className="text-sm font-semibold text-zinc-900">Positioning Strategy</p>
            {analyzedAt && (
              <p className="mt-0.5 text-xs text-zinc-500">
                Last analyzed{" "}
                {new Date(analyzedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
          {profile && <ScoreBadge score={profile.confidence} />}
        </button>

        <div className="flex items-center gap-2">
          {hasProfile && (
            <button
              type="button"
              onClick={() => onAnalyze?.()}
              disabled={isAnalyzing}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
            >
              {isAnalyzing ? "Analyzing…" : "Re-analyze"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="p-1 rounded-md hover:bg-zinc-100 transition-colors"
            aria-label={open ? "Collapse" : "Expand"}
          >
            <ChevronIcon open={open} />
          </button>
        </div>
      </div>

      {/* Content */}
      {open && (
        <div className="border-t border-zinc-100 px-5 pb-5 pt-4">
          {!hasProfile && (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-8 text-center">
              <p className="text-sm font-medium text-zinc-600">No positioning strategy yet</p>
              <p className="mt-1 text-xs text-zinc-400">
                Generate a strategic positioning profile tailored to this role.
              </p>
              <button
                type="button"
                onClick={onAnalyze}
                disabled={isAnalyzing}
                className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <span className="flex flex-col items-center gap-1.5">
                    <span className="flex items-center gap-1.5">
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Analyzing…
                    </span>
                    <span className="text-[10px] font-normal opacity-80">{loadingStage}</span>
                  </span>
                ) : (
                  "Analyze Positioning"
                )}
              </button>
            </div>
          )}

          {profile && (
            <div className="flex flex-col gap-4">
              {/* ─── EXECUTIVE SUMMARY (Most Visible) ─── */}
              <div className="rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-200 p-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-indigo-700">Executive Summary</p>

                {/* Recommended Position */}
                <div className="mb-4">
                  <p className="text-xs text-indigo-600 mb-1">Recommended Position</p>
                  <p className="text-lg font-bold text-indigo-900">{profile.recommendedTitle}</p>
                </div>

                {/* Recruiter Hook */}
                <div className="mb-4">
                  <p className="text-xs text-indigo-600 mb-1">Recruiter Hook</p>
                  <p className="text-sm font-medium text-indigo-900 leading-relaxed">{profile.recruiterHook}</p>
                </div>

                {/* Lead With */}
                <div>
                  <p className="text-xs text-indigo-600 mb-2">Lead With</p>
                  <NumberedList items={profile.leadWith} />
                </div>
              </div>

              {/* ─── RISK & RESPONSE (Actionable) ─── */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Section title="Biggest Risk" color="red">
                  <p className="font-medium text-rose-700">{profile.biggestRisk}</p>
                </Section>

                <Section title="How To Handle It" color="green">
                  <p>{profile.riskResponse}</p>
                </Section>
              </div>

              {/* ─── CORE NARRATIVE ─── */}
              <Section title="Positioning Narrative" color="purple">
                <p>{profile.primaryNarrative}</p>
              </Section>

              {/* ─── SUPPORTING EVIDENCE ─── */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Section title="Key Strengths" color="blue">
                  <BulletList items={profile.strengthsToEmphasize} />
                </Section>

                <Section title="Differentiators" color="cyan">
                  <BulletList items={profile.differentiators} />
                </Section>
              </div>

              {/* ─── APPLICATION STRATEGY ─── */}
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <Section title="CV Strategy" color="neutral">
                  <p>{profile.cvStrategy}</p>
                </Section>

                <Section title="Interview Strategy" color="neutral">
                  <p>{profile.interviewStrategy}</p>
                </Section>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

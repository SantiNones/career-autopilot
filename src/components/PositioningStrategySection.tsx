"use client";

import { useState } from "react";

import type { PositioningProfile } from "@/app/api/jobs/[id]/positioning/analyze/route";

import { PositioningStrategyCard } from "./PositioningStrategyCard";

export function PositioningStrategySection({
  jobId,
  initialProfile,
  initialAnalyzedAt,
}: {
  jobId: string;
  initialProfile: PositioningProfile | null;
  initialAnalyzedAt: string | null;
}) {
  const [profile, setProfile] = useState<PositioningProfile | null>(initialProfile);
  const [analyzedAt, setAnalyzedAt] = useState<string | null>(initialAnalyzedAt);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/positioning/analyze`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        profile?: PositioningProfile;
        analyzedAt?: string;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Analysis failed. Please try again.");
        return;
      }
      if (data.profile) {
        setProfile(data.profile);
        setAnalyzedAt(data.analyzedAt ?? null);
      }
    } catch {
      setError("Analysis failed. Please check your connection and try again.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-700">
          {error}
        </p>
      )}
      <PositioningStrategyCard
        profile={profile}
        analyzedAt={analyzedAt}
        jobId={jobId}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
      />
    </div>
  );
}

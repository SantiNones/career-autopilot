"use client";

import { useState, useEffect } from "react";

interface CandidateIntelligence {
  id: string;
  careerStage: string | null;
  careerDirection: string | null;
  primaryRoleFamilies: any;
  secondaryRoleFamilies: any;
  technicalStack: any;
  technicalStrengths: any;
  transferableStrengths: any;
  domains: any;
  languages: any;
  educationSignals: any;
  projectEvidence: any;
  experienceEvidence: any;
  positioningAssets: any;
  riskAreas: any;
  constraints: any;
  summary: string | null;
  analyzedAt: string | null;
}

export function CandidateIntelligencePanel() {
  const [candidateIntelligence, setCandidateIntelligence] = useState<CandidateIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCandidateIntelligence();
  }, []);

  async function loadCandidateIntelligence() {
    try {
      const res = await fetch("/api/profile/candidate-intelligence/analyze");
      const data = await res.json();
      
      if (data.candidateIntelligence) {
        setCandidateIntelligence(data.candidateIntelligence);
      }
    } catch (err) {
      console.error("Failed to load candidate intelligence:", err);
    }
  }

  async function analyzeCandidateIntelligence() {
    setLoading(true);
    setError(null);
    
    try {
      const res = await fetch("/api/profile/candidate-intelligence/analyze", {
        method: "POST",
      });
      
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setCandidateIntelligence(data.candidateIntelligence);
      }
    } catch (err) {
      setError("Failed to analyze candidate intelligence");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function renderJsonField(data: any, label: string) {
    if (!data || (Array.isArray(data) && data.length === 0)) {
      return null;
    }

    return (
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-medium text-zinc-700">{label}</h4>
        <div className="rounded-md bg-zinc-50 p-3">
          <pre className="text-xs text-zinc-600 whitespace-pre-wrap">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  function renderStringArray(data: string[], label: string) {
    if (!data || data.length === 0) {
      return null;
    }

    return (
      <div className="flex flex-col gap-1">
        <h4 className="text-sm font-medium text-zinc-700">{label}</h4>
        <div className="flex flex-wrap gap-1">
          {data.map((item, index) => (
            <span
              key={index}
              className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-700">Candidate Intelligence</h3>
          <button
            className="rounded-md bg-black px-3 py-1 text-xs text-white disabled:opacity-50"
            onClick={analyzeCandidateIntelligence}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm text-amber-800">{error}</p>
        </div>
      </div>
    );
  }

  if (!candidateIntelligence) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-700">Candidate Intelligence</h3>
          <button
            className="rounded-md bg-black px-3 py-1 text-xs text-white disabled:opacity-50"
            onClick={analyzeCandidateIntelligence}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze Candidate Intelligence"}
          </button>
        </div>
        <div className="rounded-md bg-zinc-50 p-8 text-center">
          <p className="text-sm text-zinc-500">
            No candidate intelligence analysis yet. Click "Analyze" to generate a structured candidate model.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-700">Candidate Intelligence</h3>
        <div className="flex items-center gap-2">
          {candidateIntelligence.analyzedAt && (
            <span className="text-xs text-zinc-500">
              Analyzed: {new Date(candidateIntelligence.analyzedAt).toLocaleDateString()}
            </span>
          )}
          <button
            className="rounded-md bg-black px-3 py-1 text-xs text-white disabled:opacity-50"
            onClick={analyzeCandidateIntelligence}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Re-analyze"}
          </button>
        </div>
      </div>

      {/* Summary */}
      {candidateIntelligence.summary && (
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-medium text-zinc-700">Summary</h4>
          <div className="rounded-md bg-blue-50 border border-blue-200 p-3">
            <p className="text-sm text-blue-800">{candidateIntelligence.summary}</p>
          </div>
        </div>
      )}

      {/* Career Direction */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {candidateIntelligence.careerStage && (
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-medium text-zinc-700">Career Stage</h4>
            <div className="rounded-md bg-zinc-50 p-3">
              <span className="text-sm text-zinc-800 capitalize">
                {candidateIntelligence.careerStage.replace('_', ' ')}
              </span>
            </div>
          </div>
        )}
        
        {candidateIntelligence.careerDirection && (
          <div className="flex flex-col gap-1">
            <h4 className="text-sm font-medium text-zinc-700">Career Direction</h4>
            <div className="rounded-md bg-zinc-50 p-3">
              <p className="text-sm text-zinc-800">{candidateIntelligence.careerDirection}</p>
            </div>
          </div>
        )}
      </div>

      {/* Role Families */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {renderStringArray(
          candidateIntelligence.primaryRoleFamilies as string[],
          "Primary Role Families"
        )}
        {renderStringArray(
          candidateIntelligence.secondaryRoleFamilies as string[],
          "Secondary Role Families"
        )}
      </div>

      {/* Technical Stack */}
      {candidateIntelligence.technicalStack && (
        <div className="flex flex-col gap-1">
          <h4 className="text-sm font-medium text-zinc-700">Technical Stack</h4>
          <div className="rounded-md bg-zinc-50 p-3">
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {Object.entries(candidateIntelligence.technicalStack as any).map(([tech, level]) => (
                <div key={tech} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-800">{tech}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    level === 'proven' ? 'bg-green-100 text-green-800' :
                    level === 'project_exposure' ? 'bg-blue-100 text-blue-800' :
                    level === 'learning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {level as string}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Strengths */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {renderStringArray(
          candidateIntelligence.technicalStrengths as string[],
          "Technical Strengths"
        )}
        {renderStringArray(
          candidateIntelligence.transferableStrengths as string[],
          "Transferable Strengths"
        )}
      </div>

      {/* Positioning Assets */}
      {renderStringArray(
        candidateIntelligence.positioningAssets as string[],
        "Positioning Assets"
      )}

      {/* Risk Areas */}
      {renderStringArray(
        candidateIntelligence.riskAreas as string[],
        "Risk Areas"
      )}

      {/* Constraints */}
      {renderStringArray(
        candidateIntelligence.constraints as string[],
        "Constraints"
      )}

      {/* Evidence */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {renderJsonField(candidateIntelligence.projectEvidence, "Project Evidence")}
        {renderJsonField(candidateIntelligence.experienceEvidence, "Experience Evidence")}
      </div>
    </div>
  );
}

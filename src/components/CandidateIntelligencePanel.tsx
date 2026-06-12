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
  evidenceInventory: any;
  topEvidenceAreas: any;
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
                    level === 'professional_experience' ? 'bg-green-600 text-white' :
                    level === 'proven_project_experience' ? 'bg-green-100 text-green-800' :
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

      {/* Evidence Inventory */}
      {candidateIntelligence.evidenceInventory && Array.isArray(candidateIntelligence.evidenceInventory) && candidateIntelligence.evidenceInventory.length > 0 && (() => {
        const inventory = candidateIntelligence.evidenceInventory as any[];
        const groups: { key: string; label: string }[] = [
          { key: "project", label: "Named Projects" },
          { key: "experience", label: "Professional Experience" },
          { key: "technology", label: "Technical Evidence" },
          { key: "analysis", label: "Other Evidence" },
        ];
        const grouped = groups
          .map(g => ({
            ...g,
            items: inventory.filter((i: any) => (i.source || "analysis") === g.key),
          }))
          .filter(g => g.items.length > 0);

        return (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-zinc-700">Evidence Inventory</h4>
              <span className="text-xs text-zinc-500">
                {inventory.length} evidence items
              </span>
            </div>

            {/* Counts by source */}
            <div className="flex flex-wrap gap-2">
              {grouped.map(g => (
                <span key={g.key} className="rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700">
                  {g.label}: <span className="font-semibold">{g.items.length}</span>
                </span>
              ))}
            </div>

            {/* Top Evidence Areas */}
            {candidateIntelligence.topEvidenceAreas && Array.isArray(candidateIntelligence.topEvidenceAreas) && candidateIntelligence.topEvidenceAreas.length > 0 && (
              <div className="flex flex-col gap-1">
                <h5 className="text-xs font-medium text-zinc-600">Top Evidence Areas</h5>
                <div className="flex flex-wrap gap-1">
                  {candidateIntelligence.topEvidenceAreas.map((area: string, index: number) => (
                    <span
                      key={index}
                      className="rounded-md bg-purple-100 px-2 py-1 text-xs text-purple-800 font-medium"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence Items grouped by source */}
            {grouped.map(g => (
              <div key={g.key} className="flex flex-col gap-2">
                <h5 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{g.label}</h5>
                <div className="space-y-2">
                  {g.items.map((item: any, index: number) => (
                    <div key={index} className="rounded-md border border-zinc-200 bg-white p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="text-sm font-medium text-zinc-900">{item.claim}</h5>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          item.evidenceStrength === 'strong' ? 'bg-green-100 text-green-800' :
                          item.evidenceStrength === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {item.evidenceStrength}
                        </span>
                        {item.category && (
                          <span className="text-xs text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded">
                            {item.category}
                          </span>
                        )}
                      </div>

                      {item.evidence && Array.isArray(item.evidence) && item.evidence.length > 0 && (
                        <ul className="text-xs text-zinc-600 space-y-0.5 mb-1">
                          {item.evidence.slice(0, 3).map((evidence: string, evidenceIndex: number) => (
                            <li key={evidenceIndex} className="flex items-start gap-1">
                              <span className="mt-1.5 w-1 h-1 shrink-0 bg-zinc-400 rounded-full"></span>
                              {evidence}
                            </li>
                          ))}
                        </ul>
                      )}

                      {item.technologies && Array.isArray(item.technologies) && item.technologies.length > 0 && g.key === "project" && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {item.technologies.map((tech: string, i: number) => (
                            <span key={i} className="rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700">
                              {tech}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.capabilities && Array.isArray(item.capabilities) && item.capabilities.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.capabilities.map((cap: string, i: number) => (
                            <span key={i} className="rounded bg-purple-50 px-1.5 py-0.5 text-xs text-purple-700">
                              {cap}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}

import { JobPosting, CandidateIntelligence } from "@prisma/client";
import { extractRequirements, JobRequirement } from "./fitAnalysisV3";
import {
  mapEvidenceInventory,
  matchRequirementToEvidence,
  CapabilityMatch,
} from "../capability/capabilityMatcher";

// ---------------------------------------------------------------------------
// Fit Analysis V4 — production
// - Capability-based tiered evidence matching (exact > capability > adjacent)
// - Model D normalized weighted-coverage scoring (validated in calibration)
// - Seniority / infrastructure / hard-blocker gates
// ---------------------------------------------------------------------------

export type FitVerdict = "APPLY" | "APPLY_STRETCH" | "MAYBE" | "SKIP";

export interface EvidenceMatchV4 {
  requirement: string;
  importance: "critical" | "important" | "nice_to_have";
  evidence: string[];
  evidenceStrength: "strong" | "medium" | "weak" | "none";
  tier: "exact" | "capability" | "adjacent" | "none";
  capabilities: string[];
  gap: string;
}

export interface FitAnalysisV4Result {
  requirements: JobRequirement[];
  evidenceMatches: EvidenceMatchV4[];
  gapAnalysis: {
    strongEvidence: string[];
    partialEvidence: string[];
    missingEvidence: string[];
  };
  score: number;
  verdict: FitVerdict;
  gates: string[];
  scoreBreakdown: {
    earned: number;
    total: number;
    rawCoverageScore: number;
    criticalGapCap: boolean;
    seniorityGateCap: boolean;
  };
}

// --- Gates (validated as Model D in calibration simulation) -----------------

const SENIORITY_TITLE = /(senior|staff|principal|lead|head of|director|vp |vice president|chief|manager|sre|site reliability|production engineer|infrastructure engineer|platform infrastructure|security operations|devops lead)/i;
const INFRA_DESCRIPTION = /(site reliability|fleet management|on-call|incident response|slo|sla ownership|security clearance|research scientist|phd required)/i;
const HIGH_YEARS = /([5-9]|1[0-9])\+?\s*years/i;

function seniorityGateTriggers(title: string, description: string): string[] {
  const gates: string[] = [];
  const titleMatch = title.match(SENIORITY_TITLE);
  if (titleMatch) gates.push(`Title signals seniority/infrastructure: "${titleMatch[0]}"`);
  const infraMatch = description.toLowerCase().match(INFRA_DESCRIPTION);
  if (infraMatch) gates.push(`Description requires: "${infraMatch[0]}"`);
  const yearsMatch = description.match(HIGH_YEARS);
  if (yearsMatch) gates.push(`High experience bar: "${yearsMatch[0]}"`);
  return gates;
}

const JUNIOR_SIGNALS = /(junior|graduate|entry[- ]level|trainee|intern|early career)/i;
const HARD_BLOCKER = /(degree|bachelor|master|phd|([3-9]|1[0-9])\+?\s*years|certification|clearance|citizenship|on[- ]?site|relocat|language)/i;

// --- Main --------------------------------------------------------------------

export async function analyzeFitV4(
  jobPosting: JobPosting,
  candidateIntelligence: CandidateIntelligence
): Promise<FitAnalysisV4Result> {
  console.log("[fit-analysis-v4] Starting for:", jobPosting.title);

  const ci = candidateIntelligence as any;
  const evidenceInventory = ci.evidenceInventory || [];
  const evidenceItems = mapEvidenceInventory(evidenceInventory);

  const rawRequirements = await extractRequirements(jobPosting);
  // Drop non-requirements the LLM sometimes emits ("X is not mentioned",
  // "No specific Y expectations") — they are absence statements, not asks
  const NON_REQUIREMENT = /not (explicitly )?(mentioned|specified|required)|no specific|not specified|none (required|mentioned)/i;
  const requirements = rawRequirements.filter(r => !NON_REQUIREMENT.test(r.requirement));
  if (requirements.length === 0) {
    throw new Error("Requirement extraction returned 0 requirements.");
  }

  // Capability-based tiered matching
  const evidenceMatches: EvidenceMatchV4[] = requirements.map(req => {
    const match: CapabilityMatch = matchRequirementToEvidence(req.requirement, evidenceItems);
    return {
      requirement: req.requirement,
      importance: req.importance,
      evidence: match.matchedEvidence,
      evidenceStrength: match.matchStrength,
      tier: match.tier,
      capabilities: match.sharedCapabilities,
      gap:
        match.matchStrength === "none" ? `No evidence found for ${req.requirement}` :
        match.matchStrength === "weak" ? "Adjacent evidence only" :
        match.matchStrength === "medium" ? "Capability-level evidence" : "",
    };
  });

  // --- Model D normalized scoring ---
  const importanceWeight = { critical: 3, important: 2, nice_to_have: 1 } as const;
  const strengthCredit = { strong: 1.0, medium: 0.75, weak: 0.4, none: 0 } as const;
  const junior = JUNIOR_SIGNALS.test(jobPosting.title || "") || JUNIOR_SIGNALS.test(jobPosting.rawText || "");

  let earned = 0;
  let total = 0;
  let cappingCriticalGaps = 0;

  for (const match of evidenceMatches) {
    const weight = importanceWeight[match.importance] || 2;
    const credit = strengthCredit[match.evidenceStrength];
    const missing = match.evidenceStrength === "none";

    // Missing nice-to-haves never reduce the score
    if (match.importance === "nice_to_have" && missing) continue;

    earned += weight * credit;
    total += weight;

    if (missing && match.importance === "critical") {
      // Junior roles: only hard blockers cap the score
      if (!junior || HARD_BLOCKER.test(match.requirement)) {
        cappingCriticalGaps++;
      }
    }
  }

  const rawCoverageScore = total > 0 ? Math.round((earned / total) * 100) : 0;
  let score = rawCoverageScore;

  const criticalGapCap = cappingCriticalGaps > 0;
  if (criticalGapCap) {
    score = Math.min(score, 45);
  }

  const gates = seniorityGateTriggers(jobPosting.title || "", jobPosting.rawText || "");
  const seniorityGateCap = gates.length > 0;
  if (seniorityGateCap) {
    score = Math.min(score, 35);
  }

  score = Math.max(0, Math.min(100, score));

  const verdict: FitVerdict =
    score >= 65 ? "APPLY" :
    score >= 55 ? "APPLY_STRETCH" :
    score >= 40 ? "MAYBE" : "SKIP";

  const gapAnalysis = {
    strongEvidence: evidenceMatches.filter(m => m.evidenceStrength === "strong").map(m => m.requirement),
    partialEvidence: evidenceMatches.filter(m => m.evidenceStrength === "medium").map(m => m.requirement),
    missingEvidence: evidenceMatches.filter(m => m.evidenceStrength === "none").map(m => m.requirement),
  };

  console.log(`[fit-analysis-v4] score=${score} verdict=${verdict} raw=${rawCoverageScore} criticalGapCap=${criticalGapCap} seniorityGateCap=${seniorityGateCap}`);
  console.log(`[fit-analysis-v4] strong=${gapAnalysis.strongEvidence.length} partial=${gapAnalysis.partialEvidence.length} missing=${gapAnalysis.missingEvidence.length}`);

  return {
    requirements,
    evidenceMatches,
    gapAnalysis,
    score,
    verdict,
    gates,
    scoreBreakdown: {
      earned: Math.round(earned * 100) / 100,
      total,
      rawCoverageScore,
      criticalGapCap,
      seniorityGateCap,
    },
  };
}

import { prisma } from "@/lib/db";
import { analyzeFitV3 } from "@/server/fitAnalysis/fitAnalysisV3";
import { analyzeFitV4, FitVerdict } from "@/server/fitAnalysis/fitAnalysisV4";
import { mapEvidenceInventory, matchRequirementToEvidence, CapabilityMatch } from "@/server/capability/capabilityMatcher";
import { realBenchmarkJobs, ValidationJobV2 } from "./validationDatasetV2";

// ---------------------------------------------------------------------------
// Capability Benchmark (Phase 1)
// Compares current V3 keyword matching vs capability-based matching on
// real benchmark jobs. Read-only: no production scoring changes.
// ---------------------------------------------------------------------------

const zurichJob: ValidationJobV2 = {
  title: "Junior AI Engineer",
  company: "Zurich Insurance",
  description: "Junior AI engineer in our digital transformation team. Build AI-powered features with Python and OpenAI APIs, integrate LLM workflows into insurance processes, and collaborate with business stakeholders. SQL and data analysis skills valued. Junior level, strong learning mindset required. English essential.",
  expectedVerdict: "APPLY",
  expectedScoreRange: [65, 80],
  category: "AI/ML",
  isRealBenchmark: true,
};

const BENCHMARK_COMPANIES = ["Deloitte", "Corus", "Linear", "Mistral", "Maisa"];

interface JobBenchmark {
  title: string;
  company: string;
  requirementsExtracted: number;
  requirementCapabilities: number;
  unmappedRequirements: string[];
  evidenceCapabilities: number;
  v3: { strong: number; medium: number; weak: number; none: number; coverage: number };
  cap: { strong: number; medium: number; weak: number; none: number; coverage: number };
  capMatches: CapabilityMatch[];
  v4Score: number;
  v4Verdict: FitVerdict;
  v4Gates: string[];
  expectedVerdict: string;
  expectedScoreRange: [number, number];
  scoreInRange: boolean;
}

export async function runCapabilityBenchmark(): Promise<{ report: string; results: JobBenchmark[] }> {
  const candidateIntelligence = await prisma.candidateIntelligence.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (!candidateIntelligence) throw new Error("Candidate Intelligence missing.");

  const ci = candidateIntelligence as any;
  const evidenceInventory = ci.evidenceInventory || [];
  const evidenceItems = mapEvidenceInventory(evidenceInventory);
  const totalEvidenceCaps = new Set(evidenceItems.flatMap(e => e.mapping.capabilities.map(c => c.capabilityId)));

  const jobs: ValidationJobV2[] = [
    ...realBenchmarkJobs.filter(j => BENCHMARK_COMPANIES.some(c => j.company.includes(c))),
    zurichJob,
  ];

  const results: JobBenchmark[] = [];

  for (const job of jobs) {
    const mockJobPosting = {
      id: `cap-bench-${job.company.toLowerCase()}-${job.title.replace(/\s+/g, "-").toLowerCase()}`,
      title: job.title,
      companyName: job.company,
      rawText: job.description,
    };

    const analysis = await analyzeFitV3(mockJobPosting as any, candidateIntelligence);
    const v4 = await analyzeFitV4(mockJobPosting as any, candidateIntelligence);

    // Current V3 matching results
    const v3Counts = { strong: 0, medium: 0, weak: 0, none: 0 };
    analysis.evidenceMatches.forEach(m => { v3Counts[m.evidenceStrength]++; });
    const total = analysis.requirements.length;
    const v3Covered = total - v3Counts.none;

    // Capability-based matching on the same requirements
    const capMatches = analysis.requirements.map(r =>
      matchRequirementToEvidence(r.requirement, evidenceItems)
    );
    const capCounts = { strong: 0, medium: 0, weak: 0, none: 0 };
    capMatches.forEach(m => { capCounts[m.matchStrength]++; });
    const capCovered = total - capCounts.none;

    const reqCapsCount = capMatches.reduce((acc, m) => acc + m.requirementCapabilities.length, 0);
    const unmapped = capMatches.filter(m => m.requirementUnmapped).map(m => m.requirement);

    results.push({
      title: job.title,
      company: job.company,
      requirementsExtracted: total,
      requirementCapabilities: reqCapsCount,
      unmappedRequirements: unmapped,
      evidenceCapabilities: totalEvidenceCaps.size,
      v3: { ...v3Counts, coverage: total ? Math.round((v3Covered / total) * 100) : 0 },
      cap: { ...capCounts, coverage: total ? Math.round((capCovered / total) * 100) : 0 },
      capMatches,
      v4Score: v4.score,
      v4Verdict: v4.verdict,
      v4Gates: v4.gates,
      expectedVerdict: job.expectedVerdict,
      expectedScoreRange: job.expectedScoreRange as [number, number],
      scoreInRange: v4.score >= job.expectedScoreRange[0] && v4.score <= job.expectedScoreRange[1],
    });
  }

  return { report: buildReport(results, totalEvidenceCaps.size, evidenceInventory.length), results };
}

function buildReport(results: JobBenchmark[], evidenceCapCount: number, evidenceItemCount: number): string {
  const totalReqs = results.reduce((a, r) => a + r.requirementsExtracted, 0);
  const v3CoveredTotal = results.reduce((a, r) => a + (r.requirementsExtracted - r.v3.none), 0);
  const capCoveredTotal = results.reduce((a, r) => a + (r.requirementsExtracted - r.cap.none), 0);
  const totalUnmapped = results.reduce((a, r) => a + r.unmappedRequirements.length, 0);

  return `# Capability Mapping Layer — Benchmark Report (Phase 1, deterministic only)

## Setup
- Evidence inventory items: ${evidenceItemCount}
- Distinct evidence capabilities generated: ${evidenceCapCount}
- Benchmark jobs: ${results.length}
- Total requirements: ${totalReqs}
- Unmapped requirements (no capability found): ${totalUnmapped} (${((totalUnmapped / totalReqs) * 100).toFixed(0)}%)
- Deterministic mapping coverage: ${(100 - (totalUnmapped / totalReqs) * 100).toFixed(0)}%

## Production V4 Scores vs Expected

| Job | V4 Score | V4 Verdict | Expected Verdict | Expected Range | In Range | Gates |
|---|---|---|---|---|---|---|
${results.map(r =>
  `| ${r.title} (${r.company}) | ${r.v4Score} | ${r.v4Verdict} | ${r.expectedVerdict} | ${r.expectedScoreRange[0]}-${r.expectedScoreRange[1]} | ${r.scoreInRange ? "YES" : "no"} | ${r.v4Gates.length ? r.v4Gates.join("; ") : "-"} |`
).join("\n")}

- Verdict accuracy: ${results.filter(r => r.v4Verdict === r.expectedVerdict).length}/${results.length}
- Score in expected range: ${results.filter(r => r.scoreInRange).length}/${results.length}

## Overall Coverage: V3 vs Capability Matching

| Metric | Current V3 | Capability-based |
|---|---|---|
| Requirements covered | ${v3CoveredTotal}/${totalReqs} (${((v3CoveredTotal / totalReqs) * 100).toFixed(0)}%) | ${capCoveredTotal}/${totalReqs} (${((capCoveredTotal / totalReqs) * 100).toFixed(0)}%) |
| Strong matches | ${results.reduce((a, r) => a + r.v3.strong, 0)} | ${results.reduce((a, r) => a + r.cap.strong, 0)} |
| Partial (medium) | ${results.reduce((a, r) => a + r.v3.medium, 0)} | ${results.reduce((a, r) => a + r.cap.medium, 0)} |
| Weak | ${results.reduce((a, r) => a + r.v3.weak, 0)} | ${results.reduce((a, r) => a + r.cap.weak, 0)} |
| Missing | ${results.reduce((a, r) => a + r.v3.none, 0)} | ${results.reduce((a, r) => a + r.cap.none, 0)} |

## Per-Job Comparison

| Job | Reqs | V3 Coverage | Cap Coverage | V3 s/m/w/n | Cap s/m/w/n | Unmapped Reqs |
|---|---|---|---|---|---|---|
${results.map(r =>
  `| ${r.title} (${r.company}) | ${r.requirementsExtracted} | ${r.v3.coverage}% | ${r.cap.coverage}% | ${r.v3.strong}/${r.v3.medium}/${r.v3.weak}/${r.v3.none} | ${r.cap.strong}/${r.cap.medium}/${r.cap.weak}/${r.cap.none} | ${r.unmappedRequirements.length ? r.unmappedRequirements.join("; ") : "-"} |`
).join("\n")}

## Capability Match Detail (per job)

${results.map(r => `### ${r.title} (${r.company})

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
${r.capMatches.map(m =>
  `| ${m.requirement} | ${m.tier} | ${m.matchStrength} | ${m.sharedCapabilities.join(", ") || "-"} | ${m.matchedEvidence.slice(0, 3).join("; ") || "-"} |`
).join("\n")}`).join("\n\n")}
`;
}

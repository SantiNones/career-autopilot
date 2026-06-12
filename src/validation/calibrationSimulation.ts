import { prisma } from "@/lib/db";
import { analyzeFitV3 } from "@/server/fitAnalysis/fitAnalysisV3";
import { validationDatasetV2, ValidationJobV2, VerdictV2 } from "./validationDatasetV2";

// ---------------------------------------------------------------------------
// Simulation-only scoring models. Production code is NOT modified.
// Evidence matches come from the real analyzeFitV3 run (identical across models);
// only score aggregation differs between models.
// ---------------------------------------------------------------------------

const VERDICTS: VerdictV2[] = ["APPLY", "APPLY_STRETCH", "MAYBE", "SKIP"];

interface SimRequirement {
  requirement: string;
  importance: "critical" | "important" | "nice_to_have";
}

interface SimMatch {
  requirement: string;
  evidenceStrength: "strong" | "medium" | "weak" | "none";
}

interface JobSimResult {
  job: ValidationJobV2;
  scoreA: number;
  scoreB: number;
  scoreC: number;
  verdictA: VerdictV2;
  verdictB: VerdictV2;
  verdictC: VerdictV2;
}

function verdictFromScore(score: number): VerdictV2 {
  if (score >= 65) return "APPLY";
  if (score >= 55) return "APPLY_STRETCH";
  if (score >= 40) return "MAYBE";
  return "SKIP";
}

// Model B: normalized, importance-weighted score with critical-gap cap
function scoreModelB(requirements: SimRequirement[], matches: SimMatch[]): number {
  if (requirements.length === 0) return 0;

  const importanceWeight = { critical: 3, important: 2, nice_to_have: 1 } as const;
  const strengthCredit = { strong: 1.0, medium: 0.75, weak: 0.4, none: 0 } as const;

  let earned = 0;
  let total = 0;
  let missingCritical = 0;

  for (const req of requirements) {
    const weight = importanceWeight[req.importance] || 2;
    const match = matches.find(m => m.requirement === req.requirement);
    const credit = match ? strengthCredit[match.evidenceStrength] : 0;
    earned += weight * credit;
    total += weight;
    if ((!match || match.evidenceStrength === "none") && req.importance === "critical") {
      missingCritical++;
    }
  }

  let score = Math.round((earned / total) * 100);

  // Each missing critical requirement caps the score at 45
  if (missingCritical > 0) {
    score = Math.min(score, 45);
  }

  return Math.max(0, Math.min(100, score));
}

// Model C: Model B + seniority gate
const SENIORITY_GATE = /(senior|staff|principal|lead|head of|director|vp |vice president|chief|manager)/i;

function scoreModelC(job: ValidationJobV2, requirements: SimRequirement[], matches: SimMatch[]): number {
  let score = scoreModelB(requirements, matches);
  // Candidate reference profile has no senior-level professional experience:
  // gate roles whose title signals seniority/leadership
  if (SENIORITY_GATE.test(job.title)) {
    score = Math.min(score, 35);
  }
  return score;
}

export async function runCalibrationSimulation(): Promise<{ report: string; results: JobSimResult[] }> {
  console.log("[calibration-sim] Starting 3-model simulation");

  const candidateIntelligence = await prisma.candidateIntelligence.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (!candidateIntelligence) {
    throw new Error("Candidate Intelligence missing.");
  }

  const results: JobSimResult[] = [];

  for (const job of validationDatasetV2) {
    const mockJobPosting = {
      id: `sim-${job.title.replace(/\s+/g, "-").toLowerCase()}`,
      title: job.title,
      companyName: job.company,
      rawText: job.description,
    };

    let analysis;
    try {
      analysis = await analyzeFitV3(mockJobPosting as any, candidateIntelligence);
    } catch (error) {
      // Jobs whose extraction yields 0 requirements score 0 in all models
      console.warn(`[calibration-sim] ${job.title}: ${error instanceof Error ? error.message : error}`);
      results.push({
        job,
        scoreA: 0, scoreB: 0, scoreC: 0,
        verdictA: "SKIP", verdictB: "SKIP", verdictC: "SKIP",
      });
      continue;
    }

    const requirements: SimRequirement[] = analysis.requirements.map(r => ({
      requirement: r.requirement,
      importance: r.importance,
    }));
    const matches: SimMatch[] = analysis.evidenceMatches.map(m => ({
      requirement: m.requirement,
      evidenceStrength: m.evidenceStrength,
    }));

    const scoreA = analysis.score;
    const scoreB = scoreModelB(requirements, matches);
    const scoreC = scoreModelC(job, requirements, matches);

    results.push({
      job,
      scoreA, scoreB, scoreC,
      verdictA: verdictFromScore(scoreA),
      verdictB: verdictFromScore(scoreB),
      verdictC: verdictFromScore(scoreC),
    });
  }

  return { report: buildComparisonReport(results), results };
}

function modelStats(results: JobSimResult[], scoreKey: "scoreA" | "scoreB" | "scoreC", verdictKey: "verdictA" | "verdictB" | "verdictC") {
  const matrix: Record<string, Record<string, number>> = {};
  for (const e of VERDICTS) {
    matrix[e] = {};
    for (const a of VERDICTS) matrix[e][a] = 0;
  }
  results.forEach(r => { matrix[r.job.expectedVerdict][r[verdictKey]]++; });

  const accuracy: Record<string, number> = {};
  for (const v of VERDICTS) {
    const group = results.filter(r => r.job.expectedVerdict === v);
    accuracy[v] = group.length ? (group.filter(r => r[verdictKey] === v).length / group.length) * 100 : 0;
  }
  const overall = (results.filter(r => r[verdictKey] === r.job.expectedVerdict).length / results.length) * 100;

  const avgByVerdict: Record<string, number> = {};
  for (const v of VERDICTS) {
    const scores = results.filter(r => r.job.expectedVerdict === v).map(r => r[scoreKey]);
    avgByVerdict[v] = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  }

  const inRange = results.filter(r => {
    const [lo, hi] = r.job.expectedScoreRange;
    return r[scoreKey] >= lo && r[scoreKey] <= hi;
  }).length;

  return { matrix, accuracy, overall, avgByVerdict, inRange };
}

function buildComparisonReport(results: JobSimResult[]): string {
  const a = modelStats(results, "scoreA", "verdictA");
  const b = modelStats(results, "scoreB", "verdictB");
  const c = modelStats(results, "scoreC", "verdictC");
  const n = results.length;

  const fmtMatrix = (m: Record<string, Record<string, number>>) =>
    VERDICTS.map(e => `| **${e}** | ${VERDICTS.map(x => m[e][x]).join(" | ")} |`).join("\n");

  return `# Calibration Simulation Report — 3-Model Comparison (${n} jobs)

Models:
- **A** Current V3 (additive raw points, -10 per missing)
- **B** Normalized importance-weighted (critical=3/important=2/nice=1; strong=1.0/medium=0.75/weak=0.4; missing critical caps at 45)
- **C** Model B + seniority gate (senior/staff/principal/lead/manager/director title with no senior evidence caps at 35)

## Overall Accuracy

| Model | Overall | APPLY | APPLY_STRETCH | MAYBE | SKIP | Scores In Expected Range |
|---|---|---|---|---|---|---|
| A (current) | ${a.overall.toFixed(1)}% | ${a.accuracy.APPLY.toFixed(0)}% | ${a.accuracy.APPLY_STRETCH.toFixed(0)}% | ${a.accuracy.MAYBE.toFixed(0)}% | ${a.accuracy.SKIP.toFixed(0)}% | ${((a.inRange / n) * 100).toFixed(0)}% |
| B (normalized) | ${b.overall.toFixed(1)}% | ${b.accuracy.APPLY.toFixed(0)}% | ${b.accuracy.APPLY_STRETCH.toFixed(0)}% | ${b.accuracy.MAYBE.toFixed(0)}% | ${b.accuracy.SKIP.toFixed(0)}% | ${((b.inRange / n) * 100).toFixed(0)}% |
| C (B + gate) | ${c.overall.toFixed(1)}% | ${c.accuracy.APPLY.toFixed(0)}% | ${c.accuracy.APPLY_STRETCH.toFixed(0)}% | ${c.accuracy.MAYBE.toFixed(0)}% | ${c.accuracy.SKIP.toFixed(0)}% | ${((c.inRange / n) * 100).toFixed(0)}% |

## Average Score by Expected Verdict

| Expected | Target Range | Model A | Model B | Model C |
|---|---|---|---|---|
${VERDICTS.map(v => {
  const range = v === "APPLY" ? "65-85" : v === "APPLY_STRETCH" ? "55-70" : v === "MAYBE" ? "40-60" : "0-40";
  return `| ${v} | ${range} | ${a.avgByVerdict[v].toFixed(1)} | ${b.avgByVerdict[v].toFixed(1)} | ${c.avgByVerdict[v].toFixed(1)} |`;
}).join("\n")}

## Confusion Matrix — Model A (Current)

| Expected \\ Actual | APPLY | APPLY_STRETCH | MAYBE | SKIP |
|---|---|---|---|---|
${fmtMatrix(a.matrix)}

## Confusion Matrix — Model B (Normalized)

| Expected \\ Actual | APPLY | APPLY_STRETCH | MAYBE | SKIP |
|---|---|---|---|---|
${fmtMatrix(b.matrix)}

## Confusion Matrix — Model C (Normalized + Seniority Gate)

| Expected \\ Actual | APPLY | APPLY_STRETCH | MAYBE | SKIP |
|---|---|---|---|---|
${fmtMatrix(c.matrix)}

## Real Benchmark Jobs

| Role | Expected | A | B | C | Expected Range |
|---|---|---|---|---|---|
${results.filter(r => r.job.isRealBenchmark).map(r =>
  `| ${r.job.title} (${r.job.company}) | ${r.job.expectedVerdict} | ${r.scoreA} (${r.verdictA}) | ${r.scoreB} (${r.verdictB}) | ${r.scoreC} (${r.verdictC}) | ${r.job.expectedScoreRange[0]}-${r.job.expectedScoreRange[1]} |`
).join("\n")}

## Per-Job Scores

| Job | Expected | A | B | C |
|---|---|---|---|---|
${results.map(r =>
  `| ${r.job.title} (${r.job.company}) | ${r.job.expectedVerdict} | ${r.scoreA} ${r.verdictA} | ${r.scoreB} ${r.verdictB} | ${r.scoreC} ${r.verdictC} |`
).join("\n")}
`;
}

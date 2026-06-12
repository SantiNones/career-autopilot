import { prisma } from "@/lib/db";
import { analyzeFitV3 } from "@/server/fitAnalysis/fitAnalysisV3";
import { validationDatasetV2, ValidationJobV2, VerdictV2 } from "./validationDatasetV2";

export interface ValidationResultV2 {
  job: ValidationJobV2;
  score: number;
  actualVerdict: VerdictV2;
  inExpectedRange: boolean;
  strongestEvidence: string;
  biggestGap: string;
  explanation: string;
  strongCount: number;
  mediumCount: number;
  weakCount: number;
  noneCount: number;
}

const VERDICTS: VerdictV2[] = ["APPLY", "APPLY_STRETCH", "MAYBE", "SKIP"];

// Verdict thresholds aligned with dataset V2 expected score ranges
export function scoreToVerdictV2(score: number): VerdictV2 {
  if (score >= 65) return "APPLY";
  if (score >= 55) return "APPLY_STRETCH";
  if (score >= 40) return "MAYBE";
  return "SKIP";
}

export async function runValidationV2(): Promise<{
  results: ValidationResultV2[];
  report: string;
}> {
  console.log("[validation-v2] Starting calibration validation run");

  const candidateIntelligence = await prisma.candidateIntelligence.findFirst({
    orderBy: { createdAt: "desc" },
  });
  if (!candidateIntelligence) {
    throw new Error("Candidate Intelligence missing. Run Candidate Intelligence first.");
  }
  const ci = candidateIntelligence as any;
  if (!ci.evidenceInventory || ci.evidenceInventory.length === 0) {
    throw new Error("Evidence Inventory is empty. Run Candidate Intelligence first.");
  }

  const results: ValidationResultV2[] = [];

  for (const job of validationDatasetV2) {
    try {
      const mockJobPosting = {
        id: `validation-v2-${job.title.replace(/\s+/g, "-").toLowerCase()}`,
        title: job.title,
        companyName: job.company,
        rawText: job.description,
      };

      const analysis = await analyzeFitV3(mockJobPosting as any, candidateIntelligence);

      const strongCount = analysis.evidenceMatches.filter(m => m.evidenceStrength === "strong").length;
      const mediumCount = analysis.evidenceMatches.filter(m => m.evidenceStrength === "medium").length;
      const weakCount = analysis.evidenceMatches.filter(m => m.evidenceStrength === "weak").length;
      const noneCount = analysis.evidenceMatches.filter(m => m.evidenceStrength === "none").length;

      const actualVerdict = scoreToVerdictV2(analysis.score);
      const [minE, maxE] = job.expectedScoreRange;

      results.push({
        job,
        score: analysis.score,
        actualVerdict,
        inExpectedRange: analysis.score >= minE && analysis.score <= maxE,
        strongestEvidence: analysis.gapAnalysis.strongEvidence[0]
          || analysis.gapAnalysis.partialEvidence[0]
          || "none",
        biggestGap: analysis.gapAnalysis.missingEvidence[0] || "none",
        explanation: `${strongCount} strong (+${strongCount * 10}), ${mediumCount} medium (+${mediumCount * 5}), ${weakCount} weak (+${weakCount * 2}), ${noneCount} missing (-${noneCount * 10}) -> raw ${strongCount * 10 + mediumCount * 5 + weakCount * 2 - noneCount * 10}, clamped ${analysis.score}`,
        strongCount,
        mediumCount,
        weakCount,
        noneCount,
      });
    } catch (error) {
      console.error(`[validation-v2] Error on ${job.title}:`, error);
      results.push({
        job,
        score: 0,
        actualVerdict: "SKIP",
        inExpectedRange: false,
        strongestEvidence: "ERROR",
        biggestGap: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
        explanation: "Analysis failed",
        strongCount: 0, mediumCount: 0, weakCount: 0, noneCount: 0,
      });
    }
  }

  const report = generateReportV2(results);
  return { results, report };
}

function generateReportV2(results: ValidationResultV2[]): string {
  // Confusion matrix
  const matrix: Record<string, Record<string, number>> = {};
  for (const e of VERDICTS) {
    matrix[e] = {};
    for (const a of VERDICTS) matrix[e][a] = 0;
  }
  results.forEach(r => {
    matrix[r.job.expectedVerdict][r.actualVerdict]++;
  });

  // Accuracy per verdict
  const accuracy: Record<string, string> = {};
  for (const v of VERDICTS) {
    const group = results.filter(r => r.job.expectedVerdict === v);
    const correct = group.filter(r => r.actualVerdict === v).length;
    accuracy[v] = group.length ? `${((correct / group.length) * 100).toFixed(1)}% (${correct}/${group.length})` : "n/a";
  }
  const overallCorrect = results.filter(r => r.actualVerdict === r.job.expectedVerdict).length;

  // Score distribution
  const avg = (nums: number[]) => nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : "n/a";
  const dist: Record<string, string> = {};
  for (const v of VERDICTS) {
    const scores = results.filter(r => r.job.expectedVerdict === v).map(r => r.score);
    dist[v] = `avg ${avg(scores)} | min ${Math.min(...scores)} | max ${Math.max(...scores)} (expected ${v === "APPLY" ? "65-85" : v === "APPLY_STRETCH" ? "55-70" : v === "MAYBE" ? "40-60" : "0-40"})`;
  }

  const inRange = results.filter(r => r.inExpectedRange).length;

  let md = `# Fit Analysis V3 Calibration Report (Dataset V2)

## Dataset
- Total jobs: ${results.length} (incl. ${results.filter(r => r.job.isRealBenchmark).length} real benchmarks)
- Verdict accuracy overall: ${((overallCorrect / results.length) * 100).toFixed(1)}% (${overallCorrect}/${results.length})
- Scores within expected range: ${((inRange / results.length) * 100).toFixed(1)}% (${inRange}/${results.length})

## Accuracy by Verdict
${VERDICTS.map(v => `- **${v}**: ${accuracy[v]}`).join("\n")}

## Score Distribution (by expected verdict)
${VERDICTS.map(v => `- **${v}**: ${dist[v]}`).join("\n")}

## Confusion Matrix (Expected \\ Actual)

| Expected \\ Actual | APPLY | APPLY_STRETCH | MAYBE | SKIP |
|---|---|---|---|---|
${VERDICTS.map(e => `| **${e}** | ${VERDICTS.map(a => matrix[e][a]).join(" | ")} |`).join("\n")}

## Real Benchmark Jobs

| Role | Company | Expected | Actual | Score | Expected Range | In Range |
|---|---|---|---|---|---|---|
${results.filter(r => r.job.isRealBenchmark).map(r =>
  `| ${r.job.title} | ${r.job.company} | ${r.job.expectedVerdict} | ${r.actualVerdict} | ${r.score} | ${r.job.expectedScoreRange[0]}-${r.job.expectedScoreRange[1]} | ${r.inExpectedRange ? "YES" : "NO"} |`
).join("\n")}

## Per-Job Results

| Job | Expected | Actual | Score | Strongest Evidence | Biggest Gap |
|---|---|---|---|---|---|
${results.map(r =>
  `| ${r.job.title} (${r.job.company}) | ${r.job.expectedVerdict} | ${r.actualVerdict} | ${r.score} | ${r.strongestEvidence} | ${r.biggestGap} |`
).join("\n")}

## Score Explanations

${results.map(r => `- **${r.job.title}**: ${r.explanation}`).join("\n")}
`;

  return md;
}

import { prisma } from "@/lib/db";
import { analyzeFitV3 } from "@/server/fitAnalysis/fitAnalysisV3";
import { validationDataset, ValidationJob } from "./validationDataset";

export interface ValidationResult {
  job: ValidationJob;
  actualVerdict: "APPLY" | "MAYBE" | "SKIP";
  score: number;
  evidenceSummary: {
    strongEvidence: string[];
    partialEvidence: string[];
    missingEvidence: string[];
  };
  gaps: string[];
  v3Score: number;
  evidenceMatches: any[];
}

export interface ValidationMetrics {
  overallAccuracy: number;
  applyAccuracy: number;
  maybeAccuracy: number;
  skipAccuracy: number;
  confusionMatrix: {
    apply: { apply: number; maybe: number; skip: number };
    maybe: { apply: number; maybe: number; skip: number };
    skip: { apply: number; maybe: number; skip: number };
  };
  totalJobs: number;
}

export interface ErrorAnalysis {
  falsePositives: ValidationResult[];
  falseNegatives: ValidationResult[];
  biggestFailurePatterns: string[];
}

export async function runValidation(): Promise<{
  results: ValidationResult[];
  metrics: ValidationMetrics;
  errorAnalysis: ErrorAnalysis;
}> {
  console.log("[validation] Starting Fit Analysis V3 validation");
  
  // Get candidate intelligence
  const candidateIntelligence = await prisma.candidateIntelligence.findFirst({
    orderBy: { createdAt: "desc" }
  });
  
  if (!candidateIntelligence) {
    throw new Error("No candidate intelligence found for validation");
  }
  
  const results: ValidationResult[] = [];
  
  // Run analysis for each job in dataset
  for (const job of validationDataset) {
    console.log(`[validation] Analyzing: ${job.title}`);
    
    try {
      // Create mock job posting
      const mockJobPosting = {
        id: `validation-${job.title.replace(/\s+/g, '-').toLowerCase()}`,
        title: job.title,
        companyName: job.company,
        rawText: job.description,
        description: job.description,
        createdAt: new Date(),
        updatedAt: new Date(),
        location: null,
        status: "ACTIVE" as const,
        source: "VALIDATION" as const,
        url: null,
        applicationStatus: "NONE" as const,
      };
      
      // Run Fit Analysis V3
      const analysisResult = await analyzeFitV3(mockJobPosting as any, candidateIntelligence);
      
      // Convert score to verdict
      const actualVerdict = scoreToVerdict(analysisResult.score);
      
      const result: ValidationResult = {
        job,
        actualVerdict,
        score: analysisResult.score,
        evidenceSummary: {
          strongEvidence: analysisResult.gapAnalysis.strongEvidence,
          partialEvidence: analysisResult.gapAnalysis.partialEvidence,
          missingEvidence: analysisResult.gapAnalysis.missingEvidence,
        },
        gaps: analysisResult.gapAnalysis.missingEvidence,
        v3Score: analysisResult.score,
        evidenceMatches: analysisResult.evidenceMatches,
      };
      
      results.push(result);
      
    } catch (error) {
      console.error(`[validation] Error analyzing ${job.title}:`, error);
      // Add failed result
      const result: ValidationResult = {
        job,
        actualVerdict: "SKIP", // Default to SKIP on error
        score: 0,
        evidenceSummary: {
          strongEvidence: [],
          partialEvidence: [],
          missingEvidence: ["Analysis failed"],
        },
        gaps: ["Analysis failed"],
        v3Score: 0,
        evidenceMatches: [],
      };
      
      results.push(result);
    }
  }
  
  // Calculate metrics
  const metrics = calculateMetrics(results);
  
  // Analyze errors
  const errorAnalysis = analyzeErrors(results);
  
  console.log(`[validation] Completed ${results.length} job analyses`);
  console.log(`[validation] Overall accuracy: ${metrics.overallAccuracy.toFixed(2)}%`);
  
  return {
    results,
    metrics,
    errorAnalysis,
  };
}

function scoreToVerdict(score: number): "APPLY" | "MAYBE" | "SKIP" {
  if (score >= 70) return "APPLY";
  if (score >= 45) return "MAYBE";
  return "SKIP";
}

function calculateMetrics(results: ValidationResult[]): ValidationMetrics {
  const total = results.length;
  let correct = 0;
  
  // Initialize confusion matrix
  const confusionMatrix: any = {
    apply: { apply: 0, maybe: 0, skip: 0 },
    maybe: { apply: 0, maybe: 0, skip: 0 },
    skip: { apply: 0, maybe: 0, skip: 0 },
  };
  
  // Count by expected verdict
  const applyJobs = results.filter(r => r.job.expectedVerdict === "APPLY");
  const maybeJobs = results.filter(r => r.job.expectedVerdict === "MAYBE");
  const skipJobs = results.filter(r => r.job.expectedVerdict === "SKIP");
  
  // Calculate accuracy and confusion matrix
  results.forEach(result => {
    const expected = result.job.expectedVerdict;
    const actual = result.actualVerdict;
    
    if (expected === actual) {
      correct++;
    }
    
    // Update confusion matrix
    if (confusionMatrix[expected] && confusionMatrix[expected][actual] !== undefined) {
      confusionMatrix[expected][actual]++;
    }
  });
  
  const applyAccuracy = applyJobs.filter(r => r.actualVerdict === "APPLY").length / applyJobs.length * 100;
  const maybeAccuracy = maybeJobs.filter(r => r.actualVerdict === "MAYBE").length / maybeJobs.length * 100;
  const skipAccuracy = skipJobs.filter(r => r.actualVerdict === "SKIP").length / skipJobs.length * 100;
  
  return {
    overallAccuracy: (correct / total) * 100,
    applyAccuracy,
    maybeAccuracy,
    skipAccuracy,
    confusionMatrix,
    totalJobs: total,
  };
}

function analyzeErrors(results: ValidationResult[]): ErrorAnalysis {
  const falsePositives: ValidationResult[] = [];
  const falseNegatives: ValidationResult[] = [];
  
  results.forEach(result => {
    const expected = result.job.expectedVerdict;
    const actual = result.actualVerdict;
    
    // False positive: Expected SKIP/MAYBE but got APPLY
    if ((expected === "SKIP" || expected === "MAYBE") && actual === "APPLY") {
      falsePositives.push(result);
    }
    
    // False negative: Expected APPLY but got MAYBE/SKIP
    if (expected === "APPLY" && (actual === "MAYBE" || actual === "SKIP")) {
      falseNegatives.push(result);
    }
  });
  
  // Analyze failure patterns
  const failurePatterns = analyzeFailurePatterns(falsePositives, falseNegatives);
  
  return {
    falsePositives,
    falseNegatives,
    biggestFailurePatterns: failurePatterns,
  };
}

function analyzeFailurePatterns(
  falsePositives: ValidationResult[],
  falseNegatives: ValidationResult[]
): string[] {
  const patterns: string[] = [];
  
  // Analyze false positives
  if (falsePositives.length > 0) {
    const fpCategories = [...new Set(falsePositives.map(fp => fp.job.category))];
    patterns.push(`False positives concentrated in: ${fpCategories.join(", ")}`);
    
    const fpScores = falsePositives.map(fp => fp.v3Score);
    const avgFpScore = fpScores.reduce((a, b) => a + b, 0) / fpScores.length;
    patterns.push(`False positives average score: ${avgFpScore.toFixed(1)}%`);
  }
  
  // Analyze false negatives
  if (falseNegatives.length > 0) {
    const fnCategories = [...new Set(falseNegatives.map(fn => fn.job.category))];
    patterns.push(`False negatives concentrated in: ${fnCategories.join(", ")}`);
    
    const fnScores = falseNegatives.map(fn => fn.v3Score);
    const avgFnScore = fnScores.reduce((a, b) => a + b, 0) / fnScores.length;
    patterns.push(`False negatives average score: ${avgFnScore.toFixed(1)}%`);
    
    // Common missing evidence for false negatives
    const commonGaps = [...new Set(falseNegatives.flatMap(fn => fn.gaps))];
    if (commonGaps.length > 0) {
      patterns.push(`Common missing evidence: ${commonGaps.slice(0, 3).join(", ")}`);
    }
  }
  
  return patterns;
}

export async function generateValidationReport(): Promise<string> {
  const { results, metrics, errorAnalysis } = await runValidation();
  
  const report = `
# Fit Analysis V3 Validation Report

## Dataset Overview
- Total Jobs: ${metrics.totalJobs}
- Expected APPLY: ${results.filter(r => r.job.expectedVerdict === "APPLY").length}
- Expected MAYBE: ${results.filter(r => r.job.expectedVerdict === "MAYBE").length}
- Expected SKIP: ${results.filter(r => r.job.expectedVerdict === "SKIP").length}

## Accuracy Metrics
- **Overall Accuracy**: ${metrics.overallAccuracy.toFixed(2)}%
- **APPLY Accuracy**: ${metrics.applyAccuracy.toFixed(2)}%
- **MAYBE Accuracy**: ${metrics.maybeAccuracy.toFixed(2)}%
- **SKIP Accuracy**: ${metrics.skipAccuracy.toFixed(2)}%

## Confusion Matrix

| Expected \\ Actual | APPLY | MAYBE | SKIP |
|-------------------|-------|-------|------|
| **APPLY**         | ${metrics.confusionMatrix.apply.apply} | ${metrics.confusionMatrix.apply.maybe} | ${metrics.confusionMatrix.apply.skip} |
| **MAYBE**         | ${metrics.confusionMatrix.maybe.apply} | ${metrics.confusionMatrix.maybe.maybe} | ${metrics.confusionMatrix.maybe.skip} |
| **SKIP**          | ${metrics.confusionMatrix.skip.apply} | ${metrics.confusionMatrix.skip.maybe} | ${metrics.confusionMatrix.skip.skip} |

## Error Analysis

### False Positives (${errorAnalysis.falsePositives.length})
Jobs expected to be SKIP/MAYBE but classified as APPLY:
${errorAnalysis.falsePositives.map(fp => 
  `- **${fp.job.title}** at ${fp.job.company}: Score ${fp.v3Score}% (expected ${fp.job.expectedVerdict})`
).join('\n')}

### False Negatives (${errorAnalysis.falseNegatives.length})
Jobs expected to be APPLY but classified as MAYBE/SKIP:
${errorAnalysis.falseNegatives.map(fn => 
  `- **${fn.job.title}** at ${fn.job.company}: Score ${fn.v3Score}% (expected ${fn.job.expectedVerdict})`
).join('\n')}

## Biggest Failure Patterns
${errorAnalysis.biggestFailurePatterns.map(pattern => `- ${pattern}`).join('\n')}

## Recommendations
${generateRecommendations(metrics, errorAnalysis)}

## Detailed Results
${results.map(result => `
### ${result.job.title} at ${result.job.company}
- **Expected**: ${result.job.expectedVerdict}
- **Actual**: ${result.actualVerdict}
- **Score**: ${result.v3Score}%
- **Status**: ${result.job.expectedVerdict === result.actualVerdict ? '✅ CORRECT' : '❌ INCORRECT'}
- **Strong Evidence**: ${result.evidenceSummary.strongEvidence.length > 0 ? result.evidenceSummary.strongEvidence.join(', ') : 'None'}
- **Missing Evidence**: ${result.gaps.length > 0 ? result.gaps.join(', ') : 'None'}
`).join('\n')}
`;

  return report;
}

function generateRecommendations(metrics: ValidationMetrics, errorAnalysis: ErrorAnalysis): string {
  const recommendations: string[] = [];
  
  if (metrics.overallAccuracy < 70) {
    recommendations.push("- Overall accuracy is below 70%. Consider recalibrating scoring thresholds.");
  }
  
  if (metrics.applyAccuracy < 80) {
    recommendations.push("- APPLY accuracy is low. The system may be too conservative for suitable roles.");
  }
  
  if (metrics.skipAccuracy < 80) {
    recommendations.push("- SKIP accuracy is low. The system may be incorrectly recommending senior roles.");
  }
  
  if (errorAnalysis.falsePositives.length > errorAnalysis.falseNegatives.length) {
    recommendations.push("- More false positives than false negatives. Consider raising the APPLY threshold.");
  } else if (errorAnalysis.falseNegatives.length > errorAnalysis.falsePositives.length) {
    recommendations.push("- More false negatives than false positives. Consider lowering the APPLY threshold.");
  }
  
  if (errorAnalysis.falseNegatives.length > 0) {
    const commonGaps = [...new Set(errorAnalysis.falseNegatives.flatMap(fn => fn.gaps))];
    if (commonGaps.length > 0) {
      recommendations.push(`- Address common missing evidence: ${commonGaps.slice(0, 3).join(", ")}`);
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push("- Validation results look good. Current thresholds and logic appear well-calibrated.");
  }
  
  return recommendations.join('\n');
}

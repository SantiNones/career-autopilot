import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

function generateApplicationStrategy(finalVerdict: string): string {
  switch (finalVerdict) {
    case "APPLY":
      return "Strong fit. Emphasize the most relevant projects and apply.";
    case "APPLY_STRETCH":
      return "Stretch opportunity. Apply only with a strong positioning narrative that addresses the main gaps.";
    case "MAYBE":
      return "Moderate fit. Review gaps before investing time.";
    case "SKIP":
      return "Low fit. Do not prioritize unless there is a strategic reason.";
    default:
      return "Review job details before applying.";
  }
}
import { scoreJob } from "@/server/jobScoring";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;

    // Get the recommended job
    const recommendedJob = await prisma.recommendedJob.findUnique({
      where: { id },
    });

    if (!recommendedJob) {
      return NextResponse.json(
        { success: false, error: "Recommended job not found" },
        { status: 404 }
      );
    }

    // Check if a job already exists for this recommendation
    if (recommendedJob.createdJobId) {
      const existingJob = await prisma.jobPosting.findUnique({
        where: { id: recommendedJob.createdJobId },
      });

      if (existingJob) {
        return NextResponse.json({
          success: true,
          createdJobId: existingJob.id,
          message: "Job already exists",
        });
      }
    }

    // Check for duplicate job by URL
    const existingJobByUrl = await prisma.jobPosting.findFirst({
      where: { sourceUrl: recommendedJob.applyUrl },
    });

    if (existingJobByUrl) {
      // Update the recommended job to point to the existing job
      await prisma.recommendedJob.update({
        where: { id },
        data: { createdJobId: existingJobByUrl.id },
      });

      return NextResponse.json({
        success: true,
        createdJobId: existingJobByUrl.id,
        message: "Job already exists (found by URL)",
      });
    }

    // Use V2 scoring data from RecommendedJob if available, otherwise re-score
    let score;
    if (recommendedJob.fitScore && recommendedJob.positionabilityScore && recommendedJob.finalVerdict) {
      // Use V2 scoring data from RecommendedJob
      const v2Breakdown = recommendedJob.fitBreakdown as any || {};
      score = {
        totalScore: recommendedJob.fitScore, // Use fitScore as main score
        label: recommendedJob.finalVerdict as any,
        reasons: recommendedJob.fitReasons as string[],
        risks: recommendedJob.fitRisks as string[],
        gaps: recommendedJob.fitGaps as string[],
        // V2 breakdown components
        seniorityFit: v2Breakdown.seniorityFit || 0,
        stackFit: v2Breakdown.stackFit || 0,
        domainFit: v2Breakdown.domainFit || 0,
        languageFit: v2Breakdown.languageFit || 0,
        geographyFit: v2Breakdown.geographyFit || 0,
        salaryFit: 0,
        screeningFit: 0,
        honestyFit: v2Breakdown.honestyFit || 0,
        effortReward: 0,
        strategicValue: 0,
        narrativeSuggestion: generateApplicationStrategy(recommendedJob.finalVerdict as string)
      };
    } else {
      // Fallback: Re-score using V2 discovery scoring
      const prefs = await prisma.candidatePreferences.findFirst({
        orderBy: { createdAt: "asc" },
      });
      
      const { discoveryScoreJob } = await import("@/server/jobDiscovery/discoveryScoring");
      const discoveryScore = discoveryScoreJob({
        title: recommendedJob.title,
        company: recommendedJob.company,
        location: recommendedJob.location,
        description: recommendedJob.description,
        applyUrl: recommendedJob.applyUrl,
        source: recommendedJob.source,
        provider: recommendedJob.provider
      }, prefs);
      
      score = {
        totalScore: discoveryScore.fitScore || discoveryScore.matchScore, // Use fitScore if available
        label: discoveryScore.finalVerdict || discoveryScore.label,
        reasons: discoveryScore.fitReasons || discoveryScore.reasons,
        risks: discoveryScore.fitRisks || discoveryScore.risks,
        gaps: discoveryScore.fitGaps || discoveryScore.gaps,
        // V2 breakdown components
        seniorityFit: (discoveryScore.fitBreakdown as any)?.seniorityFit || 0,
        stackFit: (discoveryScore.fitBreakdown as any)?.stackFit || 0,
        domainFit: (discoveryScore.fitBreakdown as any)?.domainFit || 0,
        languageFit: (discoveryScore.fitBreakdown as any)?.languageFit || 0,
        geographyFit: (discoveryScore.fitBreakdown as any)?.geographyFit || 0,
        salaryFit: 0,
        screeningFit: 0,
        honestyFit: (discoveryScore.fitBreakdown as any)?.honestyFit || 0,
        effortReward: 0,
        strategicValue: 0,
        narrativeSuggestion: generateApplicationStrategy(discoveryScore.finalVerdict || discoveryScore.label)
      };
    }

    // Create a new job from the recommended job
    const newJob = await prisma.jobPosting.create({
      data: {
        title: recommendedJob.title,
        companyName: recommendedJob.company,
        location: recommendedJob.location,
        sourceUrl: recommendedJob.applyUrl,
        rawText: recommendedJob.description || "",
        source: recommendedJob.source,
        scrapedAt: recommendedJob.discoveredAt,
      },
    });

    // Create job evaluation with score data
    await prisma.jobEvaluation.create({
      data: {
        jobPostingId: newJob.id,
        totalScore: score.totalScore,
        label: score.label,
        reasons: score.reasons,
        risks: score.risks,
        gaps: score.gaps,
        seniorityFit: score.seniorityFit,
        stackFit: score.stackFit,
        domainFit: score.domainFit,
        languageFit: score.languageFit,
        geographyFit: score.geographyFit,
        salaryFit: score.salaryFit,
        screeningFit: score.screeningFit,
        honestyFit: score.honestyFit,
        effortReward: score.effortReward,
        strategicValue: score.strategicValue,
        narrativeSuggestion: score.narrativeSuggestion,
      },
    });

    // Update the recommended job to reference the created job
    await prisma.recommendedJob.update({
      where: { id },
      data: { createdJobId: newJob.id },
    });

    console.log(`[discovery] Created job ${newJob.id} from recommended job ${id} with score ${score.totalScore}`);

    return NextResponse.json({
      success: true,
      createdJobId: newJob.id,
      jobUrl: `/jobs/${newJob.id}`,
      message: "Job created successfully",
      score: score.totalScore,
      label: score.label,
    });
  } catch (error) {
    console.error("[discovery] create-job failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

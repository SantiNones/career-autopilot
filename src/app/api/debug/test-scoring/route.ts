import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { discoveryScoreJob } from "@/server/jobDiscovery/discoveryScoring";

export async function GET() {
  try {
    // Get candidate preferences
    const prefs = await prisma.candidatePreferences.findFirst({
      orderBy: { createdAt: "asc" },
    });

    if (!prefs) {
      return NextResponse.json({ error: "No preferences found" }, { status: 404 });
    }

    // Test scoring with a sample job
    const sampleJob = {
      title: "Junior Software Engineer",
      company: "Test Company",
      location: "Remote - Spain",
      description: "Looking for a junior software engineer with React experience...",
      applyUrl: "https://example.com/apply",
      source: "test",
      provider: "test"
    };

    console.log("Testing V1.2 scoring with sample job...");
    
    const score = discoveryScoreJob(sampleJob, prefs);
    
    return NextResponse.json({
      success: true,
      preferences: {
        hasPreferredLocations: !!prefs.preferredLocations,
        hasRemotePreference: !!prefs.remotePreference,
        hasTargetRoleKeywords: !!prefs.targetRoleKeywords,
        hasExcludedRoleKeywords: !!prefs.excludedRoleKeywords,
        hasAllowedSeniorities: !!prefs.allowedSeniorities
      },
      scoring: {
        matchScore: score.matchScore,
        label: score.label,
        locationEligible: score.locationEligibility.eligible,
        locationCategory: score.locationEligibility.category,
        seniorityAllowed: score.seniorityClassification.allowed,
        seniorityLevel: score.seniorityClassification.level,
        roleFamily: score.roleIntent?.roleFamily,
        isTargetRole: score.roleIntent?.isTargetRole,
        queryMatch: score.queryMatch?.matches,
        baseScore: score.baseScore,
        finalScore: score.finalScore,
        reasons: score.reasons.slice(0, 3),
        risks: score.risks.slice(0, 3)
      }
    });
  } catch (error) {
    console.error("Test scoring failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ 
      success: false, 
      error: message,
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

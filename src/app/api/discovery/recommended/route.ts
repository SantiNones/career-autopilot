import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET(): Promise<NextResponse> {
  try {
    const jobs = await prisma.recommendedJob.findMany({
      orderBy: [
        // Sort by label priority first (APPLY > MAYBE > SKIP)
        { label: "asc" }, // SKIP comes before MAYBE before APPLY alphabetically, so we need custom ordering
        { matchScore: "desc" },
        { discoveredAt: "desc" },
      ],
      take: 100,
    });

    // Custom sorting by label priority
    const labelPriority = { APPLY: 0, MAYBE: 1, SKIP: 2 };
    const sortedJobs = jobs.sort((a, b) => {
      const priorityDiff = (labelPriority[a.label as keyof typeof labelPriority] ?? 3) - 
                          (labelPriority[b.label as keyof typeof labelPriority] ?? 3);
      if (priorityDiff !== 0) return priorityDiff;
      
      const scoreDiff = b.matchScore - a.matchScore;
      if (scoreDiff !== 0) return scoreDiff;
      
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ success: true, jobs: sortedJobs });
  } catch (error) {
    console.error("[discovery] recommended fetch failed:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

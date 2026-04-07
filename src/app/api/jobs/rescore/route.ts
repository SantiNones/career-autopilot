import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { scoreJob } from "@/server/jobScoring";

export async function POST() {
  try {
    const prefs = await prisma.candidatePreferences.findFirst();
    const jobs = await prisma.jobPosting.findMany({
      select: { id: true, rawText: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    for (const job of jobs) {
      const text = job.rawText ?? "";
      const evaluation = scoreJob(text, prefs);
      await prisma.jobEvaluation.create({
        data: {
          jobPostingId: job.id,
          label: evaluation.label,
          totalScore: evaluation.totalScore,
          seniorityFit: evaluation.seniorityFit,
          stackFit: evaluation.stackFit,
          domainFit: evaluation.domainFit,
          languageFit: evaluation.languageFit,
          geographyFit: evaluation.geographyFit,
          salaryFit: evaluation.salaryFit,
          screeningFit: evaluation.screeningFit,
          honestyFit: evaluation.honestyFit,
          effortReward: evaluation.effortReward,
          strategicValue: evaluation.strategicValue,
          reasons: evaluation.reasons,
          risks: evaluation.risks,
          gaps: evaluation.gaps,
          narrativeSuggestion: evaluation.narrativeSuggestion,
          llmModel: null,
          llmPromptVersion: "heuristic_v1",
        },
      });

      await prisma.jobPosting.update({
        where: { id: job.id },
        data: { status: "SCORED" },
      });
    }

    return NextResponse.json({ ok: true, rescored: jobs.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { scoreJob } from "@/server/jobScoring";
import { saveFitAnalysis } from "@/server/fitAnalysis";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await props.params;
    const body = (await req.json()) as { rawText?: string };
    const rawText = body.rawText?.trim() ?? "";

    if (rawText.length < 50) {
      return NextResponse.json(
        { error: "Job description is too short — paste the full job description." },
        { status: 400 },
      );
    }

    const job = await prisma.jobPosting.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const prefs = await prisma.candidatePreferences.findFirst();
    const evaluation = scoreJob(rawText, prefs);

    // Clear all warning flags from parsedJson so banners disappear after description is saved.
    // blocked/blockedReason/textLength come from parseJobFromHtml and remain stale otherwise.
    const existingJson = ((job.parsedJson ?? {}) as Record<string, unknown>);
    const updatedJson: Record<string, unknown> = {
      ...existingJson,
      needsDescription: false,
      blocked: false,
      blockedReason: null,
      textLength: rawText.length,
      parser: "manual_description_v1",
      descriptionUpdatedAt: new Date().toISOString(),
    };

    // Improve title if it's still the placeholder
    const firstLine = rawText.split(/\r?\n/)[0]?.trim() ?? "";
    const titleIsPlaceholder =
      !job.title || job.title === "Needs manual job description";
    const newTitle =
      titleIsPlaceholder && firstLine.length > 5 && firstLine.length < 200
        ? firstLine
        : (job.title ?? undefined);

    await prisma.jobPosting.update({
      where: { id },
      data: {
        rawText,
        title: newTitle,
        parsedJson: updatedJson as unknown as object,
        status: "SCORED",
        applicationStatus: evaluation.label === 'APPLY_STRETCH' ? 'APPLY' : evaluation.label,
        evaluations: {
          create: {
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
        },
      },
    });

    void saveFitAnalysis(id);

    return NextResponse.json({ ok: true, jobId: id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

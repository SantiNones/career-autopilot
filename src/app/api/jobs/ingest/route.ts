import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { parseJobFromHtml } from "@/server/jobParsing";
import { scoreJob } from "@/server/jobScoring";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string };
    const url = body.url?.trim();

    if (!url) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    const existing = await prisma.jobPosting.findUnique({ where: { sourceUrl: url } });
    if (existing) {
      return NextResponse.json({ jobId: existing.id, deduped: true });
    }

    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Failed to fetch url (status ${res.status})` },
        { status: 400 },
      );
    }

    const html = await res.text();
    const parsed = parseJobFromHtml(url, html);

    const prefs = await prisma.candidatePreferences.findFirst();

    const evaluation = scoreJob(parsed.rawText, prefs);

    const job = await prisma.jobPosting.create({
      data: {
        sourceUrl: url,
        source: new URL(url).hostname,
        title: parsed.title,
        companyName: parsed.companyName,
        rawHtml: html,
        rawText: parsed.rawText,
        parsedJson: parsed.parsedJson as unknown as object,
        status: "SCORED",
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
      select: { id: true },
    });

    return NextResponse.json({ jobId: job.id, deduped: false });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

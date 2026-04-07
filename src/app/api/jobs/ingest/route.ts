import { NextResponse } from "next/server";

import { createHash } from "crypto";

import { prisma } from "@/lib/db";
import { parseJobFromHtml } from "@/server/jobParsing";
import { scoreJob } from "@/server/jobScoring";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { url?: string; pastedText?: string };
    const url = body.url?.trim() || undefined;
    const pastedText = body.pastedText?.trim() || undefined;

    if (!url && !pastedText) {
      return NextResponse.json(
        { error: "Provide url or pastedText" },
        { status: 400 },
      );
    }

    const sourceUrl = url
      ? url
      : `manual:${createHash("sha256").update(pastedText ?? "").digest("hex").slice(0, 16)}`;

    const existing = await prisma.jobPosting.findUnique({
      where: { sourceUrl },
    });
    if (existing) {
      return NextResponse.json({ jobId: existing.id, deduped: true });
    }

    let parsed:
      | ReturnType<typeof parseJobFromHtml>
      | { title?: string; companyName?: string; rawText: string; parsedJson: object };
    let rawHtml: string | null = null;

    if (url) {
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
      rawHtml = html;
      parsed = parseJobFromHtml(url, html);
    } else {
      const firstLine = (pastedText ?? "").split(/\r?\n/)[0]?.trim();
      parsed = {
        title: firstLine?.slice(0, 200) || undefined,
        companyName: undefined,
        rawText: pastedText ?? "",
        parsedJson: {
          sourceUrl,
          parser: "pasted_v1",
        },
      };
    }

    const prefs = await prisma.candidatePreferences.findFirst();

    const evaluation = scoreJob(parsed.rawText, prefs);

    const job = await prisma.jobPosting.create({
      data: {
        sourceUrl,
        source: url ? new URL(url).hostname : "manual",
        title: parsed.title,
        companyName: parsed.companyName,
        rawHtml,
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

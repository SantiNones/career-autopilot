import { NextResponse } from "next/server";

import { createHash } from "crypto";

import { prisma } from "@/lib/db";
import { parseJobFromHtml, validateJobPage, validateIngestInput } from "@/server/jobParsing";
import { scoreJob } from "@/server/jobScoring";
import { saveFitAnalysis } from "@/server/fitAnalysis";

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
    let source: string;
    let needsDescription = false;

    // If substantial pasted text is provided (>=200 chars), it wins —
    // skip URL fetching entirely; URL is kept only as a sourceUrl identifier.
    const MEANINGFUL_TEXT_THRESHOLD = 200;
    const hasSubstantialText = !!pastedText && pastedText.length >= MEANINGFUL_TEXT_THRESHOLD;

    if (hasSubstantialText) {
      const firstLine = pastedText!.split(/\r?\n/)[0]?.trim() ?? "";
      parsed = {
        title: firstLine.length > 5 && firstLine.length < 200 ? firstLine : undefined,
        companyName: undefined,
        rawText: pastedText!,
        parsedJson: { sourceUrl, parser: "pasted_v1" },
      };
      source = url ? new URL(url).hostname : "manual";
    } else {
      const input = url || pastedText || "";
      const ingestCheck = validateIngestInput(input);
      if (!ingestCheck.ok) {
        // Hard-blocked domains (google, github, etc.) — still reject with 400.
        return NextResponse.json(
          { error: "This URL does not look like a job posting. Paste the job description manually." },
          { status: 400 },
        );
      }

      if (ingestCheck.isUrl) {
        const normalizedUrl = ingestCheck.url;
        source = new URL(normalizedUrl).hostname;

        const res = await fetch(normalizedUrl, {
          redirect: "follow",
          headers: {
            "user-agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            accept: "text/html,application/xhtml+xml",
          },
        });

        if (!res.ok) {
          // Fetch failed (blocked/redirected to login) — create a needs-description record.
          needsDescription = true;
          parsed = {
            title: "Needs manual job description",
            companyName: source,
            rawText: "",
            parsedJson: {
              sourceUrl,
              parser: "url_blocked_v1",
              needsDescription: true,
              fetchStatus: res.status,
            },
          };
        } else {
          const html = await res.text();
          rawHtml = html;
          parsed = parseJobFromHtml(normalizedUrl, html);

          const validation = validateJobPage(normalizedUrl, parsed.title, parsed.rawText);
          if (!validation.valid) {
            // Content could not be verified as a job page — keep what we have but flag it.
            needsDescription = true;
            const existingJson = (parsed.parsedJson ?? {}) as Record<string, unknown>;
            parsed = {
              ...parsed,
              title: parsed.title ?? "Needs manual job description",
              companyName: parsed.companyName ?? source,
              parsedJson: {
                ...existingJson,
                needsDescription: true,
                validationReason: validation.reason,
              },
            };
          }
        }
      } else {
        source = "manual";
        const firstLine = (pastedText ?? "").split(/\r?\n/)[0]?.trim();
        parsed = {
          title: firstLine?.slice(0, 200) || undefined,
          companyName: undefined,
          rawText: pastedText ?? "",
          parsedJson: { sourceUrl, parser: "pasted_v1" },
        };
      }
    }

    const prefs = await prisma.candidatePreferences.findFirst();

    const evaluation = scoreJob(parsed.rawText || "", prefs);
    if (needsDescription) {
      evaluation.risks = [
        "Needs manual job description — paste the full job description to re-analyze",
        ...evaluation.risks,
      ];
      if (evaluation.label === "APPLY") evaluation.label = "MAYBE";
    }

    const job = await prisma.jobPosting.create({
      data: {
        sourceUrl,
        source,
        title: parsed.title,
        companyName: parsed.companyName,
        rawHtml,
        rawText: parsed.rawText,
        parsedJson: parsed.parsedJson as unknown as object,
        status: "SCORED",
        applicationStatus: evaluation.label,
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

    void saveFitAnalysis(job.id);

    return NextResponse.json({ jobId: job.id, deduped: false });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

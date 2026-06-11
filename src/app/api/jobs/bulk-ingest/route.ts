import { NextResponse } from "next/server";

import { createHash } from "crypto";

import { prisma } from "@/lib/db";
import { parseJobFromHtml, validateJobPage, validateIngestInput } from "@/server/jobParsing";
import { scoreJob } from "@/server/jobScoring";
import { saveFitAnalysis } from "@/server/fitAnalysis";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { items?: string[] };
    const items = (body.items ?? []).map((s) => s.trim()).filter(Boolean);

    if (!items.length) {
      return NextResponse.json({ error: "No items provided" }, { status: 400 });
    }

    const prefs = await prisma.candidatePreferences.findFirst();
    const results: Array<{ jobId?: string; deduped?: boolean; invalid?: boolean; error?: string; item?: string }> = [];

    for (const item of items) {
      try {
        const ingestCheck = validateIngestInput(item);
        if (!ingestCheck.ok) {
          console.log("[bulk-ingest] REJECTED:", ingestCheck.reason);
          results.push({ invalid: true, error: ingestCheck.reason, item: item.slice(0, 80) });
          continue;
        }

        const sourceUrl = ingestCheck.isUrl
          ? ingestCheck.url
          : `manual:${createHash("sha256").update(item).digest("hex").slice(0, 16)}`;

        const existing = await prisma.jobPosting.findUnique({ where: { sourceUrl } });
        if (existing) {
          results.push({ jobId: existing.id, deduped: true });
          continue;
        }

        let rawHtml: string | null = null;
        let parsed: { title?: string; companyName?: string; rawText: string; parsedJson: object };
        let needsDescription = false;

        if (ingestCheck.isUrl) {
          const normalizedUrl = ingestCheck.url;
          const hostname = new URL(normalizedUrl).hostname;

          const res = await fetch(normalizedUrl, {
            redirect: "follow",
            headers: {
              "user-agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              accept: "text/html,application/xhtml+xml",
            },
          });
          if (!res.ok) {
            // Blocked/unreachable — create a needs-description record instead of skipping.
            needsDescription = true;
            parsed = {
              title: "Needs manual job description",
              companyName: hostname,
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
              // Content unverifiable — keep scraped content but flag for manual input.
              needsDescription = true;
              const existingJson = (parsed.parsedJson ?? {}) as Record<string, unknown>;
              parsed = {
                ...parsed,
                title: parsed.title ?? "Needs manual job description",
                companyName: parsed.companyName ?? hostname,
                parsedJson: {
                  ...existingJson,
                  needsDescription: true,
                  validationReason: validation.reason,
                },
              };
            }
          }
        } else {
          const firstLine = item.split(/\r?\n/)[0]?.trim();
          parsed = {
            title: firstLine?.slice(0, 200) || undefined,
            rawText: item,
            parsedJson: { sourceUrl, parser: "pasted_v1" },
          };
        }

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
            source: ingestCheck.isUrl ? new URL(ingestCheck.url).hostname : "manual",
            title: parsed.title,
            companyName: parsed.companyName,
            rawHtml,
            rawText: parsed.rawText,
            parsedJson: parsed.parsedJson as object,
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
          select: { id: true },
        });

        void saveFitAnalysis(job.id);
        results.push({ jobId: job.id, deduped: false });
      } catch (e) {
        results.push({
          error: e instanceof Error ? e.message : "Unknown error",
          item: item.slice(0, 80),
        });
      }
    }

    return NextResponse.json({ ok: true, results });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

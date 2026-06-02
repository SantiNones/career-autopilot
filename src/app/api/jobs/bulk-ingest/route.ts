import { NextResponse } from "next/server";

import { createHash } from "crypto";

import { prisma } from "@/lib/db";
import { parseJobFromHtml, validateJobPage, isLikelyJobUrl } from "@/server/jobParsing";
import { scoreJob } from "@/server/jobScoring";

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
        const isUrl = /^https?:\/\//.test(item);
        const sourceUrl = isUrl
          ? item
          : `manual:${createHash("sha256").update(item).digest("hex").slice(0, 16)}`;

        const existing = await prisma.jobPosting.findUnique({ where: { sourceUrl } });
        if (existing) {
          results.push({ jobId: existing.id, deduped: true });
          continue;
        }

        let rawHtml: string | null = null;
        let parsed: { title?: string; companyName?: string; rawText: string; parsedJson: object };

        if (isUrl) {
          console.log("[bulk-ingest] item:", item);
          const urlCheck = isLikelyJobUrl(item);
          if (!urlCheck.ok) {
            console.log("[bulk-ingest] REJECTED pre-flight:", urlCheck.reason);
            results.push({ invalid: true, error: urlCheck.reason, item: item.slice(0, 80) });
            continue;
          }

          const res = await fetch(item, {
            redirect: "follow",
            headers: {
              "user-agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              accept: "text/html,application/xhtml+xml",
            },
          });
          if (!res.ok) {
            results.push({ error: `HTTP ${res.status}`, item: item.slice(0, 80) });
            continue;
          }
          const html = await res.text();
          rawHtml = html;
          parsed = parseJobFromHtml(item, html);

          const validation = validateJobPage(item, parsed.title, parsed.rawText);
          if (!validation.valid) {
            results.push({ invalid: true, error: validation.reason, item: item.slice(0, 80) });
            continue;
          }
        } else {
          const firstLine = item.split(/\r?\n/)[0]?.trim();
          parsed = {
            title: firstLine?.slice(0, 200) || undefined,
            rawText: item,
            parsedJson: { sourceUrl, parser: "pasted_v1" },
          };
        }

        const evaluation = scoreJob(parsed.rawText, prefs);

        const job = await prisma.jobPosting.create({
          data: {
            sourceUrl,
            source: isUrl ? new URL(item).hostname : "manual",
            title: parsed.title,
            companyName: parsed.companyName,
            rawHtml,
            rawText: parsed.rawText,
            parsedJson: parsed.parsedJson as object,
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

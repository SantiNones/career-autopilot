import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/db";
import type { ExperienceInsightEntry } from "../route";

const SYSTEM_PROMPT = `You are an expert career analyst. Your task is to analyze a candidate's work experience section and extract structured insights.

Rules:
- Infer responsibilities from what is described
- Infer transferable skills from the type of work performed
- Extract keywords relevant to the roles
- Extract metrics ONLY if explicitly mentioned — do not invent numbers
- Do NOT invent achievements, technologies, certifications, or responsibilities not supported by the text
- Be conservative and factual
- If experience is sparse, infer minimally and honestly

Output format: Return ONLY a valid JSON array. No markdown, no explanation, no code blocks.

Each element must have exactly these keys:
- company (string)
- role (string — infer from context if not explicit, e.g. "Content Moderator" from the tasks described)
- responsibilities (string array — concise, max 5)
- skills (string array — transferable, max 6)
- keywords (string array — industry/role relevant, max 8)
- metrics (string array — only if mentioned, can be empty array)`;

function buildUserMessage(experienceText: string): string {
  return `Analyze the following work experience section and return structured JSON insights:\n\n${experienceText}`;
}

function parseInsights(raw: string): ExperienceInsightEntry[] {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned) as unknown;
  if (!Array.isArray(parsed)) throw new Error("Expected a JSON array");
  return parsed as ExperienceInsightEntry[];
}

export async function POST() {
  try {
    const resume = await prisma.resumeMaster.findFirst({ orderBy: { createdAt: "asc" } });
    if (!resume) {
      return NextResponse.json({ error: "No master resume found. Add your resume first." }, { status: 400 });
    }
    if (!resume.experience?.trim()) {
      return NextResponse.json({ error: "No experience section found. Parse your resume first." }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL ?? "gpt-4o";

    const response = await client.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserMessage(resume.experience) },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "";
    if (!raw.trim()) {
      return NextResponse.json({ error: "OpenAI returned an empty response" }, { status: 502 });
    }

    let insights: ExperienceInsightEntry[];
    try {
      insights = parseInsights(raw);
    } catch {
      console.error("[experience-intelligence analyze] JSON parse failed:", raw.slice(0, 500));
      return NextResponse.json({ error: "Failed to parse AI response. Please try again." }, { status: 502 });
    }

    const record = await prisma.experienceInsight.upsert({
      where: { resumeMasterId: resume.id },
      create: { resumeMasterId: resume.id, insights },
      update: { insights },
    });

    return NextResponse.json({
      insights: record.insights as ExperienceInsightEntry[],
      analyzedAt: record.updatedAt,
    });
  } catch (e) {
    console.error("[experience-intelligence analyze]", e);
    return NextResponse.json({ error: "Analysis failed. Please try again." }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import OpenAI from "openai";
import { prisma } from "@/lib/db";
import type { ExperienceInsightEntry } from "../route";


const SYSTEM_PROMPT = `You are a senior career strategist. Your task is to analyze a candidate's work experience and produce structured professional intelligence that can later be used to generate stronger CVs, cover letters, and recruiter messages.

CORE MISSION:
Translate domain-specific work into transferable professional value. Think like a recruiter reading between the lines. Go beyond surface-level job descriptions to identify the underlying professional competencies that make someone hireable in multiple contexts.

STRICT RULES:
- Infer only from what is described. Do NOT invent achievements, technologies, certifications, or experience not supported by the text.
- Extract metrics ONLY if explicitly mentioned. Do not fabricate numbers.
- If experience is sparse, infer minimally and honestly.
- Think about what this work SIGNALS about the person, not just what they literally did.

FIELD DEFINITIONS:

responsibilities: What they literally did in the role. Concise, factual. Max 5.

skills: Transferable skills demonstrated by the work. Not job-specific jargon — broader competencies that travel across roles. Max 6.

keywords: Industry and role-relevant terms for ATS and recruiter scanning. Max 8.

metrics: Only if explicitly mentioned in the text. Empty array if none.

transferableNarratives: Short statements describing what this role SIGNALS about the candidate as a professional. Frame as competency demonstrations, not task descriptions. Think: what would a recruiter say about this person based on this experience? Max 6 statements.
  Examples:
  - "Made high-stakes decisions under ambiguity"
  - "Maintained quality under strict performance targets"
  - "Adapted communication style to different audiences"
  - "Handled objections and stakeholder concerns professionally"
  - "Worked effectively in KPI-driven environments"

workEnvironment: Describe the operating environment this person has experience in. These help match the candidate to new contexts. Max 4.
  Examples:
  - "High-volume operational workflows"
  - "Policy-driven decision making"
  - "Public-facing communication"
  - "Team-based collaborative environment"

professionalThemes: Higher-level professional concepts this role demonstrates. Single words or short phrases. These are the meta-competencies. Max 5.
  Examples:
  - "Decision making"
  - "Quality assurance"
  - "Communication"
  - "Adaptability"
  - "Coordination"

Output format: Return ONLY valid JSON. No markdown, no explanation, no code blocks.`;

function buildUserMessage(experienceText: string): string {
  return `Analyze the following work experience section and return structured professional intelligence:\n\n${experienceText}`;
}

function parseInsights(raw: string): ExperienceInsightEntry[] {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const parsed = JSON.parse(cleaned) as unknown;
  // Accept bare array or { insights: [...] } wrapper from json_object mode
  if (Array.isArray(parsed)) return parsed as ExperienceInsightEntry[];
  if (parsed && typeof parsed === "object" && Array.isArray((parsed as Record<string, unknown>).insights)) {
    return (parsed as { insights: ExperienceInsightEntry[] }).insights;
  }
  throw new Error("Expected a JSON array");
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
    const userContent = buildUserMessage(resume.experience);

    // GPT-5 / o-series: Responses API (no temperature, json_schema strict mode)
    // Older models: Chat Completions with json_object + temperature
    const isGpt5 = model.startsWith("gpt-5") || model.startsWith("o");

    // Structured Outputs requires root type to be "object", not "array"
    const INSIGHT_SCHEMA = {
      type: "object",
      properties: {
        insights: {
          type: "array",
          items: {
            type: "object",
            properties: {
              company:                { type: "string" },
              role:                   { type: "string" },
              responsibilities:       { type: "array", items: { type: "string" } },
              skills:                 { type: "array", items: { type: "string" } },
              keywords:               { type: "array", items: { type: "string" } },
              metrics:                { type: "array", items: { type: "string" } },
              transferableNarratives: { type: "array", items: { type: "string" } },
              workEnvironment:        { type: "array", items: { type: "string" } },
              professionalThemes:     { type: "array", items: { type: "string" } },
            },
            required: ["company", "role", "responsibilities", "skills", "keywords", "metrics", "transferableNarratives", "workEnvironment", "professionalThemes"],
            additionalProperties: false,
          },
        },
      },
      required: ["insights"],
      additionalProperties: false,
    };

    let raw: string;

    if (isGpt5) {
      const resp = await client.responses.create({
        model,
        instructions: SYSTEM_PROMPT,
        input: userContent,
        text: {
          format: {
            type: "json_schema",
            name: "experience_insights",
            schema: INSIGHT_SCHEMA,
            strict: true,
          },
        },
        max_output_tokens: 6000,
      });
      // Responses API returns { insights: [...] } due to the wrapper schema
      const parsed = JSON.parse(resp.output_text ?? "{}") as { insights?: unknown };
      raw = JSON.stringify(parsed.insights ?? []);
    } else {
      const resp = await client.chat.completions.create({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        max_tokens: 3000,
        temperature: 0.2,
      });
      raw = resp.choices[0]?.message?.content ?? "[]";
    }

    if (!raw.trim() || (raw.trim() === "[]" && !raw.includes("company"))) {
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

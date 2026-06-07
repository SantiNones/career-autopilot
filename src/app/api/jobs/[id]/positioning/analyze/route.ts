import { NextResponse } from "next/server";
import OpenAI from "openai";

import { prisma } from "@/lib/db";

export type PositioningProfile = {
  // Executive Summary (Primary)
  recommendedTitle: string;
  recruiterHook: string;
  leadWith: string[]; // Exactly 3 items

  // Core Narrative
  primaryNarrative: string;

  // Risk & Response (Actionable)
  biggestRisk: string;
  riskResponse: string;

  // Supporting Evidence
  strengthsToEmphasize: string[]; // Max 3
  differentiators: string[]; // Max 3

  // Application Strategy
  cvStrategy: string;
  interviewStrategy: string;

  // Metadata
  confidence: number;
};

// ─── GPT-5 Responses Output Extractor ───────────────────────────────────────

interface ResponseItem {
  type?: string;
  content?: Array<{ type?: string; text?: string }>;
  text?: string;
}

interface ResponseObject {
  output_text?: string | null;
  output?: unknown[];
  incomplete?: boolean | null;
  incomplete_details?: { reason?: string } | null;
  refusal?: unknown;
  refusal_details?: unknown;
}

function extractResponsesText(resp: ResponseObject): string {
  // First try direct output_text
  if (resp.output_text && resp.output_text.trim().length > 0) {
    return resp.output_text;
  }

  // Otherwise scan output array
  if (Array.isArray(resp.output)) {
    const texts: string[] = [];
    for (const rawItem of resp.output) {
      const item = rawItem as ResponseItem;
      // Handle output_text type
      if (item.type === "output_text" && item.text) {
        texts.push(item.text);
      }
      // Handle content items
      if (item.content && Array.isArray(item.content)) {
        for (const rawContent of item.content) {
          const content = rawContent as { type?: string; text?: string };
          if (content.text) {
            texts.push(content.text);
          }
        }
      }
    }
    if (texts.length > 0) {
      return texts.join("");
    }
  }

  // Check for incomplete/refusal
  if (resp.incomplete) {
    const reason = (resp.incomplete_details as { reason?: string } | null)?.reason ?? "unknown reason";
    throw new Error(`Positioning analysis incomplete: ${reason}`);
  }
  if (resp.refusal) {
    throw new Error("Positioning analysis refused: model refused to generate output");
  }

  return "";
}

// ─── Safe JSON Parser ───────────────────────────────────────────────────────

function extractJson(raw: string): string {
  // Strip markdown fences if present
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();

  // Extract first { ... } block
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) return raw.slice(start, end + 1);

  return raw;
}

function parsePositioningJson(raw: string): PositioningProfile {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed || trimmed.length === 0) {
    throw new Error("Positioning analysis returned an empty response. Try again or reduce job description length.");
  }

  const extracted = extractJson(trimmed);
  if (!extracted || extracted.length === 0) {
    throw new Error("Positioning analysis response contained no valid JSON. Please try again.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(extracted);
  } catch {
    throw new Error("Positioning analysis response was invalid JSON. Please try again.");
  }

  // Handle { profile: {...} } wrapper if present
  const data = (parsed as Record<string, unknown>)?.profile ?? parsed;

  if (!data || typeof data !== "object") {
    throw new Error("Positioning analysis returned invalid structure. Please try again.");
  }

  const d = data as Record<string, unknown>;

  // Coerce to PositioningProfile V1.5 with defaults
  const profile: PositioningProfile = {
    // Executive Summary
    recommendedTitle: typeof d.recommendedTitle === "string" ? d.recommendedTitle : "",
    recruiterHook: typeof d.recruiterHook === "string" ? d.recruiterHook : "",
    leadWith: Array.isArray(d.leadWith) ? d.leadWith.filter((x): x is string => typeof x === "string").slice(0, 3) : [],

    // Core Narrative
    primaryNarrative: typeof d.primaryNarrative === "string" ? d.primaryNarrative : "",

    // Risk & Response
    biggestRisk: typeof d.biggestRisk === "string" ? d.biggestRisk : "",
    riskResponse: typeof d.riskResponse === "string" ? d.riskResponse : "",

    // Supporting Evidence
    strengthsToEmphasize: Array.isArray(d.strengthsToEmphasize) ? d.strengthsToEmphasize.filter((x): x is string => typeof x === "string").slice(0, 3) : [],
    differentiators: Array.isArray(d.differentiators) ? d.differentiators.filter((x): x is string => typeof x === "string").slice(0, 3) : [],

    // Application Strategy
    cvStrategy: typeof d.cvStrategy === "string" ? d.cvStrategy : "",
    interviewStrategy: typeof d.interviewStrategy === "string" ? d.interviewStrategy : "",

    // Metadata
    confidence: typeof d.confidence === "number" ? Math.max(0, Math.min(100, d.confidence)) : 50,
  };

  return profile;
}

// ─── Logging Helper ─────────────────────────────────────────────────────────

function logTiming(label: string, startMs: number) {
  const elapsed = Date.now() - startMs;
  console.log(`[positioning/analyze] ${label}: ${elapsed}ms`);
}

// ─── Prompt Builder ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a strategic career advisor. Create an actionable positioning strategy.

MISSION: Give the candidate an immediate, clear action plan for this role.

OUTPUT STRUCTURE (STRICT):

A. EXECUTIVE SUMMARY (Most Important)
   - recommendedTitle: The exact role title to position for
   - recruiterHook: ONE sentence answering "Why interview this person?"
   - leadWith: EXACTLY 3 items. The 3 strongest pieces of evidence (projects/experiences)

B. CORE NARRATIVE
   - primaryNarrative: 1-2 sentences max. The positioning story.

C. RISK & RESPONSE (Actionable)
   - biggestRisk: ONE specific gap that could kill the candidacy
   - riskResponse: ONE sentence on how to address/deflect it

D. SUPPORTING EVIDENCE
   - strengthsToEmphasize: EXACTLY 3 items max
   - differentiators: EXACTLY 3 items max

E. APPLICATION STRATEGY
   - cvStrategy: 1-2 sentences on CV positioning
   - interviewStrategy: 1-2 sentences on interview approach

CONSTRAINTS (ABSOLUTE):
- Every list: MAX 3 items
- Every string: MAX 250 characters
- No paragraphs, no repetition
- No generic fluff. Be specific to this candidate and role.
- Do not invent experience.

OUTPUT FORMAT:
Return ONLY this JSON (no markdown, no prose):

{
  "profile": {
    "recommendedTitle": "string",
    "recruiterHook": "string - ONE compelling sentence",
    "leadWith": ["exactly 3 items"],
    "primaryNarrative": "string - 1-2 sentences",
    "biggestRisk": "string - ONE specific gap",
    "riskResponse": "string - ONE sentence response",
    "strengthsToEmphasize": ["max 3 items"],
    "differentiators": ["max 3 items"],
    "cvStrategy": "string - 1-2 sentences",
    "interviewStrategy": "string - 1-2 sentences",
    "confidence": 0-100
  }
}`;

// Aggressive context compression for <20s response time
const LIMITS = {
  jobDescription: 2500,    // Reduced from 4000
  experience: 800,         // Reduced from 1200
  projects: 500,          // Reduced from 800
  insightNarratives: 3,   // Reduced from 5
  insightThemes: 3,       // Reduced from 5
  fitSkills: 5,           // Reduced from 8
  fitProjects: 3,         // Reduced from 5
  fitGaps: 3,             // Reduced from 5
} as const;

function truncate(str: string | null | undefined, max: number): string {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "..." : str;
}

function take<T>(arr: T[] | null | undefined, max: number): T[] {
  if (!arr) return [];
  return arr.slice(0, max);
}

function buildPrompt(context: {
  job: { title: string | null; companyName: string | null; location: string | null; rawText: string | null };
  profile: { fullName: string | null; headline: string | null };
  resume: { summary: string | null; experience: string | null; projects: string | null; skills: string | null } | null;
  fitAnalysis: {
    recommendedAngle: string;
    jobFocus: string;
    matchingSkills: string[];
    matchingProjects: string[];
    strengths: string[];
    gaps: string[];
    confidenceScore: number;
    seniorityDetected: string;
  } | null;
  experienceInsights: Array<{
    company: string;
    role: string;
    transferableNarratives?: string[];
    workEnvironment?: string[];
    professionalThemes?: string[];
    metrics?: string[];
  }> | null;
}): string {
  const lines: string[] = [
    "## JOB",
    `Title: ${context.job.title ?? "Unknown"}`,
    `Company: ${context.job.companyName ?? "Unknown"}`,
    context.job.location ? `Location: ${context.job.location}` : "",
    truncate(context.job.rawText, LIMITS.jobDescription)
      ? `Description:\n${truncate(context.job.rawText, LIMITS.jobDescription)}`
      : "",
    "",
    "## CANDIDATE",
    `Name: ${context.profile.fullName ?? "Unknown"}`,
    `Headline: ${context.profile.headline ?? "Not specified"}`,
    context.resume?.summary ? `Summary: ${truncate(context.resume.summary, 400)}` : "",
    context.resume?.skills ? `Skills: ${truncate(context.resume.skills, 300)}` : "",
    "",
  ];

  // Condensed resume experience/projects
  const exp = truncate(context.resume?.experience, LIMITS.experience);
  const proj = truncate(context.resume?.projects, LIMITS.projects);
  if (exp || proj) {
    lines.push("## BACKGROUND");
    if (exp) lines.push(`Experience:\n${exp}`);
    if (proj) lines.push(`Projects:\n${proj}`);
    lines.push("");
  }

  // Compressed Fit Analysis
  if (context.fitAnalysis) {
    lines.push(
      "## FIT SUMMARY",
      `Angle: ${context.fitAnalysis.recommendedAngle}`,
      `Focus: ${context.fitAnalysis.jobFocus}`,
      `Seniority: ${context.fitAnalysis.seniorityDetected}`,
      `Match: ${context.fitAnalysis.confidenceScore}%`,
      `Skills: ${take(context.fitAnalysis.matchingSkills, LIMITS.fitSkills).join(", ")}`,
      `Projects: ${take(context.fitAnalysis.matchingProjects, LIMITS.fitProjects).join(", ")}`,
      `Gaps: ${take(context.fitAnalysis.gaps, LIMITS.fitGaps).join("; ")}`,
      ""
    );
  }

  // Compressed Experience Intelligence
  if (context.experienceInsights && context.experienceInsights.length > 0) {
    lines.push("## EXPERIENCE SIGNALS");
    for (const insight of context.experienceInsights.slice(0, 4)) {
      lines.push(`${insight.company} - ${insight.role}`);
      const narratives = take(insight.transferableNarratives, LIMITS.insightNarratives);
      const themes = take(insight.professionalThemes, LIMITS.insightThemes);
      if (narratives.length) lines.push(`  Narratives: ${narratives.join("; ")}`);
      if (themes.length) lines.push(`  Themes: ${themes.join(", ")}`);
      if (insight.metrics?.length) {
        lines.push(`  Metrics: ${insight.metrics.slice(0, 3).join("; ")}`);
      }
    }
    lines.push("");
  }

  lines.push(
    "## TASK",
    "Produce an ACTIONABLE positioning strategy.",
    "",
    'Return EXACTLY this JSON (no markdown, no prose):',
    '{"profile":{"recommendedTitle":"...","recruiterHook":"...","leadWith":["...","...","..."],"primaryNarrative":"...","biggestRisk":"...","riskResponse":"...","strengthsToEmphasize":["...","...","..."],"differentiators":["...","...","..."],"cvStrategy":"...","interviewStrategy":"...","confidence":0}}'
  );

  return lines.filter(Boolean).join("\n");
}

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const startMs = Date.now();
    const model = process.env.OPENAI_MODEL ?? "gpt-4o";
    const isGpt5 = model.startsWith("gpt-5") || model.startsWith("o");

    console.log(`[positioning/analyze] model: ${model}`);

    // Fetch all data in parallel
    const [job, profile, resume, experienceInsight, fitAnalysis] = await Promise.all([
      prisma.jobPosting.findUnique({
        where: { id },
        select: { id: true, title: true, companyName: true, location: true, rawText: true },
      }),
      prisma.userProfile.findFirst({
        orderBy: { createdAt: "asc" },
        select: { fullName: true, headline: true },
      }),
      prisma.resumeMaster.findFirst({
        orderBy: { createdAt: "asc" },
        select: {
          summary: true,
          experience: true,
          projects: true,
          skills: true,
        },
      }),
      prisma.experienceInsight.findFirst({
        orderBy: { createdAt: "asc" },
        select: { insights: true },
      }),
      prisma.fitAnalysis.findUnique({
        where: { jobPostingId: id },
        select: {
          recommendedAngle: true,
          jobFocus: true,
          matchingSkills: true,
          matchingProjects: true,
          strengths: true,
          gaps: true,
          confidenceScore: true,
          seniorityDetected: true,
        },
      }),
    ]);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
    }

    // Parse experience insights
    const rawInsights = experienceInsight?.insights;
    const experienceInsights = Array.isArray(rawInsights)
      ? (rawInsights as Array<{
          company: string;
          role: string;
          transferableNarratives?: string[];
          workEnvironment?: string[];
          professionalThemes?: string[];
          metrics?: string[];
        }>)
      : null;

    const prompt = buildPrompt({
      job,
      profile: profile ?? { fullName: null, headline: null },
      resume,
      fitAnalysis: fitAnalysis
        ? {
            recommendedAngle: fitAnalysis.recommendedAngle,
            jobFocus: fitAnalysis.jobFocus,
            matchingSkills: fitAnalysis.matchingSkills as string[],
            matchingProjects: fitAnalysis.matchingProjects as string[],
            strengths: fitAnalysis.strengths as string[],
            gaps: fitAnalysis.gaps as string[],
            confidenceScore: fitAnalysis.confidenceScore,
            seniorityDetected: fitAnalysis.seniorityDetected,
          }
        : null,
      experienceInsights,
    });

    console.log(`[positioning/analyze] input chars: ${prompt.length}`);

    const client = new OpenAI({ apiKey });

    // OpenAI structured output schemas
    // V1.5: Concise actionable schema
    const POSITIONING_SCHEMA = {
      type: "object",
      properties: {
        profile: {
          type: "object",
          properties: {
            // Executive Summary
            recommendedTitle: { type: "string" },
            recruiterHook: { type: "string" },
            leadWith: { type: "array", items: { type: "string" } },
            // Core Narrative
            primaryNarrative: { type: "string" },
            // Risk & Response
            biggestRisk: { type: "string" },
            riskResponse: { type: "string" },
            // Supporting Evidence
            strengthsToEmphasize: { type: "array", items: { type: "string" } },
            differentiators: { type: "array", items: { type: "string" } },
            // Application Strategy
            cvStrategy: { type: "string" },
            interviewStrategy: { type: "string" },
            // Metadata
            confidence: { type: "number" },
          },
          required: [
            "recommendedTitle",
            "recruiterHook",
            "leadWith",
            "primaryNarrative",
            "biggestRisk",
            "riskResponse",
            "strengthsToEmphasize",
            "differentiators",
            "cvStrategy",
            "interviewStrategy",
            "confidence",
          ],
          additionalProperties: false,
        },
      },
      required: ["profile"],
      additionalProperties: false,
    } as const;

    let rawOutput: string;

    try {
      if (isGpt5) {
        const resp = await client.responses.create({
          model,
          instructions: SYSTEM_PROMPT,
          input: prompt,
          text: {
            format: {
              type: "json_schema",
              name: "positioning_profile",
              schema: POSITIONING_SCHEMA,
              strict: true,
            },
          },
          max_output_tokens: 3500,
        });

        // Check for incomplete/truncated response
        const respAny = resp as unknown as Record<string, unknown>;
        const incompleteDetails = respAny.incomplete_details as { reason?: string } | undefined;
        if (incompleteDetails?.reason === "max_output_tokens") {
          throw new Error("Positioning analysis output was truncated. The profile requires more tokens to generate. Consider reducing context size or increasing token limit.");
        }

        rawOutput = extractResponsesText(resp as ResponseObject);
      } else {
        const resp = await client.chat.completions.create({
          model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          max_tokens: 2500,
          temperature: 0.3,
        });
        rawOutput = resp.choices[0]?.message?.content ?? "";
      }
    } catch (openAiError) {
      console.error("[positioning/analyze] OpenAI error:", openAiError);
      return NextResponse.json(
        { error: "Positioning analysis failed. The AI service may be temporarily unavailable. Please try again." },
        { status: 502 }
      );
    }

    console.log(`[positioning/analyze] output chars: ${rawOutput.length}`);
    console.log(`[positioning/analyze] empty output? ${!rawOutput || rawOutput.trim().length === 0}`);

    // Defensive parsing
    let profileJson: PositioningProfile;
    try {
      profileJson = parsePositioningJson(rawOutput);
    } catch (parseError) {
      console.error("[positioning/analyze] Parse error:", parseError);
      const message = parseError instanceof Error ? parseError.message : "Failed to parse positioning response";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    // Persist to database
    const record = await prisma.positioningProfile.upsert({
      where: { jobPostingId: job.id },
      create: {
        jobPostingId: job.id,
        profile: profileJson as unknown as Parameters<typeof prisma.positioningProfile.create>[0]['data']['profile'],
      },
      update: {
        profile: profileJson as unknown as Parameters<typeof prisma.positioningProfile.update>[0]['data']['profile'],
      },
    });

    logTiming("completed", startMs);

    return NextResponse.json({
      profile: record.profile as unknown as PositioningProfile,
      analyzedAt: record.updatedAt,
    });
  } catch (e) {
    console.error("[positioning/analyze]", e);
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

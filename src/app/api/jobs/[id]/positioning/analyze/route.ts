import { NextResponse } from "next/server";
import OpenAI from "openai";

import { prisma } from "@/lib/db";

export type PositioningProfile = {
  recommendedTitle: string;
  primaryNarrative: string;
  strengthsToEmphasize: string[];
  differentiators: string[];
  experiencesToLeadWith: string[];
  projectsToLeadWith: string[];
  gapsToAddress: string[];
  gapHandlingStrategy: string[];
  recruiterAngle: string;
  cvStrategy: string;
  coverLetterStrategy: string;
  screeningStrategy: string;
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

  // Coerce to PositioningProfile with defaults
  const profile: PositioningProfile = {
    recommendedTitle: typeof d.recommendedTitle === "string" ? d.recommendedTitle : "",
    primaryNarrative: typeof d.primaryNarrative === "string" ? d.primaryNarrative : "",
    strengthsToEmphasize: Array.isArray(d.strengthsToEmphasize) ? d.strengthsToEmphasize.filter((x): x is string => typeof x === "string") : [],
    differentiators: Array.isArray(d.differentiators) ? d.differentiators.filter((x): x is string => typeof x === "string") : [],
    experiencesToLeadWith: Array.isArray(d.experiencesToLeadWith) ? d.experiencesToLeadWith.filter((x): x is string => typeof x === "string") : [],
    projectsToLeadWith: Array.isArray(d.projectsToLeadWith) ? d.projectsToLeadWith.filter((x): x is string => typeof x === "string") : [],
    gapsToAddress: Array.isArray(d.gapsToAddress) ? d.gapsToAddress.filter((x): x is string => typeof x === "string") : [],
    gapHandlingStrategy: Array.isArray(d.gapHandlingStrategy) ? d.gapHandlingStrategy.filter((x): x is string => typeof x === "string") : [],
    recruiterAngle: typeof d.recruiterAngle === "string" ? d.recruiterAngle : "",
    cvStrategy: typeof d.cvStrategy === "string" ? d.cvStrategy : "",
    coverLetterStrategy: typeof d.coverLetterStrategy === "string" ? d.coverLetterStrategy : "",
    screeningStrategy: typeof d.screeningStrategy === "string" ? d.screeningStrategy : "",
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

const SYSTEM_PROMPT = `You are an elite recruiter, hiring manager, and career strategist.

Your job is NOT to evaluate the candidate. That has already been done by the Fit Analysis system.

Your job is to determine how the candidate should be positioned to maximize interview probability for this specific role.

Focus on:
- narrative framing
- transferable value
- strongest evidence
- recruiter psychology
- risk mitigation
- candidate differentiation

CONSTRAINTS:
- Do not invent experience.
- Do not invent achievements.
- Do not invent skills.
- Keep each list to 3-6 items maximum.
- Keep narrative fields concise (1-2 sentences).
- Do not produce long paragraphs.
- Return compact JSON only.

OUTPUT FORMAT:
Return ONLY a JSON object wrapped in a "profile" field:

{
  "profile": {
    "recommendedTitle": "string",
    "primaryNarrative": "string - 1-2 sentences max",
    "strengthsToEmphasize": ["string"],
    "differentiators": ["string"],
    "experiencesToLeadWith": ["string"],
    "projectsToLeadWith": ["string"],
    "gapsToAddress": ["string"],
    "gapHandlingStrategy": ["string"],
    "recruiterAngle": "string - one sentence",
    "cvStrategy": "string - 1-2 sentences",
    "coverLetterStrategy": "string - 1-2 sentences",
    "screeningStrategy": "string - 1-2 sentences",
    "confidence": 0-100
  }
}

RULES:
- Return ONLY the JSON object above
- No markdown, no code blocks, no prose
- All arrays must have 3-6 items
- All string fields must be non-empty
- Confidence must be a number 0-100`;

// Compressed context limits to reduce token usage
const LIMITS = {
  jobDescription: 4000,
  experience: 1200,
  projects: 800,
  insightNarratives: 5,
  insightThemes: 5,
  fitSkills: 8,
  fitProjects: 5,
  fitGaps: 5,
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
    "Produce a concise positioning strategy.",
    "",
    'Return EXACTLY this JSON (no markdown, no prose):',
    '{"profile":{"recommendedTitle":"...","primaryNarrative":"...","strengthsToEmphasize":["..."],"differentiators":["..."],"experiencesToLeadWith":["..."],"projectsToLeadWith":["..."],"gapsToAddress":["..."],"gapHandlingStrategy":["..."],"recruiterAngle":"...","cvStrategy":"...","coverLetterStrategy":"...","screeningStrategy":"...","confidence":0}}'
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
    // Wrapper schema for strict structured output (OpenAI requires root object)
    const POSITIONING_SCHEMA = {
      type: "object",
      properties: {
        profile: {
          type: "object",
          properties: {
            recommendedTitle: { type: "string" },
            primaryNarrative: { type: "string" },
            strengthsToEmphasize: { type: "array", items: { type: "string" } },
            differentiators: { type: "array", items: { type: "string" } },
            experiencesToLeadWith: { type: "array", items: { type: "string" } },
            projectsToLeadWith: { type: "array", items: { type: "string" } },
            gapsToAddress: { type: "array", items: { type: "string" } },
            gapHandlingStrategy: { type: "array", items: { type: "string" } },
            recruiterAngle: { type: "string" },
            cvStrategy: { type: "string" },
            coverLetterStrategy: { type: "string" },
            screeningStrategy: { type: "string" },
            confidence: { type: "number" },
          },
          required: [
            "recommendedTitle",
            "primaryNarrative",
            "strengthsToEmphasize",
            "differentiators",
            "experiencesToLeadWith",
            "projectsToLeadWith",
            "gapsToAddress",
            "gapHandlingStrategy",
            "recruiterAngle",
            "cvStrategy",
            "coverLetterStrategy",
            "screeningStrategy",
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
          max_output_tokens: 2500,
        });
        // TEMPORARY: Full inspection logging (remove before commit)
        const respAny = resp as unknown as Record<string, unknown>;
        console.log("[positioning/analyze] response keys:", Object.keys(respAny));
        console.log("[positioning/analyze] output_text:", JSON.stringify(respAny.output_text));
        console.log("[positioning/analyze] output:", JSON.stringify(respAny.output, null, 2).slice(0, 4000));
        console.log("[positioning/analyze] incomplete:", respAny.incomplete, respAny.incomplete_details);
        console.log("[positioning/analyze] refusal:", respAny.refusal, respAny.refusal_details);

        rawOutput = extractResponsesText(resp as ResponseObject);
      } else {
        const resp = await client.chat.completions.create({
          model,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          max_tokens: 2000,
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

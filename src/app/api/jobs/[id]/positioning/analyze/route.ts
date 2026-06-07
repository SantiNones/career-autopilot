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

const SYSTEM_PROMPT = `You are an elite recruiter, hiring manager, and career strategist.

Your job is not to evaluate the candidate.
That has already been done by the Fit Analysis system.

Your job is to determine how the candidate should be positioned to maximize interview probability for this specific role.

Focus on:
- narrative framing
- transferable value
- strongest evidence
- recruiter psychology
- risk mitigation
- candidate differentiation

Do not invent experience.
Do not invent achievements.
Do not invent skills.

Work only with the evidence provided.

The goal is to identify:
"What is the strongest truthful version of this candidate for this role?"

Return valid JSON only.`;

function buildPrompt(context: {
  job: { title: string | null; companyName: string | null; rawText: string | null };
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
  }> | null;
}): string {
  const lines: string[] = [
    "## JOB",
    `Title: ${context.job.title ?? "Unknown"}`,
    `Company: ${context.job.companyName ?? "Unknown"}`,
    context.job.rawText ? `Description:\n${context.job.rawText.slice(0, 3000)}` : "",
    "",
    "## CANDIDATE PROFILE",
    `Name: ${context.profile.fullName ?? "Unknown"}`,
    `Headline: ${context.profile.headline ?? "Not specified"}`,
    "",
    "## RESUME",
    context.resume?.summary ? `Summary:\n${context.resume.summary}` : "",
    context.resume?.skills ? `Skills:\n${context.resume.skills}` : "",
    context.resume?.experience ? `Experience:\n${context.resume.experience.slice(0, 2000)}` : "",
    context.resume?.projects ? `Projects:\n${context.resume.projects.slice(0, 1500)}` : "",
    "",
  ];

  if (context.fitAnalysis) {
    lines.push(
      "## FIT ANALYSIS (already computed)",
      `Recommended Angle: ${context.fitAnalysis.recommendedAngle}`,
      `Job Focus: ${context.fitAnalysis.jobFocus}`,
      `Seniority: ${context.fitAnalysis.seniorityDetected}`,
      `Confidence: ${context.fitAnalysis.confidenceScore}%`,
      `Matching Skills: ${context.fitAnalysis.matchingSkills.join(", ")}`,
      `Matching Projects: ${context.fitAnalysis.matchingProjects.join(", ")}`,
      `Strengths: ${context.fitAnalysis.strengths.join("; ")}`,
      `Gaps: ${context.fitAnalysis.gaps.join("; ")}`,
      ""
    );
  }

  if (context.experienceInsights && context.experienceInsights.length > 0) {
    lines.push("## EXPERIENCE INTELLIGENCE");
    for (const insight of context.experienceInsights) {
      lines.push(`Company: ${insight.company}`);
      lines.push(`Role: ${insight.role}`);
      if (insight.transferableNarratives?.length) {
        lines.push("Transferable Narratives:");
        insight.transferableNarratives.forEach((n) => lines.push(`- ${n}`));
      }
      if (insight.workEnvironment?.length) {
        lines.push("Work Environment:");
        insight.workEnvironment.forEach((w) => lines.push(`- ${w}`));
      }
      if (insight.professionalThemes?.length) {
        lines.push(`Professional Themes: ${insight.professionalThemes.join(", ")}`);
      }
      lines.push("");
    }
    lines.push("");
  }

  lines.push(
    "## YOUR TASK",
    "Generate a positioning strategy that maximizes interview probability.",
    "",
    "Return ONLY this JSON structure:",
    "{",
    '  "recommendedTitle": "string - the job title this candidate should present themselves as",',
    '  "primaryNarrative": "string - 2-3 sentence professional narrative",',
    '  "strengthsToEmphasize": ["string array - 4-6 key strengths to highlight"],',
    '  "differentiators": ["string array - 3-4 things that set this candidate apart"],',
    '  "experiencesToLeadWith": ["string array - which experiences to prioritize in CV/cover letter order"],',
    '  "projectsToLeadWith": ["string array - which projects to feature prominently"],',
    '  "gapsToAddress": ["string array - honest gaps that need handling"],',
    '  "gapHandlingStrategy": ["string array - how to frame/address each gap"],',
    '  "recruiterAngle": "string - one-sentence hook for recruiters",',
    '  "cvStrategy": "string - specific guidance for CV writing",',
    '  "coverLetterStrategy": "string - specific guidance for cover letter",',
    '  "screeningStrategy": "string - how to handle screening questions",',
    '  "confidence": number - 0-100, your confidence in this positioning',
    "}"
  );

  return lines.filter(Boolean).join("\n");
}

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;

    const [job, profile, resume, fitAnalysis] = await Promise.all([
      prisma.jobPosting.findUnique({
        where: { id },
        select: { id: true, title: true, companyName: true, rawText: true },
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
          experienceInsight: true,
        },
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

    // Parse experience insights from resume
    const rawInsights = resume?.experienceInsight?.insights;
    const experienceInsights = Array.isArray(rawInsights)
      ? (rawInsights as Array<{
          company: string;
          role: string;
          transferableNarratives?: string[];
          workEnvironment?: string[];
          professionalThemes?: string[];
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

    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL ?? "gpt-4o";
    const isGpt5 = model.startsWith("gpt-5") || model.startsWith("o");

    const POSITIONING_SCHEMA = {
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
    } as const;

    let profileJson: PositioningProfile;

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
        max_output_tokens: 4000,
      });
      const parsed = JSON.parse(resp.output_text ?? "{}") as PositioningProfile;
      profileJson = parsed;
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
      const content = resp.choices[0]?.message?.content ?? "{}";
      profileJson = JSON.parse(content) as PositioningProfile;
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

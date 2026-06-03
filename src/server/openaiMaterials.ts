import OpenAI from "openai";

type Profile = {
  fullName: string | null;
  headline: string | null;
  location: string | null;
  languages: unknown;
};

type Prefs = {
  targetTitles: unknown;
  targetSeniority: string | null;
};

type Resume = {
  summary: string | null;
  experience: string | null;
  projects: string | null;
  skills: string | null;
  education: string | null;
  languages: string | null;
  links: string | null;
};

type Evaluation = {
  label: string;
  totalScore: number;
  narrativeSuggestion: string | null;
};

type FitAnalysisInput = {
  recommendedAngle: string;
  jobFocus: string;
  matchingSkills: string[];
  matchingProjects: string[];
  strengths: string[];
  gaps: string[];
  confidenceScore: number;
  seniorityDetected: string;
};

type Job = {
  title: string | null;
  companyName: string | null;
  location: string | null;
  rawText: string | null;
};

type GeneratedMaterials = {
  tailoredCv: string;
  coverLetter: string;
  recruiterMessage: string;
  screeningAnswers: string;
};

// ─── Robust JSON extractor (handles markdown fences and surrounding text) ──────

function extractJson(raw: string): string {
  // Strip ```json ... ``` or ``` ... ``` fences
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch?.[1]) return fenceMatch[1].trim();

  // Extract first { ... } block
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start !== -1 && end > start) return raw.slice(start, end + 1);

  return raw;
}

function str(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return (v as unknown[]).filter((x) => typeof x === "string").join(", ");
  return String(v);
}

const SYSTEM_PROMPT = `You are an expert career writer producing job application materials for a candidate.

STRICT RULES — follow all of them:
- Use ONLY the candidate data provided. Never invent experience, employers, skills, projects, or dates.
- Tailor every material specifically to the target role and company.
- Prioritize relevance. Omit sections with no relevant data.
- Avoid keyword stuffing, giant bullet lists, and filler phrases ("focused on", "ability to", "passionate about", "team player").
- Avoid placeholders except [Add availability] and [Add salary expectation] for those two screening questions.
- Avoid internal notes, meta-commentary, and section headings that don't match the formats below.
- Tone: professional, human, and concise.
- Do not repeat identical sentences across materials.

OUTPUT: Return ONLY a single valid JSON object with exactly these four string keys:
tailoredCv, coverLetter, recruiterMessage, screeningAnswers.

────────────────────────────────────────
tailoredCv format (STRICT max 400 words, plain text):
  [Full name]
  [Single headline] · [Location] · [Languages if any]
  [Links if any]

  SUMMARY
  2 sentences maximum, role-specific.

  SKILLS
  Up to 3 role-relevant categories, max 5 items each.
  Format: CategoryName\n- item\n- item

  SELECTED PROJECTS
  Top 2 projects only.
  Format: Project Name\n• bullet\n• bullet (max 2 bullets per project)

  EXPERIENCE
  Max 2 roles. Format:
  Role Title
  Company | Dates
  • achievement (1 bullet only)

  EDUCATION
  Degree, Institution, Year (one line)

────────────────────────────────────────
coverLetter format (STRICT max 200 words, plain text):
  Dear [Company] Hiring Team,

  [2–3 short paragraphs: hook, why candidate fits, closing CTA]

  Best regards,
  [Name]

────────────────────────────────────────
recruiterMessage format (STRICT max 80 words, plain text):
  Hi,

  [1–2 sentences: who candidate is + best matching angle]
  [Links if available]
  [Clear CTA]

  Best,
  [Name]

────────────────────────────────────────
screeningAnswers format (plain text, Q&A):
  Q: Tell me about yourself.
  A: [2–3 sentences, specific to candidate and role]

  Q: Why are you interested in this role?
  A: [Specific, not generic]

  Q: What are your key strengths?
  A: [3 concrete strengths grounded in candidate data]

  Q: Describe a relevant project or achievement.
  A: [One specific project from provided data]

  Q: What is your availability / notice period?
  A: [Add availability]

  Q: What are your salary expectations?
  A: [Add salary expectation]

  Q: Any questions for us?
  A: [2–3 thoughtful questions about the role, team, or company]`;

export async function generateOpenAiMaterials(args: {
  profile: Profile;
  preferences: Prefs | null;
  resume: Resume | null;
  job: Job;
  evaluation: Evaluation | null;
  fitAnalysis: FitAnalysisInput | null;
}): Promise<GeneratedMaterials> {
  const { profile, preferences, resume, job, evaluation, fitAnalysis } = args;

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL ?? "gpt-4o";

  // ── Candidate block ──────────────────────────────────────────────────────────
  const candidateLines = [
    `Name: ${profile.fullName ?? "Not provided"}`,
    `Headline: ${profile.headline ?? "Not provided"}`,
    `Location: ${profile.location ?? "Not provided"}`,
    `Languages: ${str(profile.languages) || "Not provided"}`,
    preferences?.targetTitles ? `Target titles: ${str(preferences.targetTitles)}` : "",
    preferences?.targetSeniority ? `Target seniority: ${preferences.targetSeniority}` : "",
    resume?.links ? `Links:\n${resume.links}` : "",
  ].filter(Boolean);

  const candidateBlock = candidateLines.join("\n");

  // ── Resume block ─────────────────────────────────────────────────────────────
  const resumeParts = [
    resume?.summary ? `SUMMARY:\n${resume.summary}` : "",
    resume?.skills ? `SKILLS:\n${resume.skills}` : "",
    resume?.experience ? `EXPERIENCE:\n${resume.experience}` : "",
    resume?.projects ? `PROJECTS:\n${resume.projects}` : "",
    resume?.education ? `EDUCATION:\n${resume.education}` : "",
    resume?.languages ? `LANGUAGES:\n${resume.languages}` : "",
  ].filter(Boolean);

  const resumeBlock = resumeParts.join("\n\n");

  // ── Job block ────────────────────────────────────────────────────────────────
  const jobLines = [
    `Title: ${job.title ?? "Not specified"}`,
    `Company: ${job.companyName ?? "Not specified"}`,
    `Location: ${job.location ?? "Not specified"}`,
    job.rawText
      ? `Job description:\n${job.rawText.slice(0, 3000)}${job.rawText.length > 3000 ? "\n[truncated]" : ""}`
      : "",
  ].filter(Boolean);

  const jobBlock = jobLines.join("\n");

  // ── Fit block ────────────────────────────────────────────────────────────────
  const fitLines = fitAnalysis
    ? [
        `Job focus: ${fitAnalysis.jobFocus}`,
        `Recommended angle: ${fitAnalysis.recommendedAngle}`,
        `Matching skills: ${fitAnalysis.matchingSkills.join(", ")}`,
        fitAnalysis.matchingProjects.length
          ? `Matching projects: ${fitAnalysis.matchingProjects.join(", ")}`
          : "",
        fitAnalysis.strengths.length ? `Strengths: ${fitAnalysis.strengths.join("; ")}` : "",
        `Confidence: ${fitAnalysis.confidenceScore}%`,
        `Seniority detected: ${fitAnalysis.seniorityDetected}`,
      ].filter(Boolean)
    : [];

  const fitBlock = fitLines.join("\n");

  const evalBlock = evaluation
    ? `Fit score: ${evaluation.totalScore}/100 (${evaluation.label})${evaluation.narrativeSuggestion ? `\nNote: ${evaluation.narrativeSuggestion}` : ""}`
    : "";

  // ── Assemble user message ────────────────────────────────────────────────────
  const userContent = [
    "## CANDIDATE PROFILE",
    candidateBlock,
    "",
    "## MASTER RESUME",
    resumeBlock,
    "",
    "## TARGET JOB",
    jobBlock,
    ...(fitBlock ? ["", "## FIT ANALYSIS", fitBlock] : []),
    ...(evalBlock ? ["", "## EVALUATION", evalBlock] : []),
  ]
    .join("\n")
    .trim();

  // ── Call OpenAI ──────────────────────────────────────────────────────────────
  const isGpt5 = model.startsWith("gpt-5") || model.startsWith("o");

  const MATERIALS_SCHEMA = {
    type: "object",
    properties: {
      tailoredCv: { type: "string" },
      coverLetter: { type: "string" },
      recruiterMessage: { type: "string" },
      screeningAnswers: { type: "string" },
    },
    required: ["tailoredCv", "coverLetter", "recruiterMessage", "screeningAnswers"],
    additionalProperties: false,
  } as const;

  let raw: string;

  if (isGpt5) {
    // Responses API with json_schema strict — guaranteed valid JSON from GPT-5
    const resp = await client.responses.create({
      model,
      instructions: SYSTEM_PROMPT,
      input: userContent,
      text: {
        format: {
          type: "json_schema",
          name: "application_materials",
          schema: MATERIALS_SCHEMA,
          strict: true,
        },
      },
      max_output_tokens: 8000,
    });
    raw = resp.output_text ?? "{}";
    console.log(`[openai-materials] model:${model} source:responses-api length:${raw.length} endsWithBrace:${raw.trim().endsWith("}")}`)
    console.log(`[openai-materials] raw last 300: ${raw.slice(-300)}`);
  } else {
    // Chat Completions API for older models
    const resp = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      max_tokens: 3500,
      temperature: 0.35,
    });
    raw = resp.choices[0]?.message?.content ?? "{}";
    console.log(`[openai-materials] model:${model} source:chat-completions finish:${resp.choices[0]?.finish_reason ?? "?"} length:${raw.length} endsWithBrace:${raw.trim().endsWith("}")}`)
    console.log(`[openai-materials] raw last 300: ${raw.slice(-300)}`);
  }

  // ── Parse — strip markdown fences and extract JSON if needed ─────────────────
  const cleaned = extractJson(raw);

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    throw new Error(
      `OpenAI JSON parse failed — length:${raw.length} startsWithBrace:${raw.trim().startsWith("{")} endsWithBrace:${raw.trim().endsWith("}")} — last 300: ${raw.slice(-300)}`,
    );
  }

  // ── Per-field extraction — only throw if ALL are empty ────────────────────────
  const tailoredCv = typeof parsed.tailoredCv === "string" ? parsed.tailoredCv.trim() : "";
  const coverLetter = typeof parsed.coverLetter === "string" ? parsed.coverLetter.trim() : "";
  const recruiterMessage =
    typeof parsed.recruiterMessage === "string" ? parsed.recruiterMessage.trim() : "";
  const screeningAnswers =
    typeof parsed.screeningAnswers === "string" ? parsed.screeningAnswers.trim() : "";

  if (!tailoredCv && !coverLetter && !recruiterMessage && !screeningAnswers) {
    throw new Error("OpenAI returned materials with all fields empty");
  }

  return { tailoredCv, coverLetter, recruiterMessage, screeningAnswers };
}

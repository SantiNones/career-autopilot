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
tailoredCv format (~500–700 words, plain text):
  [Full name]
  [Single headline] · [Location] · [Languages if any]
  [Links if any]

  SUMMARY
  2–3 sentences, role-specific, no generic openers.

  SKILLS
  Up to 3 role-relevant categories, max 6 items each.
  Format: CategoryName\n- item\n- item

  SELECTED PROJECTS
  Top 2–3 projects with highest overlap to the role.
  Format per project: Project Name\n• bullet\n• bullet (max 3 bullets, ~1 sentence each)

  EXPERIENCE
  Max 3 roles. Format per role:
  Role Title
  Company | Dates
  • achievement (max 2 bullets)

  EDUCATION
  Degree, Institution, Year (if provided)

────────────────────────────────────────
coverLetter format (max 300 words, plain text):
  Dear [Company] Hiring Team,

  [3–4 short paragraphs: hook, why this role matches candidate's background, one specific project or achievement, closing CTA]

  Best regards,
  [Name]

────────────────────────────────────────
recruiterMessage format (max 120 words, plain text):
  [Greeting],

  [1–2 sentences: who the candidate is + their best matching angle for this role]
  [1 sentence: mention the most relevant project or skill]
  [Links if available]

  [Clear CTA sentence]

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
  const tokenParam = isGpt5
    ? { max_completion_tokens: 3500 }
    : { max_tokens: 3500 };

  const response = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    temperature: 0.35,
    ...tokenParam,
  });

  const raw = response.choices[0]?.message?.content ?? "{}";

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error("OpenAI returned invalid JSON");
  }

  const tailoredCv = typeof parsed.tailoredCv === "string" ? parsed.tailoredCv.trim() : "";
  const coverLetter = typeof parsed.coverLetter === "string" ? parsed.coverLetter.trim() : "";
  const recruiterMessage =
    typeof parsed.recruiterMessage === "string" ? parsed.recruiterMessage.trim() : "";
  const screeningAnswers =
    typeof parsed.screeningAnswers === "string" ? parsed.screeningAnswers.trim() : "";

  if (!tailoredCv || !coverLetter) {
    throw new Error("OpenAI returned incomplete materials");
  }

  return { tailoredCv, coverLetter, recruiterMessage, screeningAnswers };
}

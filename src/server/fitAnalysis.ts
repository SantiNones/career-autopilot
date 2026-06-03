import { prisma } from "@/lib/db";

// ─── Types ────────────────────────────────────────────────────────────────────

export type FitAnalysisResult = {
  strengths: string[];
  gaps: string[];
  matchingSkills: string[];
  matchingProjects: string[];
  recommendedAngle: string;
  companyType: string;
  jobFocus: string;
  seniorityDetected: string;
  confidenceScore: number;
};

type ProfileInput = {
  headline: string | null;
  location: string | null;
  languages: unknown;
  preferences: {
    positiveKeywords: unknown;
    targetTitles: unknown;
    targetSeniority: string | null;
  } | null;
};

type ResumeInput = {
  summary: string | null;
  experience: string | null;
  projects: string | null;
  skills: string | null;
  education: string | null;
  languages: string | null;
} | null;

type JobInput = {
  title: string | null;
  companyName: string | null;
  rawText: string | null;
};

// ─── Tech skills dictionary ───────────────────────────────────────────────────

const TECH_SKILLS: string[] = [
  "react", "vue", "angular", "svelte", "nextjs", "next.js", "nuxtjs",
  "typescript", "javascript", "python", "ruby", "java", "kotlin", "swift",
  "go", "golang", "rust", "php", "scala", "elixir", "c#", "c++",
  "node", "nodejs", "express", "fastapi", "django", "flask", "rails",
  "laravel", "spring", "nestjs", "hapi", "koa",
  "postgresql", "postgres", "mysql", "sqlite", "mongodb", "redis",
  "elasticsearch", "dynamodb", "firestore", "cassandra", "supabase",
  "aws", "azure", "gcp", "vercel", "netlify", "cloudflare", "heroku",
  "docker", "kubernetes", "terraform", "ansible", "jenkins",
  "github actions", "circleci", "gitlab ci",
  "graphql", "rest", "grpc", "websocket", "kafka", "rabbitmq", "sqs",
  "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
  "openai", "langchain", "llm", "gpt", "embeddings", "rag", "nlp",
  "tailwind", "tailwindcss", "css", "html", "sass", "webpack", "vite",
  "figma", "git", "linux", "bash", "sql", "nosql", "api",
  "microservices", "serverless", "ci/cd", "devops", "agile", "scrum",
  "n8n", "zapier", "airflow", "celery", "prisma", "drizzle",
  "stripe", "twilio", "sendgrid", "firebase", "planetscale",
  "redux", "zustand", "mobx", "rxjs", "jest", "cypress", "playwright",
  "storybook", "monorepo", "nx", "turborepo",
];

const TECH_SKILL_SET = new Set(TECH_SKILLS);

// ─── Helper: tokenize text to lowercase words ─────────────────────────────────

function tokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9.#+\s/-]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length >= 2),
  );
}

function strArr(v: unknown): string[] {
  if (!v) return [];
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string") as string[];
  if (typeof v === "string") return v.split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);
  return [];
}

// ─── Candidate keyword extraction ────────────────────────────────────────────

function candidateKeywords(profile: ProfileInput, resume: ResumeInput): Set<string> {
  const words = new Set<string>();

  const add = (text: string) => {
    for (const t of tokens(text)) words.add(t);
  };

  strArr(profile.preferences?.positiveKeywords).forEach(add);
  strArr(profile.preferences?.targetTitles).forEach(add);
  if (profile.headline) add(profile.headline);

  if (resume) {
    if (resume.skills) add(resume.skills);
    if (resume.experience) add(resume.experience);
    if (resume.summary) add(resume.summary);
  }

  return words;
}

// ─── Job keyword extraction ───────────────────────────────────────────────────

function jobKeywords(job: JobInput): Set<string> {
  return tokens(job.rawText ?? "");
}

// ─── Matching skills ──────────────────────────────────────────────────────────

function findMatchingSkills(jobToks: Set<string>, candidateToks: Set<string>): string[] {
  const matched: string[] = [];
  for (const skill of TECH_SKILLS) {
    const skillTok = skill.toLowerCase();
    if (jobToks.has(skillTok) && candidateToks.has(skillTok)) {
      matched.push(skill);
    }
  }
  return [...new Set(matched)];
}

// ─── Gaps: job tech skills NOT in candidate ───────────────────────────────────

function findGaps(jobToks: Set<string>, candidateToks: Set<string>): string[] {
  const gaps: string[] = [];
  for (const skill of TECH_SKILLS) {
    if (jobToks.has(skill) && !candidateToks.has(skill)) {
      gaps.push(skill);
    }
  }
  return gaps.slice(0, 10);
}

// ─── Strengths ────────────────────────────────────────────────────────────────

function buildStrengths(
  matchingSkills: string[],
  profile: ProfileInput,
  seniority: string,
  jobFocus: string,
): string[] {
  const strengths: string[] = [];

  if (matchingSkills.length > 0) {
    strengths.push(`Proficient in ${matchingSkills.slice(0, 5).join(", ")} — all required by this role`);
  }

  const profileSeniority = profile.preferences?.targetSeniority?.toLowerCase() ?? "";
  if (profileSeniority && seniority.toLowerCase() !== "unknown") {
    if (
      profileSeniority.includes(seniority.toLowerCase()) ||
      seniority.toLowerCase().includes(profileSeniority)
    ) {
      strengths.push(`Seniority level (${seniority}) aligns with role requirements`);
    }
  }

  const titles = strArr(profile.preferences?.targetTitles);
  if (titles.length > 0 && jobFocus !== "Unknown") {
    const titleMatch = titles.some((t) =>
      t.toLowerCase().includes(jobFocus.toLowerCase()) ||
      jobFocus.toLowerCase().includes(t.toLowerCase().split(" ")[0] ?? ""),
    );
    if (titleMatch) {
      strengths.push(`Target titles (${titles.slice(0, 2).join(", ")}) match job focus`);
    }
  }

  if (matchingSkills.length >= 5) {
    strengths.push(`Strong technical overlap — ${matchingSkills.length} matching skills detected`);
  }

  return strengths.slice(0, 6);
}

// ─── Matching projects ────────────────────────────────────────────────────────

function findMatchingProjects(resume: ResumeInput, jobToks: Set<string>): string[] {
  if (!resume?.projects) return [];

  const projectLines = resume.projects
    .split(/\n{2,}|\r\n\r\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (!projectLines.length) {
    const lines = resume.projects.split(/\n/).map((l) => l.trim()).filter(Boolean);
    return lines.slice(0, 3);
  }

  const scored = projectLines.map((proj) => {
    const projToks = tokens(proj);
    let score = 0;
    for (const skill of TECH_SKILL_SET) {
      if (jobToks.has(skill) && projToks.has(skill)) score++;
    }
    return { proj, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((x) => x.proj.split("\n")[0]?.slice(0, 120) ?? x.proj.slice(0, 120));
}

// ─── Company type detection ───────────────────────────────────────────────────

const COMPANY_TYPE_SIGNALS: Array<{ label: string; keywords: string[] }> = [
  { label: "Startup", keywords: ["startup", "early-stage", "seed", "series a", "series b", "founding team", "scale-up", "scaleup", "pre-ipo"] },
  { label: "Enterprise", keywords: ["enterprise", "fortune 500", "large-scale", "global company", "established", "multinational", "corporate"] },
  { label: "SaaS", keywords: ["saas", "software as a service", "b2b saas", "subscription", "platform", "cloud platform"] },
  { label: "Consulting", keywords: ["consulting", "consultancy", "client-facing", "agency", "professional services", "systems integrator"] },
];

function detectCompanyType(text: string): string {
  const lower = text.toLowerCase();
  for (const { label, keywords } of COMPANY_TYPE_SIGNALS) {
    if (keywords.some((k) => lower.includes(k))) return label;
  }
  return "Unknown";
}

// ─── Job focus detection ──────────────────────────────────────────────────────

const JOB_FOCUS_SIGNALS: Array<{ label: string; keywords: string[]; weight: number }> = [
  { label: "AI / ML", keywords: ["machine learning", "deep learning", "llm", "ai engineer", "ml engineer", "nlp", "computer vision", "pytorch", "tensorflow", "openai", "langchain"], weight: 3 },
  { label: "Full Stack", keywords: ["full stack", "fullstack", "full-stack", "frontend and backend", "end-to-end"], weight: 2 },
  { label: "Frontend", keywords: ["frontend", "front-end", "react developer", "vue developer", "angular developer", "ui engineer", "ui developer", "css", "html"], weight: 2 },
  { label: "Backend", keywords: ["backend", "back-end", "api developer", "server-side", "microservices", "database engineer"], weight: 2 },
  { label: "DevOps", keywords: ["devops", "infrastructure", "platform engineer", "sre", "site reliability", "kubernetes", "terraform", "ci/cd"], weight: 2 },
  { label: "Mobile", keywords: ["mobile developer", "ios developer", "android developer", "react native", "flutter", "swift", "kotlin"], weight: 3 },
  { label: "Data", keywords: ["data engineer", "data pipeline", "etl", "spark", "hadoop", "analytics engineer", "dbt"], weight: 3 },
  { label: "Automation", keywords: ["automation", "rpa", "workflow automation", "n8n", "zapier", "airflow", "process automation"], weight: 2 },
  { label: "Product", keywords: ["product manager", "product management", "roadmap", "product owner", "stakeholder management"], weight: 3 },
  { label: "Support", keywords: ["technical support", "customer success", "helpdesk", "support engineer", "customer support"], weight: 3 },
];

function detectJobFocus(text: string): string {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};
  for (const { label, keywords, weight } of JOB_FOCUS_SIGNALS) {
    let s = 0;
    for (const k of keywords) {
      if (lower.includes(k)) s += weight;
    }
    if (s > 0) scores[label] = s;
  }
  if (!Object.keys(scores).length) return "Software Engineering";
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0]![0];
}

// ─── Seniority detection ──────────────────────────────────────────────────────

const SENIORITY_SIGNALS: Array<{ label: string; keywords: string[] }> = [
  { label: "Lead", keywords: ["lead engineer", "principal", "staff engineer", "head of engineering", "engineering manager", "vp of engineering", "director of engineering", "team lead", "tech lead"] },
  { label: "Senior", keywords: ["senior", "sr.", "sr ", "5+ years", "6+ years", "7+ years", "8+ years", "experienced engineer"] },
  { label: "Mid", keywords: ["mid-level", "mid level", "intermediate", "3+ years", "4+ years", "2-4 years", "3-5 years"] },
  { label: "Junior", keywords: ["junior", "entry level", "entry-level", "0-2 years", "1+ year", "graduate", "new grad", "intern"] },
];

// Strong compound phrases that unambiguously mark a junior role — always win
const JUNIOR_STRONG = [
  "junior developer", "junior engineer", "junior software", "junior frontend", "junior backend",
  "entry-level developer", "entry-level engineer", "entry level developer", "entry level engineer",
  "graduate developer", "graduate engineer", "graduate position", "graduate role",
  "intern developer", "intern engineer", "internship", "trainee developer", "trainee engineer",
  "apprentice developer", "apprentice engineer", "new grad", "fresh graduate",
  "jr developer", "jr. developer", "jr engineer", "jr. engineer",
];

function detectSeniority(text: string): string {
  const lower = text.toLowerCase();

  // Strong junior compound signals win immediately
  if (JUNIOR_STRONG.some((s) => lower.includes(s))) return "Junior";

  // Scoring: accumulate all signal hits
  const scores: Record<string, number> = {};
  for (const { label, keywords } of SENIORITY_SIGNALS) {
    for (const k of keywords) {
      if (lower.includes(k)) scores[label] = (scores[label] ?? 0) + 1;
    }
  }

  // Junior gets a tie-breaking bonus to avoid false senior flags from incidental mentions
  if (scores["Junior"]) scores["Junior"] += 1;

  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return entries[0]?.[0] ?? "Mid";
}

// ─── Recommended angle ────────────────────────────────────────────────────────

function buildRecommendedAngle(
  profile: ProfileInput,
  jobFocus: string,
  seniority: string,
  matchingSkills: string[],
): string {
  const topSkill = matchingSkills[0] ?? "";
  const headline = profile.headline ?? "";

  if (headline) {
    const firstWord = headline.split(" ")[0] ?? "";
    return `${seniority !== "Unknown" ? seniority + " " : ""}${firstWord} ${jobFocus} Specialist`.trim();
  }

  if (topSkill) {
    const skillLabel = topSkill.charAt(0).toUpperCase() + topSkill.slice(1);
    return `${seniority !== "Unknown" ? seniority + " " : ""}${skillLabel} ${jobFocus} Engineer`.trim();
  }

  return `${seniority !== "Unknown" ? seniority + " " : ""}${jobFocus} Engineer`.trim();
}

// ─── Confidence score ─────────────────────────────────────────────────────────

function computeConfidence(
  matchingSkills: string[],
  jobToks: Set<string>,
  gaps: string[],
  hasProjects: boolean,
): number {
  const totalJobSkills = TECH_SKILLS.filter((s) => jobToks.has(s)).length;
  const matchRatio = totalJobSkills > 0 ? matchingSkills.length / totalJobSkills : 0;

  let score = Math.round(matchRatio * 60);
  if (hasProjects) score += 15;
  if (gaps.length < 3) score += 15;
  else if (gaps.length < 6) score += 8;

  return Math.min(95, Math.max(5, score));
}

// ─── Main analysis function ───────────────────────────────────────────────────

export function analyzeJobFit(
  job: JobInput,
  profile: ProfileInput,
  resume: ResumeInput,
): FitAnalysisResult {
  const jobToks = jobKeywords(job);
  const candidateToks = candidateKeywords(profile, resume);

  const matchingSkills = findMatchingSkills(jobToks, candidateToks);
  const gaps = findGaps(jobToks, candidateToks);
  const jobFocus = detectJobFocus(job.rawText ?? "");
  const seniority = detectSeniority(job.rawText ?? "");
  const companyType = detectCompanyType(job.rawText ?? "");
  const matchingProjects = findMatchingProjects(resume, jobToks);
  const strengths = buildStrengths(matchingSkills, profile, seniority, jobFocus);
  const recommendedAngle = buildRecommendedAngle(profile, jobFocus, seniority, matchingSkills);
  const confidenceScore = computeConfidence(matchingSkills, jobToks, gaps, matchingProjects.length > 0);

  return {
    strengths,
    gaps,
    matchingSkills,
    matchingProjects,
    recommendedAngle,
    companyType,
    jobFocus,
    seniorityDetected: seniority,
    confidenceScore,
  };
}

// ─── DB runner ────────────────────────────────────────────────────────────────

export async function saveFitAnalysis(jobId: string): Promise<void> {
  const [job, profile, resume] = await Promise.all([
    prisma.jobPosting.findUnique({ where: { id: jobId }, select: { id: true, title: true, companyName: true, rawText: true } }),
    prisma.userProfile.findFirst({ include: { preferences: true }, orderBy: { createdAt: "asc" } }),
    prisma.resumeMaster.findFirst({ orderBy: { createdAt: "asc" } }),
  ]);

  if (!job) return;

  const result = analyzeJobFit(
    job,
    profile ?? { headline: null, location: null, languages: [], preferences: null },
    resume,
  );

  await prisma.fitAnalysis.upsert({
    where: { jobPostingId: jobId },
    create: { jobPostingId: jobId, ...result },
    update: { ...result },
  });
}

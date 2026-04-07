import type { CandidatePreferences, UserProfile } from "@prisma/client";

type JobContext = {
  title?: string | null;
  companyName?: string | null;
  rawText?: string | null;
  sourceUrl: string;
};

function uniq(items: string[]) {
  return Array.from(new Set(items.map((s) => s.trim()).filter(Boolean)));
}

function pickRelevantSkills(text: string, prefs: CandidatePreferences | null): string[] {
  const base = ((prefs?.positiveKeywords as unknown as string[] | undefined) ?? []).slice();
  const t = (text ?? "").toLowerCase();
  const hits = base.filter((k) => t.includes(k.toLowerCase()));
  const essentials = ["JavaScript", "React", "HTML", "CSS", "Python", "PostgreSQL", "Git"];
  return uniq([...hits, ...essentials]).map((s) =>
    s
      .replace(/\bjs\b/i, "JavaScript")
      .replace(/\bts\b/i, "TypeScript")
      .replace(/^react$/i, "React"),
  );
}

export function generateTailoredResumeMarkdown(args: {
  profile: UserProfile;
  prefs: CandidatePreferences | null;
  job: JobContext;
}): string {
  const { profile, prefs, job } = args;

  const languages = (profile.languages as unknown as string[] | undefined) ?? [];
  const skills = pickRelevantSkills(job.rawText ?? "", prefs);

  const headline = profile.headline ?? "Junior Full-Stack Developer";
  const name = profile.fullName ?? "Candidate";
  const location = profile.location ?? "";

  const targetRole = job.title ?? "Role";
  const company = job.companyName ?? "Company";

  const summaryLines = [
    `${headline} focused on delivering end-to-end features with React and Python, with a pragmatic, AI-assisted workflow.`,
    `Applying for: ${targetRole} at ${company}.`,
  ];

  const projectBullets = [
    "Built and shipped full-stack features (UI + API + database) with React and Python/Flask.",
    "Worked with PostgreSQL and Git/GitHub workflows (branching, reviews, incremental delivery).",
    "Used AI-assisted development to speed up implementation while keeping code maintainable and testable.",
  ];

  const opsBullets = [
    "Experience in operational environments with KPIs, quality standards, and fast-paced execution.",
    "Strong written communication in English; used to support and stakeholder coordination.",
  ];

  const prefLineParts: string[] = [];
  if (prefs?.preferredWorkMode) prefLineParts.push(`Work mode: ${prefs.preferredWorkMode}`);
  if (prefs?.minNetEurPerMonth) prefLineParts.push(`Target: >= ${prefs.minNetEurPerMonth} EUR net/month`);

  return [
    `# ${name}`,
    location ? `**Location:** ${location}` : "",
    languages.length ? `**Languages:** ${languages.join(", ")}` : "",
    "",
    "## Target role",
    `- **Role:** ${targetRole}`,
    `- **Company:** ${company}`,
    `- **Job URL:** ${job.sourceUrl}`,
    "",
    "## Summary",
    ...summaryLines.map((l) => `- ${l}`),
    "",
    "## Skills (selected for this job)",
    ...skills.map((s) => `- ${s}`),
    "",
    "## Projects / Experience highlights",
    ...projectBullets.map((b) => `- ${b}`),
    "",
    "## Operational & support strengths",
    ...opsBullets.map((b) => `- ${b}`),
    "",
    prefLineParts.length ? "## Preferences" : "",
    prefLineParts.length ? `- ${prefLineParts.join(" | ")}` : "",
    "",
    "## Notes",
    "- This tailored CV is generated from your real profile and keywords; it does not claim unverified experience.",
  ]
    .filter((l) => l !== "")
    .join("\n");
}

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
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string").join(", ");
  return String(v);
}

// ─── Helper: pick the most relevant project blocks from master resume ─────────

function pickProjectBlocks(
  rawProjects: string,
  hints: string[],
  maxCount: number,
): string[] {
  if (!rawProjects.trim()) return [];

  const blocks = rawProjects
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  if (!blocks.length) {
    return rawProjects
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, maxCount * 3);
  }

  if (!hints.length) return blocks.slice(0, maxCount);

  const hintLower = hints.map((h) => h.toLowerCase().slice(0, 80));

  const scored = blocks.map((block) => {
    const bl = block.toLowerCase();
    let score = 0;
    for (const h of hintLower) {
      if (bl.includes(h.slice(0, 40))) score += 2;
      if (h.length > 20 && bl.includes(h.slice(0, 20))) score += 1;
    }
    return { block, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCount)
    .map((x) => x.block);
}

// ─── Tailored CV V2 ───────────────────────────────────────────────────────────

export function generateTailoredCvV2(args: {
  profile: Profile;
  prefs: Prefs | null;
  resume: Resume | null;
  job: Job;
  fitAnalysis: FitAnalysisInput;
}): string {
  const { profile, prefs, resume, job, fitAnalysis } = args;

  const name = candidateName(profile);
  const company = companyName(job);
  const title = jobTitle(job);
  const location = profile.location ?? job.location ?? "";
  const langStr = str(resume?.languages || profile.languages);
  const links = resume?.links?.trim() ?? "";
  const education = resume?.education?.trim() ?? "";

  // ── Headline: single clean title, never a list of target titles ──────────────
  const headline =
    profile.headline?.trim() ||
    fitAnalysis.recommendedAngle ||
    (prefs?.targetTitles ? (str(prefs.targetTitles).split(",")[0] ?? "").trim() : "") ||
    "Software Developer";

  // ── Skills: prioritise matching, cap at 16 ────────────────────────────────
  const rawSkillLines = (resume?.skills ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const matchLower = new Set(fitAnalysis.matchingSkills.map((s) => s.toLowerCase()));
  const prioritized: string[] = [];
  const secondary: string[] = [];
  for (const line of rawSkillLines) {
    if (matchLower.has(line.toLowerCase())) {
      prioritized.push(line);
    } else {
      secondary.push(line);
    }
  }
  for (const ms of fitAnalysis.matchingSkills) {
    if (!prioritized.some((p) => p.toLowerCase() === ms.toLowerCase())) {
      prioritized.push(ms);
    }
  }
  const selectedSkills = [...prioritized, ...secondary].slice(0, 16);
  const skillsBlock =
    selectedSkills.length > 0
      ? selectedSkills.join(" · ")
      : fitAnalysis.matchingSkills.slice(0, 12).join(" · ");

  // ── Summary: master summary (trimmed) + role-specific hook ───────────────
  const masterSummary = resume?.summary?.trim() ?? "";
  const seniority =
    fitAnalysis.seniorityDetected && fitAnalysis.seniorityDetected !== "Mid"
      ? fitAnalysis.seniorityDetected + " "
      : "";
  let summary: string;
  if (masterSummary) {
    const sentences = masterSummary.split(/(?<=[.!?])\s+/);
    const base = sentences.slice(0, 4).join(" ");
    const hook =
      fitAnalysis.strengths[0] ??
      `Applying for the ${title} role at ${company}, with a focus on ${fitAnalysis.jobFocus}.`;
    summary = `${base}\n\n${hook}`;
  } else {
    const techLine =
      fitAnalysis.matchingSkills.length > 0
        ? ` Strong skills in ${fitAnalysis.matchingSkills.slice(0, 5).join(", ")}.`
        : "";
    summary =
      `${seniority}${fitAnalysis.jobFocus} developer with hands-on experience building production systems.${techLine}\n\n` +
      `Applying for the ${title} role at ${company}.`;
  }

  // ── Projects: most relevant blocks from resume ────────────────────────────
  const projectBlocks = pickProjectBlocks(
    resume?.projects ?? "",
    fitAnalysis.matchingProjects,
    4,
  );
  const projectsText =
    projectBlocks.length > 0
      ? projectBlocks.join("\n\n")
      : fitAnalysis.matchingProjects.length > 0
        ? fitAnalysis.matchingProjects.slice(0, 4).map((p, i) => `${i + 1}. ${p}`).join("\n\n")
        : "[Add your most relevant projects here.]";

  // ── Experience: concise (first 20 non-empty lines) ────────────────────────
  const expLines = (resume?.experience ?? "")
    .split("\n")
    .filter((l) => l.trim().length > 0);
  const conciseExp = expLines.slice(0, 20).join("\n") || "[Add your professional experience.]";

  // ── Fit note ──────────────────────────────────────────────────────────────
  const fitNote =
    fitAnalysis.confidenceScore > 0
      ? `Fit: ${fitAnalysis.confidenceScore}% · ${fitAnalysis.jobFocus}`
      : `Focus: ${fitAnalysis.jobFocus}`;

  return [
    name,
    `${headline}${location ? ` · ${location}` : ""}${langStr ? ` · ${langStr}` : ""}`,
    ...(links ? [links] : []),
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "TARGET ROLE",
    `${title} @ ${company}`,
    fitNote,
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "SUMMARY",
    summary,
    "",
    "RELEVANT SKILLS",
    skillsBlock,
    "",
    "SELECTED PROJECTS",
    projectsText,
    "",
    "PROFESSIONAL EXPERIENCE",
    conciseExp,
    "",
    "EDUCATION",
    education || "[Add your education.]",
    ...(langStr ? ["", "LANGUAGES", langStr] : []),
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "Generated from saved profile, master resume, job posting and fit analysis. Review before sending.",
  ]
    .join("\n")
    .trim();
}

function jobTitle(job: Job): string {
  return job.title ?? "this position";
}

function companyName(job: Job): string {
  return job.companyName ?? "the company";
}

function candidateName(profile: Profile): string {
  return profile.fullName ?? "Candidate";
}

export function generateMaterials(
  job: Job,
  profile: Profile,
  prefs: Prefs | null,
  resume: Resume | null,
  evaluation: Evaluation | null,
  fitAnalysis: FitAnalysisInput | null = null,
): GeneratedMaterials {
  const name = candidateName(profile);
  const title = jobTitle(job);
  const company = companyName(job);
  const headline = profile.headline ?? str(prefs?.targetTitles);
  const location = profile.location ?? job.location ?? "";
  const languages = str(resume?.languages || profile.languages);
  const seniority = prefs?.targetSeniority ?? "";

  const summary = resume?.summary?.trim() ?? "";
  const experience = resume?.experience?.trim() ?? "";
  const projects = resume?.projects?.trim() ?? "";
  const skills = resume?.skills?.trim() ?? "";
  const education = resume?.education?.trim() ?? "";
  const links = resume?.links?.trim() ?? "";

  const scoreNote =
    evaluation
      ? `[Fit score: ${evaluation.totalScore}/100 · ${evaluation.label}]`
      : "";

  // ─── Tailored CV ────────────────────────────────────────────────────────────

  const tailoredCv = fitAnalysis
    ? generateTailoredCvV2({ profile, prefs, resume, job, fitAnalysis })
    : `${name}
${headline}${location ? ` · ${location}` : ""}${languages ? ` · ${languages}` : ""}
${links ? links : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TARGET ROLE: ${title} @ ${company}
${scoreNote}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY
${summary || `${seniority ? seniority + " " : ""}professional with experience in ${headline || "the relevant domain"}.`}

EXPERIENCE
${experience || "[Add your experience from your master resume.]"}

${projects ? `PROJECTS\n${projects}\n\n` : ""}SKILLS
${skills || "[Add your skills from your master resume.]"}

EDUCATION
${education || "[Add your education from your master resume.]"}

${languages ? `LANGUAGES\n${languages}\n` : ""}`.trim();

  // ─── Cover Letter ────────────────────────────────────────────────────────────

  const coverLetter = `Dear ${company} Hiring Team,

I am writing to express my interest in the ${title} role at ${company}.

${summary || `As a ${seniority ? seniority + " " : ""}professional${headline ? " specialising in " + headline : ""}, I bring a strong foundation and a track record of delivering results.`}

${experience ? `My background includes:\n\n${experience.split("\n").slice(0, 8).join("\n")}` : "My professional background aligns well with the requirements of this role."}

${skills ? `My core skills include: ${skills.split("\n").slice(0, 3).join("; ")}.` : ""}

${evaluation?.narrativeSuggestion ? evaluation.narrativeSuggestion : `I am confident that my experience and skills make me a strong candidate for this position.`}

I would welcome the opportunity to discuss how my background aligns with the needs of your team.

Best regards,
${name}
${links ? links.split("\n")[0] : ""}`.trim();

  // ─── Recruiter Message ───────────────────────────────────────────────────────

  const recruiterMessage = `Hi,

I came across the ${title} opening at ${company} and wanted to reach out directly.

I'm ${name}${headline ? `, a ${headline}` : ""}${location ? ` based in ${location}` : ""}. ${
    summary
      ? summary.split(".")[0] + "."
      : `I have experience in ${headline || "this space"} and believe I could be a strong match.`
  }

${skills ? `My core skills: ${skills.split("\n").slice(0, 4).join(", ")}.` : ""}

${links ? `More about my work: ${links.split("\n")[0]}` : ""}

Would you be open to a brief conversation?

Best,
${name}`.trim();

  // ─── Screening Answers ───────────────────────────────────────────────────────

  const screeningAnswers = `SCREENING QUESTIONS — ${title} @ ${company}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Q: Tell me about yourself.
A: ${summary || `I'm ${name}${headline ? ", a " + headline : ""}${location ? ", based in " + location : ""}. I specialise in ${headline || "my field"} and have a background in ${experience ? experience.split("\n")[0] : "the relevant domain"}.`}

Q: Why are you interested in this role?
A: The ${title} role at ${company} aligns closely with my background in ${headline || "this area"}. ${evaluation?.narrativeSuggestion ? evaluation.narrativeSuggestion.split(".")[0] + "." : "I believe my experience and skills are a strong match for what you're looking for."}

Q: What are your key strengths?
A: ${skills ? skills.split("\n").slice(0, 3).join("; ") + "." : "I bring strong analytical skills, attention to detail, and a collaborative working style."}

Q: Describe a relevant project or achievement.
A: ${projects ? projects.split("\n")[0] : experience ? experience.split("\n")[0] : "[Add a specific achievement from your experience.]"}

Q: What is your availability / notice period?
A: [Add your current availability and notice period.]

Q: What are your salary expectations?
A: [Add salary expectations based on your preferences.]

Q: Any questions for us?
A: I'd love to learn more about the team structure, the biggest challenges in this role, and how success is measured in the first 6 months.`.trim();

  return { tailoredCv, coverLetter, recruiterMessage, screeningAnswers };
}

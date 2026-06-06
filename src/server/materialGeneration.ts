type Profile = {
  fullName: string | null;
  headline: string | null;
  location: string | null;
  phone: string | null;
  email: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
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

// ─── Role-specific summary templates ─────────────────────────────────────────

const ROLE_FOCUS_TEMPLATES: Array<{ keys: string[]; opener: string }> = [
  {
    keys: ["frontend", "front-end", "front end", "react developer", "vue", "angular", "ui developer", "interface"],
    opener: "Frontend developer building responsive, accessible interfaces with modern component frameworks.",
  },
  {
    keys: ["backend", "back-end", "back end", "api developer", "server-side"],
    opener: "Backend developer designing robust APIs, data pipelines, and server-side systems.",
  },
  {
    keys: ["full-stack", "fullstack", "full stack"],
    opener: "Full-stack developer delivering end-to-end features across frontend and backend.",
  },
  {
    keys: ["support", "customer support", "technical support", "helpdesk", "service desk"],
    opener: "Technical support specialist bridging users and engineering teams to resolve issues efficiently.",
  },
  {
    keys: ["automation", "workflow", "rpa", "n8n", "zapier", "ai automation", "process"],
    opener: "Automation specialist streamlining business workflows with code, APIs, and AI-assisted tooling.",
  },
  {
    keys: ["devops", "sre", "infrastructure", "cloud engineer", "platform engineer"],
    opener: "DevOps engineer managing infrastructure, CI/CD pipelines, and cloud deployment environments.",
  },
  {
    keys: ["data", "analytics", "machine learning", "data engineer", "ml engineer"],
    opener: "Data-focused developer building analytical pipelines and data-driven product features.",
  },
  {
    keys: ["mobile", "ios", "android", "react native", "flutter"],
    opener: "Mobile developer building cross-platform and native applications for iOS and Android.",
  },
];

function pickRoleOpener(jobFocus: string, matchingSkills: string[]): string {
  const needle = `${jobFocus} ${matchingSkills.join(" ")}`.toLowerCase();
  for (const { keys, opener } of ROLE_FOCUS_TEMPLATES) {
    if (keys.some((k) => needle.includes(k))) return opener;
  }
  return "Software developer building production systems with a pragmatic, end-to-end approach.";
}

function buildRoleSummary(
  resume: Resume | null,
  fitAnalysis: FitAnalysisInput,
): string {
  const masterSummary = resume?.summary?.trim() ?? "";
  const seniority =
    fitAnalysis.seniorityDetected && fitAnalysis.seniorityDetected !== "Mid"
      ? `${fitAnalysis.seniorityDetected} `
      : "";

  const topSkills = fitAnalysis.matchingSkills.slice(0, 4);
  const skillPhrase = topSkills.length > 0 ? `Skilled in ${topSkills.join(", ")}.` : "";

  // Use first 2 sentences of master summary when it's substantial
  if (masterSummary.length > 80) {
    const sentences = masterSummary.split(/(?<=[.!?])\s+/);
    const base = sentences.slice(0, 2).join(" ").trim();
    return skillPhrase ? `${base} ${skillPhrase}` : base;
  }

  const opener = pickRoleOpener(fitAnalysis.jobFocus, fitAnalysis.matchingSkills);

  // Only include a strength if it's substantive, not an internal note
  const strength = fitAnalysis.strengths.find(
    (s) =>
      s.length > 20 &&
      !s.toLowerCase().startsWith("clarify") &&
      !s.toLowerCase().startsWith("note:"),
  );
  const strengthLine = strength ? ` ${strength}.` : "";

  return `${seniority}${opener} ${skillPhrase}${strengthLine}`.trim();
}

// ─── Generic phrase scrubber ─────────────────────────────────────────────────

const PHRASE_SUBS: Array<[RegExp, string]> = [
  [/\bfocused on\b/gi, "specialising in"],
  [/\bpassionate about\b/gi, "experienced in"],
  [/\bability to\b/gi, "experience"],
  [/\bproduct.oriented mindset\b/gi, ""],
  [/\bhighly motivated\b/gi, ""],
  [/\bteam player\b/gi, ""],
  [/\bself.starter\b/gi, ""],
];

function scrubGenericPhrases(text: string): string {
  let s = text;
  for (const [pattern, replacement] of PHRASE_SUBS) {
    s = s.replace(pattern, replacement);
  }
  return s.replace(/  +/g, " ").replace(/ ([.,])/g, "$1").trim();
}

// ─── Compact project block: name + max 3 bullets ─────────────────────────────

function compactProjectBlock(block: string): string {
  const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return "";

  const name = lines[0].replace(/^[#*•·\-]\s*/, "").trim();
  const rest = lines.slice(1);
  const bullets: string[] = [];

  for (const line of rest) {
    if (bullets.length >= 3) break;
    const isBullet = /^[-•*·]/.test(line);
    const content = line.replace(/^[-•*·]\s*/, "").trim();
    if (content.length < 20) continue;

    if (isBullet) {
      const sentence = content.split(/(?<=[.!?])\s+/)[0] ?? content;
      const trimmed = sentence.length > 120 ? sentence.slice(0, 117) + "..." : sentence;
      bullets.push(`• ${trimmed}`);
    } else {
      // Prose — split into sentences, each becomes a bullet
      const sentences = content.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20);
      for (const sentence of sentences) {
        if (bullets.length >= 3) break;
        const trimmed = sentence.length > 120 ? sentence.slice(0, 117) + "..." : sentence;
        bullets.push(`• ${trimmed}`);
      }
    }
  }

  if (!bullets.length) return name;
  return `${name}\n${bullets.join("\n")}`;
}

// ─── Compact experience: max 3 roles × 2 bullets each ────────────────────────

function compactExperience(rawExp: string): string {
  if (!rawExp.trim()) return "";

  const blocks = rawExp.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  const source = blocks.length > 0 ? blocks : [rawExp];

  const compacted = source
    .slice(0, 3)
    .map((block) => {
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      if (!lines.length) return "";

      const title = lines[0];
      // Detect a company/date subtitle: contains | or – or a 4-digit year
      const hasSubtitle =
        lines.length > 1 && /[|–\-]|\b(20\d{2}|19\d{2})\b/.test(lines[1] ?? "");
      const subtitle = hasSubtitle ? lines[1] : null;
      const bodyStart = hasSubtitle ? 2 : 1;

      const bullets: string[] = [];
      for (const line of lines.slice(bodyStart)) {
        if (bullets.length >= 2) break;
        const cleaned = line.replace(/^[-•*·]\s*/, "").trim();
        if (cleaned.length < 15) continue;
        const sentence = cleaned.split(/(?<=[.!?])\s+/)[0] ?? cleaned;
        const trimmed = sentence.length > 120 ? sentence.slice(0, 117) + "..." : sentence;
        bullets.push(`• ${trimmed}`);
      }

      const parts = [title];
      if (subtitle) parts.push(subtitle);
      bullets.forEach((b) => parts.push(b));
      return parts.join("\n");
    })
    .filter(Boolean);

  return compacted.join("\n\n");
}

// ─── Role-priority category ordering ─────────────────────────────────────────

const ROLE_CATEGORY_PRIORITY: Record<string, string[]> = {
  frontend: ["Frontend", "Tools", "Cloud & DevOps"],
  "front-end": ["Frontend", "Tools"],
  backend: ["Backend", "Database", "Tools"],
  "back-end": ["Backend", "Database", "Tools"],
  "full-stack": ["Frontend", "Backend", "Tools"],
  fullstack: ["Frontend", "Backend", "Tools"],
  support: ["Tools", "Backend", "Other"],
  automation: ["Backend", "Tools", "Cloud & DevOps"],
  devops: ["Cloud & DevOps", "Backend", "Tools"],
  data: ["Database", "Backend", "Tools"],
  mobile: ["Frontend", "Tools", "Backend"],
};

function prioritizeCategories(
  groups: Array<[string, string[]]>,
  jobFocus: string,
): Array<[string, string[]]> {
  const focus = jobFocus.toLowerCase();
  let priority: string[] | null = null;
  for (const [key, cats] of Object.entries(ROLE_CATEGORY_PRIORITY)) {
    if (focus.includes(key)) {
      priority = cats;
      break;
    }
  }
  if (!priority) return groups;

  const prioritySet = new Set(priority);
  return [
    ...priority
      .map((p) => groups.find(([name]) => name === p))
      .filter((g): g is [string, string[]] => g !== undefined),
    ...groups.filter(([name]) => !prioritySet.has(name)),
  ];
}

// ─── Skills: grouped sections ─────────────────────────────────────────────────

const SKILL_CATEGORY_MAP: Array<{ name: string; keywords: string[] }> = [
  {
    name: "Frontend",
    keywords: [
      "react", "vue", "angular", "svelte", "typescript", "javascript", "html", "css",
      "next.js", "nuxt", "tailwind", "webpack", "vite", "redux", "zustand", "sass",
      "scss", "storybook", "jest", "testing library",
    ],
  },
  {
    name: "Backend",
    keywords: [
      "python", "node.js", "node", "express", "flask", "django", "fastapi", "ruby",
      "rails", "java", "spring", "php", "go", "rust", "c#", ".net", "nestjs",
      "graphql", "rest", "api",
    ],
  },
  {
    name: "Database",
    keywords: [
      "postgresql", "postgres", "mysql", "mongodb", "redis", "sqlite", "sql",
      "prisma", "supabase", "firebase", "dynamodb", "elasticsearch",
    ],
  },
  {
    name: "Cloud & DevOps",
    keywords: [
      "aws", "gcp", "azure", "docker", "kubernetes", "terraform", "ci/cd",
      "github actions", "gitlab ci", "vercel", "netlify", "linux", "bash", "nginx",
    ],
  },
  {
    name: "Tools",
    keywords: [
      "git", "github", "gitlab", "figma", "jira", "notion", "postman",
      "vscode", "zsh", "slack", "trello", "confluence",
    ],
  },
];

function buildSkillsSection(
  rawSkills: string,
  matchingSkills: string[],
  jobFocus: string,
): string {
  if (!rawSkills.trim() && !matchingSkills.length) return "";

  const lines = rawSkills.split("\n").map((l) => l.trim()).filter(Boolean);

  // Detect "Category: skill1, skill2, ..." format
  const hasCategoryFormat = lines.some((l) => /^[A-Za-z][A-Za-z\s&/]{1,25}:\s*.+/.test(l));

  if (hasCategoryFormat) {
    const categories: Array<[string, string[]]> = [];
    for (const line of lines) {
      const m = line.match(/^([A-Za-z][A-Za-z\s&/]{1,25}):\s*(.+)$/);
      if (m) {
        const cat = m[1].trim();
        const skills = m[2]
          .split(/[,;|]/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (skills.length > 0) categories.push([cat, skills]);
      }
    }
    if (categories.length > 0) {
      return prioritizeCategories(categories, jobFocus)
        .slice(0, 3)
        .map(([cat, skills]) =>
          `${cat}\n${skills.slice(0, 6).map((s) => `- ${s}`).join("\n")}`,
        )
        .join("\n\n");
    }
  }

  // Flat list — bucket into known categories by keyword match
  const assigned = new Set<string>();
  const groups: Array<[string, string[]]> = [];

  for (const { name, keywords } of SKILL_CATEGORY_MAP) {
    const matched = lines.filter((s) => {
      const sl = s.toLowerCase();
      return keywords.some((k) => sl === k || sl.startsWith(k)) && !assigned.has(s);
    });
    if (matched.length > 0) {
      matched.forEach((s) => assigned.add(s));
      groups.push([name, matched.slice(0, 6)]);
    }
  }

  const unassigned = lines.filter((s) => !assigned.has(s));
  if (unassigned.length > 0) groups.push(["Other", unassigned.slice(0, 6)]);

  if (!groups.length) {
    const fallback = [...new Set([...matchingSkills.slice(0, 8), ...lines.slice(0, 8)])];
    return fallback.map((s) => `- ${s}`).join("\n");
  }

  return prioritizeCategories(groups, jobFocus)
    .slice(0, 3)
    .map(([cat, catSkills]) => `${cat}\n${catSkills.map((s) => `- ${s}`).join("\n")}`)
    .join("\n\n");
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
  const location = profile.location ?? job.location ?? "";
  const langStr = str(resume?.languages || profile.languages);
  const education = resume?.education?.trim() ?? "";

  // ── Headline: first segment only — never a pipe-separated list ────────────
  const rawHeadline = profile.headline?.trim() ?? "";
  const headline =
    rawHeadline.split(/[|,\/\\]/).map((s) => s.trim()).filter(Boolean)[0] ||
    fitAnalysis.recommendedAngle ||
    str(prefs?.targetTitles).split(",")[0]?.trim() ||
    "Software Developer";

  // ── Contact line: location · phone · email ────────────────────────────────
  const contactParts = [
    location,
    profile.phone?.trim() ?? "",
    profile.email?.trim() ?? "",
  ].filter(Boolean);
  const contactLine = contactParts.join(" · ");

  // ── Links line: label-based (LinkedIn · GitHub · Portfolio) ───────────────
  const linkLabels: string[] = [];
  if (profile.linkedinUrl?.trim()) linkLabels.push(`LinkedIn: ${profile.linkedinUrl.trim()}`);
  if (profile.githubUrl?.trim()) linkLabels.push(`GitHub: ${profile.githubUrl.trim()}`);
  if (profile.portfolioUrl?.trim()) linkLabels.push(`Portfolio: ${profile.portfolioUrl.trim()}`);
  // Fall back to resume links if no structured profile links
  if (!linkLabels.length && resume?.links?.trim()) {
    resume.links.trim().split("\n").filter(Boolean).forEach((l) => linkLabels.push(l));
  }
  const linksLine = linkLabels.join("\n");

  // ── Summary: role-specific, generic phrases scrubbed ─────────────────────
  const summary = scrubGenericPhrases(buildRoleSummary(resume, fitAnalysis));

  // ── Skills: role-prioritised, max 3 categories × 6 items ─────────────────
  const skillsSection = buildSkillsSection(
    resume?.skills ?? "",
    fitAnalysis.matchingSkills,
    fitAnalysis.jobFocus,
  );

  // ── Projects: top 2, compact bullet format (max 3 bullets each) ──────────
  const projectBlocks = pickProjectBlocks(
    resume?.projects ?? "",
    [...fitAnalysis.matchingProjects, ...fitAnalysis.matchingSkills],
    2,
  )
    .map(compactProjectBlock)
    .filter(Boolean);

  // ── Experience: max 3 roles, max 2 bullets each ───────────────────────────
  const expSection = compactExperience(resume?.experience ?? "");

  // ── Assemble — double blank lines between sections for readability ─────────
  const parts: string[] = [];

  parts.push(name);
  parts.push(headline);
  if (contactLine) parts.push(contactLine);
  if (linksLine) parts.push(linksLine);

  parts.push("", "");
  parts.push("SUMMARY");
  parts.push(summary);

  if (skillsSection) {
    parts.push("", "");
    parts.push("SKILLS");
    parts.push(skillsSection);
  }

  if (projectBlocks.length > 0) {
    parts.push("", "");
    parts.push("SELECTED PROJECTS");
    parts.push(projectBlocks.join("\n\n"));
  }

  if (expSection) {
    parts.push("", "");
    parts.push("EXPERIENCE");
    parts.push(expSection);
  }

  if (education) {
    parts.push("", "");
    parts.push("EDUCATION");
    parts.push(education);
  }

  if (langStr) {
    parts.push("", "");
    parts.push("LANGUAGES");
    parts.push(langStr);
  }

  return parts.join("\n").trim();
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

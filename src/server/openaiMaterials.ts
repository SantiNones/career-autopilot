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
// Needed because even strict json_schema mode can occasionally return fenced output.

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

// ─── Narrative Analysis ───────────────────────────────────────────────────────
// Deterministic pre-processing layer that runs before the GPT call.
// It distils the job description + candidate data into a positioning strategy
// so that GPT can generate recruiter-quality materials rather than just matching
// keywords. This runs entirely in code — no LLM needed for this step.

type CandidateGap = {
  gap: string;
  severity: "high" | "medium" | "low";
  mitigation: string;
};

type NarrativeAnalysis = {
  targetTitle: string;       // Exact job title the CV headline must use
  roleEmphasis: string;      // Skill/project emphasis category — NEVER used as the title
  roleCategory: string;      // Legacy alias of roleEmphasis (kept for positioning strategy)
  primaryHiringSignals: string[];
  coreSkillCategories: string[];  // Ordered skill-category guidance for GPT
  strongestRelevantProjects: string[];
  strongestRelevantExperience: string[];
  transferableStrengths: string[];
  candidateGaps: CandidateGap[];
  recruiterReassurances: string[];
  positioningStrategy: string;
};

// ── Target title detector ─────────────────────────────────────────────────────
// Priority 1: use the actual job title when it is concrete and reasonable.
// Priority 2: if it includes a seniority level above the candidate's detected
//             seniority, downgrade to the honest equivalent.
// We never fabricate or rephrase the role category into the title.

const SENIOR_PREFIXES = ["senior", "staff", "principal", "lead", "director", "head of", "vp of"];
const JUNIOR_SIGNALS  = ["junior", "jr", "associate", "graduate", "entry", "intern", "trainee"];

function detectTargetTitle(
  jobTitle: string | null,
  fitAnalysis: FitAnalysisInput | null,
): string {
  const raw = jobTitle?.trim() ?? "";
  if (!raw || raw.length < 3) return "Software Engineer";

  const lower = raw.toLowerCase();
  const candidateSeniority = (fitAnalysis?.seniorityDetected ?? "").toLowerCase();
  const isJuniorCandidate = JUNIOR_SIGNALS.some((s) => candidateSeniority.includes(s));

  // If the job is senior-level but the candidate is clearly junior, strip the prefix
  if (isJuniorCandidate && SENIOR_PREFIXES.some((p) => lower.startsWith(p))) {
    // Remove the seniority prefix to produce the honest equivalent
    for (const prefix of SENIOR_PREFIXES) {
      if (lower.startsWith(prefix)) {
        const remainder = raw.slice(prefix.length).replace(/^[\s,]+/, "").trim();
        return remainder.length > 2 ? remainder : raw;
      }
    }
  }

  // All other cases: use the exact title as-is
  return raw;
}

// ── Core skill mix builder ────────────────────────────────────────────────────
// Instructs GPT which skill *categories* to include in the CV SKILLS section.
// The mix depends on role emphasis so a "Software Engineer" role keeps both
// frontend and backend skills rather than collapsing to one side.

const SKILL_MIX: Record<string, string[]> = {
  "Frontend Engineer":          ["Frontend (React, TypeScript, CSS, Next.js)", "Tools & Workflow", "Testing & Quality"],
  "Backend Engineer":           ["Backend (Node.js, Python, APIs, SQL)", "Infrastructure & Deployment", "Tools & Workflow"],
  "Full-Stack Engineer":        ["Frontend", "Backend", "Tools & Deployment"],
  "AI Engineer":                ["AI & LLM (OpenAI, agents, structured output)", "Backend & APIs", "Tools & Infrastructure"],
  "Software Developer":         ["Frontend", "Backend", "Tools & Workflow"],  // broad mix preserved
  "Automation Engineer":        ["Workflow Automation (n8n, Zapier, APIs)", "Backend & Scripting", "Tools"],
  "DevOps / Platform Engineer": ["Infrastructure & Cloud", "CI/CD & Containers", "Monitoring & Reliability"],
  "Data Engineer":              ["Data & SQL", "Pipelines & ETL", "Backend & Scripting"],
  "Solutions Engineer":         ["Technical Stack", "Integration & APIs", "Communication & Documentation"],
  "Product Support":            ["Technical Troubleshooting", "Support Tools", "Communication"],
};

function buildCoreSkillMix(roleEmphasis: string): string[] {
  return SKILL_MIX[roleEmphasis] ?? SKILL_MIX["Software Developer"]!;
}

// ── Role category detector ────────────────────────────────────────────────────

const ROLE_CATEGORIES: Array<{ category: string; signals: string[]; hiringSignals: string[] }> = [
  {
    category: "Frontend Engineer",
    signals: ["frontend", "front-end", "front end", "react", "vue", "angular", "svelte", "ui developer", "interface"],
    hiringSignals: ["React / component architecture", "Responsive & accessible UI", "State management", "CSS / design systems", "TypeScript"],
  },
  {
    category: "AI Engineer",
    signals: ["ai engineer", "llm", "openai", "langchain", "langgraph", "agentic", "rag", "embedding", "workflow orchestration", "ai automation"],
    hiringSignals: ["LLM system design", "Agentic workflow orchestration", "Structured outputs & reliability", "Prompt engineering", "API integration"],
  },
  {
    category: "Full-Stack Engineer",
    signals: ["full-stack", "fullstack", "full stack"],
    hiringSignals: ["End-to-end feature delivery", "Frontend + backend integration", "API design", "Database modeling", "Deployment"],
  },
  {
    category: "Backend Engineer",
    signals: ["backend", "back-end", "back end", "api engineer", "server-side"],
    hiringSignals: ["API design & reliability", "Data modeling", "Performance & scalability", "Authentication & security", "Background jobs"],
  },
  {
    category: "Solutions Engineer",
    signals: ["solutions engineer", "solutions architect", "technical consultant", "pre-sales", "implementation engineer"],
    hiringSignals: ["Client-facing technical consulting", "Integration & implementation", "Business requirement translation", "Demo & proof-of-concept", "Documentation"],
  },
  {
    category: "Product Support",
    signals: ["support", "customer support", "technical support", "helpdesk", "service desk", "customer success"],
    hiringSignals: ["Troubleshooting & root cause analysis", "Customer communication", "Ownership & follow-through", "Technical investigation", "Documentation"],
  },
  {
    category: "Automation Engineer",
    signals: ["automation", "rpa", "n8n", "zapier", "make.com", "workflow automation", "process automation"],
    hiringSignals: ["Workflow design & automation", "API & webhook integration", "No-code / low-code tooling", "Process improvement", "Reliability"],
  },
  {
    category: "DevOps / Platform Engineer",
    signals: ["devops", "sre", "platform engineer", "infrastructure engineer", "cloud engineer"],
    hiringSignals: ["CI/CD pipelines", "Infrastructure as code", "Monitoring & reliability", "Container orchestration", "Cloud platforms"],
  },
  {
    category: "Data Engineer",
    signals: ["data engineer", "data pipeline", "analytics engineer", "machine learning", "ml engineer"],
    hiringSignals: ["Data pipeline design", "ETL / ELT", "SQL & data modeling", "ML workflow integration", "Analytics"],
  },
];

function detectRoleCategory(jobTitle: string | null, jobText: string | null): {
  category: string;
  primaryHiringSignals: string[];
} {
  const needle = `${jobTitle ?? ""} ${jobText?.slice(0, 1500) ?? ""}`.toLowerCase();
  for (const { category, signals, hiringSignals } of ROLE_CATEGORIES) {
    if (signals.some((s) => needle.includes(s))) {
      return { category, primaryHiringSignals: hiringSignals };
    }
  }
  return {
    category: "Software Developer",
    primaryHiringSignals: ["Technical problem solving", "Clean code & maintainability", "Collaboration", "Delivery & ownership"],
  };
}

// ── Asset ranker — scores projects and experience blocks against hiring signals ─

function rankAssets(
  rawText: string | null,
  signals: string[],
  maxCount: number,
): string[] {
  if (!rawText?.trim()) return [];
  const blocks = rawText.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  if (!blocks.length) return rawText.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, maxCount);

  const signalTokens = signals.flatMap((s) => s.toLowerCase().split(/[\s,/&]+/)).filter((t) => t.length > 2);

  const scored = blocks.map((block) => {
    const bl = block.toLowerCase();
    let score = 0;
    for (const token of signalTokens) {
      if (bl.includes(token)) score += 1;
    }
    // Boost projects/roles that appear earlier in the list (recency bias)
    return { block, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCount)
    .map((x) => {
      // Return just the first line (name/title) as a short label
      return x.block.split("\n")[0].replace(/^[#*•·\-]\s*/, "").trim();
    });
}

// ── Gap detector — compares fitAnalysis gaps with resume assets ───────────────

function detectGaps(
  fitAnalysisGaps: string[],
  resume: Resume | null,
  primarySignals: string[],
): CandidateGap[] {
  const resumeText = [
    resume?.skills ?? "",
    resume?.experience ?? "",
    resume?.projects ?? "",
  ].join(" ").toLowerCase();

  const signalTokens = primarySignals.flatMap((s) =>
    s.toLowerCase().split(/[\s,/&]+/).filter((t) => t.length > 3)
  );

  return fitAnalysisGaps.slice(0, 5).map((gap) => {
    const gapLower = gap.toLowerCase();
    // Severity: high if gap matches a primary hiring signal
    const isHighSeverity = signalTokens.some((t) => gapLower.includes(t));
    // Mitigation: find adjacent skills/tools already in resume that partially cover the gap
    const mitigation = buildMitigation(gap, resumeText);
    return {
      gap,
      severity: isHighSeverity ? "high" : ("medium" as const),
      mitigation,
    };
  });
}

function buildMitigation(gap: string, resumeText: string): string {
  const gapLower = gap.toLowerCase();

  // Common gap → mitigation patterns
  const MITIGATIONS: Array<{ patterns: string[]; response: string }> = [
    {
      patterns: ["langgraph", "langchain"],
      response: "Has built multi-step OpenAI-powered workflows, structured output pipelines, conversation memory, and agentic systems.",
    },
    {
      patterns: ["langsmith", "observability", "tracing"],
      response: "Has implemented logging, error handling, and output validation in production AI systems.",
    },
    {
      patterns: ["mobile", "ios", "android", "react native", "flutter"],
      response: "Has shipped responsive web interfaces; familiar with cross-platform concerns.",
    },
    {
      patterns: ["kubernetes", "k8s"],
      response: "Has experience with Docker, container deployment, and CI/CD pipelines.",
    },
    {
      patterns: ["aws", "gcp", "azure", "cloud"],
      response: "Has deployed production systems to cloud platforms and managed environment configuration.",
    },
  ];

  for (const { patterns, response } of MITIGATIONS) {
    if (patterns.some((p) => gapLower.includes(p))) return response;
  }

  // Generic: look for skills in resume that partially overlap with gap keywords
  const gapTokens = gapLower.split(/[\s,/\-]+/).filter((t) => t.length > 3);
  const adjacent = gapTokens.filter((t) => resumeText.includes(t));
  if (adjacent.length > 0) {
    return `Has adjacent experience with: ${adjacent.slice(0, 3).join(", ")}.`;
  }

  return "Not directly addressed in resume — honest gap.";
}

// ── Recruiter reassurances ────────────────────────────────────────────────────

function buildReassurances(gaps: CandidateGap[]): string[] {
  return gaps
    .filter((g) => g.mitigation !== "Not directly addressed in resume — honest gap.")
    .map((g) => `Re: "${g.gap}" — ${g.mitigation}`);
}

// ── Positioning strategy ──────────────────────────────────────────────────────

const POSITIONING_TEMPLATES: Array<{ category: string; template: string }> = [
  {
    category: "Frontend Engineer",
    template: "Position as a frontend-focused developer with shipped React projects and responsive UI experience.",
  },
  {
    category: "AI Engineer",
    template: "Position as an emerging AI engineer already building production OpenAI-powered systems and workflow orchestration products.",
  },
  {
    category: "Full-Stack Engineer",
    template: "Position as a versatile full-stack developer who ships end-to-end features with ownership of both UI and backend.",
  },
  {
    category: "Backend Engineer",
    template: "Position as a backend-focused developer with API design, data modeling, and production deployment experience.",
  },
  {
    category: "Solutions Engineer",
    template: "Position as a technically capable professional who bridges engineering and client-facing work with strong communication and implementation skills.",
  },
  {
    category: "Product Support",
    template: "Position as a technically capable operator with strong troubleshooting skills, communication ability, and quality-focused experience.",
  },
  {
    category: "Automation Engineer",
    template: "Position as an automation specialist who designs reliable, API-driven workflows that eliminate manual processes.",
  },
  {
    category: "DevOps / Platform Engineer",
    template: "Position as a platform-focused engineer with CI/CD, containerisation, and infrastructure reliability experience.",
  },
  {
    category: "Data Engineer",
    template: "Position as a data-focused developer with pipeline design, SQL, and analytical tooling experience.",
  },
];

function buildPositioningStrategy(
  category: string,
  strongestProjects: string[],
  transferableStrengths: string[],
): string {
  const template = POSITIONING_TEMPLATES.find((t) => t.category === category)?.template
    ?? "Position as a pragmatic developer with end-to-end delivery experience and strong ownership instincts.";

  const extras: string[] = [];
  if (strongestProjects.length > 0) {
    extras.push(`Lead with: ${strongestProjects.slice(0, 2).join(", ")}.`);
  }
  if (transferableStrengths.length > 0) {
    extras.push(`Emphasise: ${transferableStrengths.slice(0, 2).join("; ")}.`);
  }
  return extras.length > 0 ? `${template} ${extras.join(" ")}` : template;
}

// ── Main entry point ──────────────────────────────────────────────────────────

export function buildNarrativeAnalysis(
  job: Job,
  resume: Resume | null,
  fitAnalysis: FitAnalysisInput | null,
): NarrativeAnalysis {
  const { category, primaryHiringSignals } = detectRoleCategory(job.title, job.rawText);

  // targetTitle: what goes on the CV headline — always the actual job title, never the emphasis label
  const targetTitle = detectTargetTitle(job.title, fitAnalysis);
  // roleEmphasis: drives skill/project prioritisation only, never the headline
  const roleEmphasis = category;
  const coreSkillCategories = buildCoreSkillMix(roleEmphasis);

  // Rank projects and experience by relevance to hiring signals
  const allSignals = [
    ...primaryHiringSignals,
    ...(fitAnalysis?.matchingSkills ?? []),
    ...(fitAnalysis?.matchingProjects ?? []),
  ];

  const strongestRelevantProjects = rankAssets(resume?.projects ?? null, allSignals, 3);
  const strongestRelevantExperience = rankAssets(resume?.experience ?? null, allSignals, 2);

  // Transferable strengths: use fitAnalysis strengths filtered to be substantive
  const transferableStrengths = (fitAnalysis?.strengths ?? [])
    .filter((s) => s.length > 20 && !s.toLowerCase().startsWith("note:") && !s.toLowerCase().startsWith("clarify"))
    .slice(0, 4);

  // Detect gaps and build reassurances
  const candidateGaps = detectGaps(fitAnalysis?.gaps ?? [], resume, primaryHiringSignals);
  const recruiterReassurances = buildReassurances(candidateGaps);

  const positioningStrategy = buildPositioningStrategy(
    category,
    strongestRelevantProjects,
    transferableStrengths,
  );

  return {
    targetTitle,
    roleEmphasis,
    roleCategory: category,
    primaryHiringSignals,
    coreSkillCategories,
    strongestRelevantProjects,
    strongestRelevantExperience,
    transferableStrengths,
    candidateGaps,
    recruiterReassurances,
    positioningStrategy,
  };
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a senior career coach and recruiter producing job application materials.

CORE PHILOSOPHY:
You do NOT match keywords. You build positioning.
Every material should feel like it was written by a skilled recruiter who understands both the candidate and the role deeply.

STRICT RULES — follow all of them:
- Use ONLY the candidate data provided. Never invent experience, employers, skills, projects, or dates.
- Follow the POSITIONING STRATEGY provided in the NARRATIVE ANALYSIS section.
- Prioritise the STRONGEST RELEVANT PROJECTS and STRONGEST RELEVANT EXPERIENCE identified in the analysis.
- Do not list every skill or every project. Omit what is not relevant.
- Address CANDIDATE GAPS honestly using the RECRUITER REASSURANCES where applicable. Do not hide or ignore them.
- Avoid keyword stuffing, giant bullet lists, and filler phrases ("focused on", "ability to", "passionate about", "team player", "results-driven", "hard-working").
- Avoid placeholders except [Add availability] and [Add salary expectation] for those two screening questions.
- Avoid internal notes, meta-commentary, and section headings that don't match the formats below.
- Tone: professional, human, and concise. Write like a person, not a template.
- Do not repeat identical sentences across materials.
- Build a coherent professional narrative across all four materials.

TARGET TITLE RULE (CRITICAL — never violate):
- The CV headline MUST be the exact TARGET TITLE from the NARRATIVE ANALYSIS.
- TARGET TITLE = the job title. ROLE EMPHASIS = what to emphasise in skills and projects.
- These are SEPARATE concepts. ROLE EMPHASIS never becomes the headline.
- CORRECT example: Target Title "Junior Software Engineer", Role Emphasis "Frontend" → headline "Junior Software Engineer"
- WRONG example: Target Title "Junior Software Engineer", Role Emphasis "Frontend" → headline "Junior Frontend Developer"
- Use the CORE SKILL CATEGORIES to decide which skill groups to include — do NOT collapse to a single category.

SKILLS SECTION RULE:
- Use the CORE SKILL CATEGORIES provided in the NARRATIVE ANALYSIS to structure the SKILLS section.
- For "Software Engineer" or "Full-Stack" roles the skill mix MUST include both frontend AND backend skills.
- Never collapse a broad role to only frontend or only backend skills.

OUTPUT: Return ONLY a single valid JSON object with exactly these four string keys:
tailoredCv, coverLetter, recruiterMessage, screeningAnswers.

────────────────────────────────────────
tailoredCv format (STRICT max 400 words, plain text):
  [Full name]
  [Single headline] · [Location] · [Languages if any]
  [Links if any]

  SUMMARY
  2 sentences. Use the positioning strategy. Be specific about what value the candidate brings to this role.

  SKILLS
  Up to 3 role-relevant categories, max 5 items each.
  Prioritise categories most relevant to the PRIMARY HIRING SIGNALS.
  Format: CategoryName\n- item\n- item

  SELECTED PROJECTS
  Show only the STRONGEST RELEVANT PROJECTS (max 2).
  Do not list projects that are irrelevant to this role.
  Format: Project Name\n• bullet\n• bullet (max 2 bullets per project — achievements, not descriptions)

  EXPERIENCE
  Show only the STRONGEST RELEVANT EXPERIENCE (max 2 roles).
  Format:
  Role Title
  Company | Dates
  • achievement (1 bullet only — specific, quantified where possible)

  EDUCATION
  Degree, Institution, Year (one line)

────────────────────────────────────────
coverLetter format (STRICT max 200 words, plain text):
  Dear [Company] Hiring Team,

  Paragraph 1: Specific hook — why this candidate for this role. Use the positioning strategy.
  Paragraph 2: Strongest evidence. Reference the most relevant project or experience. Address a key gap with a reassurance if applicable.
  Paragraph 3: Short closing CTA.

  Best regards,
  [Name]

────────────────────────────────────────
recruiterMessage format (STRICT max 80 words, plain text):
  Hi,

  1–2 sentences: who the candidate is + the single strongest reason to talk (from positioning strategy).
  [Links if available]
  [Clear CTA — one sentence]

  Best,
  [Name]

────────────────────────────────────────
screeningAnswers format (plain text, Q&A):
  Q: Tell me about yourself.
  A: [2–3 sentences grounded in the positioning strategy and strongest assets]

  Q: Why are you interested in this role?
  A: [Specific to the PRIMARY HIRING SIGNALS — not generic]

  Q: What are your key strengths?
  A: [3 concrete strengths from TRANSFERABLE STRENGTHS — one sentence each]

  Q: Describe a relevant project or achievement.
  A: [One of the STRONGEST RELEVANT PROJECTS — specific outcome, not vague description]

  Q: What is your availability / notice period?
  A: [Add availability]

  Q: What are your salary expectations?
  A: [Add salary expectation]

  Q: Any questions for us?
  A: [2–3 thoughtful questions about the role, team, or company — informed by the PRIMARY HIRING SIGNALS]`;

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

  // ── Narrative analysis block ──────────────────────────────────────────────────
  // buildNarrativeAnalysis() runs deterministically before the GPT call.
  // It produces a positioning strategy, ranked assets, and gap mitigations
  // that GPT uses to generate recruiter-quality materials rather than
  // generic keyword matches.
  const narrative = buildNarrativeAnalysis(job, resume, fitAnalysis);

  const gapLines = narrative.candidateGaps.map((g) =>
    `- ${g.gap} [severity: ${g.severity}]${g.mitigation !== "Not directly addressed in resume — honest gap." ? ` → ${g.mitigation}` : " → Honest gap; do not fabricate mitigation"}`,
  );

  const narrativeLines = [
    `TARGET TITLE (use this EXACTLY as the CV headline): ${narrative.targetTitle}`,
    `ROLE EMPHASIS (use only for skill/project bias — NOT the headline): ${narrative.roleEmphasis}`,
    `Positioning strategy: ${narrative.positioningStrategy}`,
    "",
    `Core skill categories (structure the CV SKILLS section using these):`,
    ...narrative.coreSkillCategories.map((c) => `- ${c}`),
    "",
    `Primary hiring signals:`,
    ...narrative.primaryHiringSignals.map((s) => `- ${s}`),
    "",
    `Strongest relevant projects (prioritise these in CV and screening answers):`,
    ...(narrative.strongestRelevantProjects.length
      ? narrative.strongestRelevantProjects.map((p) => `- ${p}`)
      : ["- (none identified — use whatever is available)"]),
    "",
    `Strongest relevant experience (prioritise these in CV):`,
    ...(narrative.strongestRelevantExperience.length
      ? narrative.strongestRelevantExperience.map((e) => `- ${e}`)
      : ["- (none identified — use whatever is available)"]),
    "",
    `Transferable strengths:`,
    ...(narrative.transferableStrengths.length
      ? narrative.transferableStrengths.map((s) => `- ${s}`)
      : ["- (none identified)"]),
    ...(gapLines.length
      ? ["", "Candidate gaps (address honestly — use reassurance where provided):", ...gapLines]
      : []),
    ...(narrative.recruiterReassurances.length
      ? ["", "Recruiter reassurances:", ...narrative.recruiterReassurances.map((r) => `- ${r}`)]
      : []),
  ];

  const narrativeBlock = narrativeLines.join("\n");

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
    "",
    "## NARRATIVE ANALYSIS",
    "Use this section to drive all materials. Do not ignore it.",
    narrativeBlock,
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
    // GPT-5 and o-series models use the Responses API instead of Chat Completions.
    // They do not accept `temperature` and require `max_output_tokens` (not `max_tokens`).
    // `json_schema` strict mode guarantees a well-formed JSON object, so robust parsing
    // below is still applied defensively in case output_text is unexpectedly wrapped.
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
    console.log(`[openai-materials] provider:openai model:${model} source:responses-api length:${raw.length} ok:${raw.trim().startsWith("{") && raw.trim().endsWith("}")}`)
  } else {
    // Older models (gpt-4o, gpt-4-turbo, etc.) use Chat Completions with json_object mode.
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
    console.log(`[openai-materials] provider:openai model:${model} source:chat-completions finish:${resp.choices[0]?.finish_reason ?? "?"} length:${raw.length} ok:${raw.trim().startsWith("{") && raw.trim().endsWith("}")}`)
  }

  // ── Parse — strip markdown fences and extract JSON if needed ─────────────────
  const cleaned = extractJson(raw);

  // Robust parsing: even with json_schema strict mode, output can occasionally arrive
  // wrapped in markdown fences (model quirk). extractJson() handles that before we parse.
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    // Throw without logging raw content — callers may log the error message.
    throw new Error(
      `OpenAI JSON parse failed — model:${model} length:${raw.length} startsWithBrace:${raw.trim().startsWith("{")} endsWithBrace:${raw.trim().endsWith("}")}`
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

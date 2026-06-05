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

type CompanyContext = {
  tags: string[];   // e.g. ["startup", "ecommerce", "saas"]
  label: string;    // human-readable summary for GPT prompt
};

type NarrativeAnalysis = {
  targetTitle: string;              // Exact job title the CV headline must use
  roleEmphasis: string;             // Skill/project emphasis category — NEVER used as the title
  roleCategory: string;             // Legacy alias of roleEmphasis (kept for positioning strategy)
  primaryHiringSignals: string[];
  companyContext: CompanyContext;    // Detected industry/company type context
  recommendedSkillCategories: string[];  // Context-aware ordered skill categories for GPT
  coreSkillCategories: string[];    // Alias kept for backward compat
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

// ── Company context detector ─────────────────────────────────────────────────
// Detects industry / company-type tags from job title, company name, and JD.
// Tags are used to boost contextually relevant projects in scoring.

const COMPANY_CONTEXT_RULES: Array<{ tags: string[]; signals: string[] }> = [
  { tags: ["ecommerce"],      signals: ["ecommerce", "e-commerce", "shop", "store", "checkout", "cart", "post-purchase", "shopify", "woocommerce", "retail"] },
  { tags: ["ai"],             signals: ["ai", "llm", "machine learning", "artificial intelligence", "openai", "langchain", "agentic", "nlp", "genai"] },
  { tags: ["saas"],           signals: ["saas", "software as a service", "platform", "subscription", "b2b", "b2c", "product-led"] },
  { tags: ["startup"],        signals: ["startup", "seed", "series a", "series b", "early-stage", "scale-up", "scaleup", "fast-paced", "small team"] },
  { tags: ["enterprise"],     signals: ["enterprise", "fortune 500", "global", "large organisation", "corporate", "multinational"] },
  { tags: ["insurance"],      signals: ["insurance", "underwriting", "claims", "actuarial", "reinsurance", "zurich", "axa", "allianz"] },
  { tags: ["consulting"],     signals: ["consulting", "consultancy", "bpo", "outsourc", "bairesd", "agency", "professional services"] },
  { tags: ["marketplace"],    signals: ["marketplace", "listing", "seller", "buyer", "auction", "booking", "reservation"] },
  { tags: ["developer_tools"],signals: ["developer tool", "devtool", "sdk", "api platform", "ci/cd", "developer platform", "ashby", "linear", "vercel"] },
  { tags: ["support"],        signals: ["support", "helpdesk", "customer success", "service desk", "ticket", "zendesk", "intercom"] },
  { tags: ["recruiting"],     signals: ["recruiting", "talent", "hr tech", "applicant tracking", "ats", "hire"] },
  { tags: ["automation"],     signals: ["automation", "rpa", "workflow automation", "n8n", "zapier", "make.com", "process automation"] },
];

function detectCompanyContext(job: Job): CompanyContext {
  const needle = [
    job.title ?? "",
    job.companyName ?? "",
    job.rawText?.slice(0, 2000) ?? "",
  ].join(" ").toLowerCase();

  const tags: string[] = [];
  for (const { tags: ruleTags, signals } of COMPANY_CONTEXT_RULES) {
    if (signals.some((s) => needle.includes(s))) {
      tags.push(...ruleTags);
    }
  }

  // Heuristic: small companies with product language are likely startups/SaaS
  const isLikelyStartup = needle.includes("startup") || needle.includes("scale") || (tags.includes("saas") && !tags.includes("enterprise"));
  if (isLikelyStartup && !tags.includes("startup")) tags.push("startup");

  const uniqueTags = [...new Set(tags)];
  if (!uniqueTags.length) uniqueTags.push("unknown");

  const label = uniqueTags.join(", ");
  return { tags: uniqueTags, label };
}

// ── Project metadata ──────────────────────────────────────────────────────────
// Known candidate projects with semantic tags used for contextual scoring.
// Matching is done against project block first-line names (case-insensitive).
// New projects without metadata fall back to the generic signal-token scorer.

type ProjectMeta = { namePatterns: string[]; tags: string[] };

const PROJECT_METADATA: ProjectMeta[] = [
  {
    namePatterns: ["projectflow", "project flow"],
    tags: ["product", "saas", "frontend", "automation", "consulting", "ai", "workflow", "delivery", "fullstack"],
  },
  {
    namePatterns: ["career autopilot", "careerautopilot"],
    tags: ["ai", "automation", "fullstack", "saas", "llm", "job_search", "workflow", "backend", "frontend"],
  },
  {
    namePatterns: ["whatsapp agent", "whatsapp-agent", "whatsapp bot"],
    tags: ["ai", "agents", "automation", "backend", "integrations", "whatsapp", "lead_qualification", "llm"],
  },
  {
    namePatterns: ["ethnicraft"],
    tags: ["frontend", "uiux", "ecommerce", "branding", "responsive", "figma", "product_presentation", "commercial_ui"],
  },
  {
    namePatterns: ["rise", "rise app"],
    tags: ["frontend", "backend", "gamification", "psychology", "product", "state_management", "fullstack"],
  },
  {
    namePatterns: ["station"],
    tags: ["product", "reservations", "marketplace", "saas", "booking", "fullstack"],
  },
];

function getProjectMeta(firstLine: string): string[] | null {
  const lower = firstLine.toLowerCase();
  for (const { namePatterns, tags } of PROJECT_METADATA) {
    if (namePatterns.some((p) => lower.includes(p))) return tags;
  }
  return null;
}

// ── Context-aware project scorer ──────────────────────────────────────────────
// Scores a project block using company context tags and role emphasis.
// Known projects are scored via metadata; unknowns fall back to signal tokens.

function scoreProjectForContext(
  block: string,
  roleEmphasis: string,
  companyTags: string[],
  signalTokens: string[],
): number {
  const firstLine = block.split("\n")[0].replace(/^[#*•·\-]\s*/, "").trim();
  const meta = getProjectMeta(firstLine);
  const blockLower = block.toLowerCase();

  let score = 0;

  if (meta) {
    // Score via metadata tags
    const emphasisLower = roleEmphasis.toLowerCase();

    // Direct company context overlap
    for (const ctag of companyTags) {
      if (meta.includes(ctag)) score += 3;
    }

    // Role emphasis alignment
    if (emphasisLower.includes("frontend") && (meta.includes("frontend") || meta.includes("uiux") || meta.includes("ecommerce"))) score += 2;
    if (emphasisLower.includes("ai")       && (meta.includes("ai")       || meta.includes("llm") || meta.includes("agents")))    score += 2;
    if (emphasisLower.includes("backend")  && (meta.includes("backend")  || meta.includes("fullstack")))                         score += 2;
    if (emphasisLower.includes("full")     && (meta.includes("fullstack")|| meta.includes("frontend") || meta.includes("backend"))) score += 1;
    if (emphasisLower.includes("support")  && (meta.includes("product")  || meta.includes("saas") || meta.includes("workflow")))   score += 2;
    if (emphasisLower.includes("automati") && (meta.includes("automation")|| meta.includes("workflow") || meta.includes("ai")))    score += 2;

    // ecommerce-specific boost: commercial UI / product presentation
    if (companyTags.includes("ecommerce") && (meta.includes("ecommerce") || meta.includes("commercial_ui") || meta.includes("product_presentation") || meta.includes("responsive"))) score += 4;

    // General product / saas affinity
    if (meta.includes("saas") || meta.includes("product")) score += 1;
  } else {
    // Unknown project: fall back to signal token matching
    for (const token of signalTokens) {
      if (blockLower.includes(token)) score += 1;
    }
  }

  return score;
}

// Context-aware project ranker — replaces the old generic rankAssets() for projects
function rankProjectsContextually(
  projectsText: string | null,
  roleEmphasis: string,
  companyTags: string[],
  signalTokens: string[],
  maxCount: number,
): string[] {
  if (!projectsText?.trim()) return [];
  const blocks = projectsText.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  if (!blocks.length) return projectsText.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, maxCount);

  const scored = blocks.map((block, idx) => ({
    block,
    // Small position penalty so equally-scored projects stay in resume order
    score: scoreProjectForContext(block, roleEmphasis, companyTags, signalTokens) - idx * 0.1,
  }));

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCount)
    .map((x) => x.block.split("\n")[0].replace(/^[#*•·\-]\s*/, "").trim());
}

// ── Context-aware skill category ranker ──────────────────────────────────────
// Produces ordered skill-category labels for GPT's SKILLS section.
// The targetTitle drives the mix; roleEmphasis and companyContext refine it.

const BROAD_SW_PATTERNS = [
  "software engineer", "software developer", "junior developer",
  "application developer", "full-stack developer", "fullstack developer",
  "full stack developer", "web developer",
];
const FRONTEND_PATTERNS  = ["frontend", "front-end", "front end", "react developer", "ui engineer", "ui developer"];
const AI_PATTERNS        = ["ai engineer", "agentic", "llm", "automation engineer", "ml engineer"];
const SUPPORT_PATTERNS   = ["product support", "technical support", "customer support", "implementation", "solutions", "support specialist"];
const BACKEND_PATTERNS   = ["backend", "back-end", "api engineer", "server-side"];

function rankSkillCategories(
  targetTitle: string,
  roleEmphasis: string,
  companyTags: string[],
): string[] {
  const t = targetTitle.toLowerCase();

  // Broad engineering roles — always keep frontend + backend mix
  if (BROAD_SW_PATTERNS.some((p) => t.includes(p))) {
    if (companyTags.includes("ecommerce")) {
      return ["Frontend (React, TypeScript, Next.js, CSS)", "Backend & APIs (Node.js, Python, PostgreSQL)", "Tools & Workflow"];
    }
    if (companyTags.includes("ai")) {
      return ["Frontend", "Backend & APIs", "AI & Integration"];
    }
    return ["Frontend (React, TypeScript, Next.js)", "Backend & APIs (Node.js, Python, PostgreSQL)", "Tools & Workflow"];
  }

  // Explicit frontend roles
  if (FRONTEND_PATTERNS.some((p) => t.includes(p))) {
    return ["Frontend (React, TypeScript, CSS, Next.js)", "UI & Design Systems", "Tools & Integration"];
  }

  // AI / Automation roles
  if (AI_PATTERNS.some((p) => t.includes(p))) {
    return ["AI / LLM Systems (OpenAI, agents, structured output)", "Backend & APIs (Node.js, Python)", "Tools & Infrastructure"];
  }

  // Support / Solutions / Implementation roles
  if (SUPPORT_PATTERNS.some((p) => t.includes(p))) {
    return ["Technical Troubleshooting & Investigation", "Product & Operations", "Web & APIs"];
  }

  // Backend-explicit roles
  if (BACKEND_PATTERNS.some((p) => t.includes(p))) {
    return ["Backend & APIs (Node.js, Python, SQL)", "Infrastructure & Deployment", "Tools & Workflow"];
  }

  // Fallback: use roleEmphasis-based mix (Sprint #5 logic)
  const EMPHASIS_MIX: Record<string, string[]> = {
    "Frontend Engineer":          ["Frontend (React, TypeScript, CSS, Next.js)", "Tools & Workflow", "Testing & Quality"],
    "Backend Engineer":           ["Backend (Node.js, Python, APIs, SQL)", "Infrastructure & Deployment", "Tools & Workflow"],
    "Full-Stack Engineer":        ["Frontend", "Backend", "Tools & Deployment"],
    "AI Engineer":                ["AI & LLM (OpenAI, agents, structured output)", "Backend & APIs", "Tools & Infrastructure"],
    "Software Developer":         ["Frontend", "Backend & APIs", "Tools & Workflow"],
    "Automation Engineer":        ["Workflow Automation (n8n, Zapier, APIs)", "Backend & Scripting", "Tools"],
    "DevOps / Platform Engineer": ["Infrastructure & Cloud", "CI/CD & Containers", "Monitoring & Reliability"],
    "Data Engineer":              ["Data & SQL", "Pipelines & ETL", "Backend & Scripting"],
    "Solutions Engineer":         ["Technical Stack", "Integration & APIs", "Communication & Documentation"],
    "Product Support":            ["Technical Troubleshooting", "Support Tools", "Communication"],
  };
  return EMPHASIS_MIX[roleEmphasis] ?? ["Frontend", "Backend & APIs", "Tools & Workflow"];
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

  // Company context: startup/ecommerce/ai/etc tags used for project + skill scoring
  const companyContext = detectCompanyContext(job);

  // Context-aware skill categories (replaces Sprint #5 buildCoreSkillMix)
  const recommendedSkillCategories = rankSkillCategories(targetTitle, roleEmphasis, companyContext.tags);
  // Keep coreSkillCategories as an alias for backward compatibility
  const coreSkillCategories = recommendedSkillCategories;

  // Signal tokens for experience ranking (still uses generic ranker) and unknown-project fallback
  const allSignals = [
    ...primaryHiringSignals,
    ...(fitAnalysis?.matchingSkills ?? []),
    ...(fitAnalysis?.matchingProjects ?? []),
  ];
  const signalTokens = allSignals.flatMap((s) => s.toLowerCase().split(/[\s,/&]+/)).filter((t) => t.length > 2);

  // Context-aware project ranking (new in Sprint #6)
  const strongestRelevantProjects = rankProjectsContextually(
    resume?.projects ?? null,
    roleEmphasis,
    companyContext.tags,
    signalTokens,
    3,
  );

  // Experience ranking still uses generic signal scorer
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
    companyContext,
    recommendedSkillCategories,
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

SKILLS SECTION RULE:
- Use the RECOMMENDED SKILL CATEGORIES from the NARRATIVE ANALYSIS as the 3 skill section headers in the CV.
- Each category should contain 3–5 real skills drawn from the candidate's data.
- For broad engineering titles (Software Engineer, Software Developer, Web Developer, Full-Stack) the mix MUST include both frontend AND backend skills — never collapse to one side.
- Never add a category not listed in RECOMMENDED SKILL CATEGORIES.

COMPANY CONTEXT RULE:
- Use the COMPANY CONTEXT to decide which projects and examples are most relevant.
- ecommerce context → prioritise projects demonstrating commercial UI, responsive design, product presentation.
- ai / enterprise context → prioritise projects demonstrating agentic systems, LLM pipelines, backend reliability.
- support / saas context → prioritise projects demonstrating troubleshooting, product thinking, workflow.
- consulting / agency context → prioritise projects demonstrating delivery, client value, breadth.
- Follow the ranked project order in STRONGEST RELEVANT PROJECTS — do not reorder them.

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
    `Company context: ${narrative.companyContext.label}`,
    `Positioning strategy: ${narrative.positioningStrategy}`,
    "",
    `RECOMMENDED SKILL CATEGORIES (use these as the 3 SKILLS section headers in the CV):`,
    ...narrative.recommendedSkillCategories.map((c) => `- ${c}`),
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

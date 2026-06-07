/**
 * Relevance Engine V1
 *
 * Deterministic evidence selection for job-specific positioning.
 * Goal: Reduce context size while maintaining quality.
 */

export type JobSignals = {
  roleFamily: string;
  seniority: string;
  domainSignals: string[];
  technicalSignals: string[];
  softSkillSignals: string[];
  mustHaveSignals: string[];
  niceToHaveSignals: string[];
};

export type RelevantProject = {
  name: string;
  relevanceScore: number;
  reason: string;
  signals: string[];
};

export type RelevantExperience = {
  company: string;
  role: string;
  relevanceScore: number;
  reason: string;
  signals: string[];
};

export type RelevanceContext = {
  jobSignals: JobSignals;
  relevantProjects: RelevantProject[];
  relevantExperiences: RelevantExperience[];
  topStrengths: string[];
  topGaps: string[];
  positioningHints: string[];
};

// ─── Keyword Dictionaries ───────────────────────────────────────────────────

const ROLE_FAMILIES: Record<string, string[]> = {
  "ai-engineer": ["ai", "llm", "ml", "machine learning", "openai", "anthropic", "langchain", "vector", "embedding", "model"],
  "backend-engineer": ["backend", "api", "server", "microservices", "database", "postgres", "redis", "graphql", "rest"],
  "frontend-engineer": ["frontend", "react", "vue", "angular", "typescript", "javascript", "css", "html", "dom", "ui"],
  "fullstack-engineer": ["fullstack", "frontend", "backend", "end-to-end", "mvp", "product"],
  "devops-engineer": ["devops", "ci/cd", "docker", "kubernetes", "terraform", "aws", "gcp", "azure"],
  "data-engineer": ["data", "etl", "pipeline", "warehouse", "dbt", "airflow", "spark"],
  "support-engineer": ["support", "troubleshooting", "debugging", "customer success", "technical support"],
  "product-engineer": ["product", "feature", "roadmap", "stakeholder", "user research", "experimentation"],
  "platform-engineer": ["platform", "infrastructure", "internal tools", "developer experience", "dx"],
};

const TECHNICAL_DOMAINS: Record<string, string[]> = {
  "ai-ml": ["openai", "anthropic", "langchain", "llamaindex", "huggingface", "transformers", "fine-tuning", "rag", "vector db"],
  "web": ["next.js", "react", "vue", "svelte", "remix", "astro", "tailwind", "typescript"],
  "backend": ["nodejs", "python", "go", "rust", "postgresql", "redis", "graphql", "grpc", "kafka"],
  "cloud": ["aws", "gcp", "azure", "vercel", "netlify", "lambda", "ec2", "s3"],
  "data": ["sql", "dbt", "airflow", "looker", "tableau", "pandas", "numpy"],
  "mobile": ["react native", "flutter", "swift", "kotlin", "ios", "android"],
  "devops": ["docker", "kubernetes", "terraform", "github actions", "jenkins", "argocd"],
};

const SOFT_SKILLS: Record<string, string[]> = {
  "communication": ["communication", "stakeholder", "presentation", "documentation", "writing"],
  "leadership": ["leadership", "mentor", "team lead", "management", "ownership"],
  "problem-solving": ["problem solving", "debugging", "troubleshooting", "analysis", "root cause"],
  "collaboration": ["collaboration", "cross-functional", "partnership", "teamwork"],
  "customer-focus": ["customer", "user", "client", "support", "empathy"],
  "execution": ["execution", "delivery", "shipping", "bias to action", "mvp"],
};

// ─── Scoring Helpers ────────────────────────────────────────────────────────

function extractKeywords(text: string): string[] {
  const normalized = text.toLowerCase();
  return normalized
    .replace(/[^a-z0-9\s\-\/]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);
}

function scoreKeywordOverlap(source: string, target: string): number {
  const sourceWords = new Set(extractKeywords(source));
  const targetWords = extractKeywords(target);
  if (sourceWords.size === 0 || targetWords.length === 0) return 0;

  let matches = 0;
  for (const word of targetWords) {
    if (sourceWords.has(word)) matches++;
  }

  // Normalize to 0-100 based on proportion of target words that match
  return Math.round((matches / targetWords.length) * 100);
}

function detectRoleFamily(jobText: string): string {
  const text = jobText.toLowerCase();

  let bestMatch = "general";
  let bestScore = 0;

  for (const [family, keywords] of Object.entries(ROLE_FAMILIES)) {
    let score = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = family;
    }
  }

  return bestMatch;
}

function detectSeniority(jobText: string): string {
  const text = jobText.toLowerCase();

  if (text.includes("senior staff") || text.includes("principal") || text.includes("staff engineer")) {
    return "senior-staff";
  }
  if (text.includes("senior") || text.includes("sr.") || text.includes("lead")) {
    return "senior";
  }
  if (text.includes("junior") || text.includes("jr.") || text.includes("entry")) {
    return "junior";
  }
  if (text.includes("intern")) {
    return "intern";
  }

  return "mid";
}

function extractDomainSignals(jobText: string): string[] {
  const text = jobText.toLowerCase();
  const signals: string[] = [];

  for (const [domain, keywords] of Object.entries(TECHNICAL_DOMAINS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) score++;
    }
    if (score >= 2) signals.push(domain);
  }

  return signals.slice(0, 4);
}

function extractTechnicalSignals(jobText: string): string[] {
  const text = jobText.toLowerCase();
  const signals: string[] = [];

  for (const keywords of Object.values(TECHNICAL_DOMAINS)) {
    for (const keyword of keywords) {
      if (text.includes(keyword) && !signals.includes(keyword)) {
        signals.push(keyword);
      }
    }
  }

  return signals.slice(0, 6);
}

function extractSoftSkillSignals(jobText: string): string[] {
  const text = jobText.toLowerCase();
  const signals: string[] = [];

  for (const [skill, keywords] of Object.entries(SOFT_SKILLS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (text.includes(keyword)) score++;
    }
    if (score >= 1) signals.push(skill);
  }

  return signals.slice(0, 3);
}

function extractMustHaveSignals(jobText: string): string[] {
  const text = jobText.toLowerCase();
  const signals: string[] = [];

  // Look for explicit requirements
  const patterns = [
    /must have[:\s]+([^\.\n]+)/gi,
    /required[:\s]+([^\.\n]+)/gi,
    /requirements?[:\s]+([^\.\n]+)/gi,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const cleaned = match.replace(/must have|required|requirements?/gi, "").trim();
        if (cleaned.length > 3) signals.push(cleaned.slice(0, 50));
      }
    }
  }

  return signals.slice(0, 3);
}

function extractNiceToHaveSignals(jobText: string): string[] {
  const text = jobText.toLowerCase();
  const signals: string[] = [];

  const patterns = [
    /nice to have[:\s]+([^\.\n]+)/gi,
    /preferred[:\s]+([^\.\n]+)/gi,
    /bonus[:\s]+([^\.\n]+)/gi,
    /plus[:\s]+([^\.\n]+)/gi,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      for (const match of matches) {
        const cleaned = match.replace(/nice to have|preferred|bonus|plus/gi, "").trim();
        if (cleaned.length > 3) signals.push(cleaned.slice(0, 50));
      }
    }
  }

  return signals.slice(0, 3);
}

// ─── Project Scoring ──────────────────────────────────────────────────────

type ProjectInput = {
  name: string;
  description?: string | null;
  technologies?: string[] | null;
  keyFeatures?: string[] | null;
};

function scoreProject(
  project: ProjectInput,
  jobSignals: JobSignals,
  fitAnalysis: {
    matchingProjects: string[];
    strengths: string[];
    gaps: string[];
  } | null
): RelevantProject {
  const projectText = [
    project.name,
    project.description || "",
    (project.technologies || []).join(" "),
    (project.keyFeatures || []).join(" "),
  ].join(" ").toLowerCase();

  let score = 0;
  const signals: string[] = [];
  const reasons: string[] = [];

  // 1. Role family match (0-25 points)
  const roleKeywords = ROLE_FAMILIES[jobSignals.roleFamily] || [];
  let roleMatches = 0;
  for (const keyword of roleKeywords) {
    if (projectText.includes(keyword)) roleMatches++;
  }
  const roleScore = Math.min(25, roleMatches * 5);
  score += roleScore;
  if (roleMatches > 0) {
    signals.push(`role:${jobSignals.roleFamily}`);
    reasons.push(`${roleMatches} role-relevant signals`);
  }

  // 2. Technical domain match (0-25 points)
  let techMatches = 0;
  for (const domain of jobSignals.technicalSignals) {
    if (projectText.includes(domain)) techMatches++;
  }
  const techScore = Math.min(25, techMatches * 5);
  score += techScore;
  if (techMatches > 0) {
    signals.push(...jobSignals.technicalSignals.slice(0, 3));
    reasons.push(`${techMatches} technical matches`);
  }

  // 3. Fit analysis match (0-30 points)
  if (fitAnalysis?.matchingProjects.some((p) =>
    project.name.toLowerCase().includes(p.toLowerCase()) ||
    p.toLowerCase().includes(project.name.toLowerCase())
  )) {
    score += 30;
    signals.push("fit:project-match");
    reasons.push("Explicitly mentioned in fit analysis");
  }

  // 4. Domain signals match (0-20 points)
  let domainMatches = 0;
  for (const domain of jobSignals.domainSignals) {
    const domainKeywords = TECHNICAL_DOMAINS[domain] || [];
    for (const keyword of domainKeywords) {
      if (projectText.includes(keyword)) {
        domainMatches++;
        break;
      }
    }
  }
  const domainScore = Math.min(20, domainMatches * 10);
  score += domainScore;
  if (domainMatches > 0) {
    reasons.push(`${domainMatches} domain matches`);
  }

  return {
    name: project.name,
    relevanceScore: Math.min(100, score),
    reason: reasons.join("; ") || "Limited relevance signals",
    signals: signals.slice(0, 5),
  };
}

// ─── Experience Scoring ───────────────────────────────────────────────────

type ExperienceInput = {
  company: string;
  role: string;
  description?: string | null;
  transferableNarratives?: string[];
  professionalThemes?: string[];
  workEnvironment?: string[];
  metrics?: string[];
};

function scoreExperience(
  exp: ExperienceInput,
  jobSignals: JobSignals,
  fitAnalysis: {
    strengths: string[];
    gaps: string[];
  } | null
): RelevantExperience {
  const expText = [
    exp.company,
    exp.role,
    exp.description || "",
    (exp.transferableNarratives || []).join(" "),
    (exp.professionalThemes || []).join(" "),
  ].join(" ").toLowerCase();

  let score = 0;
  const signals: string[] = [];
  const reasons: string[] = [];

  // 1. Role relevance (0-30 points)
  const roleKeywords = ROLE_FAMILIES[jobSignals.roleFamily] || [];
  let roleMatches = 0;
  for (const keyword of roleKeywords) {
    if (expText.includes(keyword)) roleMatches++;
  }
  const roleScore = Math.min(30, roleMatches * 6);
  score += roleScore;
  if (roleMatches > 0) {
    signals.push(`role:${jobSignals.roleFamily}`);
    reasons.push(`${roleMatches} role-relevant signals`);
  }

  // 2. Seniority match (0-20 points)
  if (jobSignals.seniority === "senior" || jobSignals.seniority === "senior-staff") {
    if (expText.includes("senior") || expText.includes("lead") || expText.includes("principal")) {
      score += 20;
      signals.push("seniority:match");
      reasons.push("Seniority level aligned");
    }
  }

  // 3. Soft skills match (0-20 points)
  let softSkillMatches = 0;
  for (const skill of jobSignals.softSkillSignals) {
    const keywords = SOFT_SKILLS[skill] || [];
    for (const keyword of keywords) {
      if (expText.includes(keyword)) {
        softSkillMatches++;
        break;
      }
    }
  }
  const softSkillScore = Math.min(20, softSkillMatches * 7);
  score += softSkillScore;
  if (softSkillMatches > 0) {
    signals.push("soft-skills:match");
    reasons.push(`${softSkillMatches} soft skill matches`);
  }

  // 4. Experience intelligence signals (0-30 points)
  const hasNarratives = (exp.transferableNarratives || []).length > 0;
  const hasThemes = (exp.professionalThemes || []).length > 0;
  const hasMetrics = (exp.metrics || []).length > 0;

  if (hasNarratives) {
    score += 10;
    signals.push("ei:narratives");
  }
  if (hasThemes) {
    score += 10;
    signals.push("ei:themes");
  }
  if (hasMetrics) {
    score += 10;
    signals.push("ei:metrics");
    reasons.push("Quantified impact available");
  }

  return {
    company: exp.company,
    role: exp.role,
    relevanceScore: Math.min(100, score),
    reason: reasons.join("; ") || "Limited relevance signals",
    signals: signals.slice(0, 5),
  };
}

// ─── Main Builder ───────────────────────────────────────────────────────────

export function buildRelevanceContext(params: {
  job: {
    title: string | null;
    rawText: string | null;
  };
  projects: ProjectInput[];
  experiences: ExperienceInput[];
  fitAnalysis: {
    recommendedAngle: string;
    matchingSkills: string[];
    matchingProjects: string[];
    strengths: string[];
    gaps: string[];
    confidenceScore: number;
    seniorityDetected: string;
  } | null;
  profilePreferences?: {
    targetRoles?: string[];
    preferredIndustries?: string[];
  } | null;
}): RelevanceContext {
  const jobText = [params.job.title, params.job.rawText].filter(Boolean).join(" ") || "";

  // 1. Extract job signals
  const roleFamily = detectRoleFamily(jobText);
  const seniority = params.fitAnalysis?.seniorityDetected || detectSeniority(jobText);
  const domainSignals = extractDomainSignals(jobText);
  const technicalSignals = extractTechnicalSignals(jobText);
  const softSkillSignals = extractSoftSkillSignals(jobText);
  const mustHaveSignals = extractMustHaveSignals(jobText);
  const niceToHaveSignals = extractNiceToHaveSignals(jobText);

  const jobSignals: JobSignals = {
    roleFamily,
    seniority,
    domainSignals,
    technicalSignals,
    softSkillSignals,
    mustHaveSignals,
    niceToHaveSignals,
  };

  // 2. Score and filter projects
  const scoredProjects = params.projects.map((p) =>
    scoreProject(p, jobSignals, params.fitAnalysis)
  );
  const relevantProjects = scoredProjects
    .filter((p) => p.relevanceScore >= 40)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);

  // 3. Score and filter experiences
  const scoredExperiences = params.experiences.map((e) =>
    scoreExperience(e, jobSignals, params.fitAnalysis)
  );
  const relevantExperiences = scoredExperiences
    .filter((e) => e.relevanceScore >= 40)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 5);

  // 4. Extract top strengths and gaps
  const topStrengths = (params.fitAnalysis?.strengths || []).slice(0, 3);
  const topGaps = (params.fitAnalysis?.gaps || []).slice(0, 3);

  // 5. Generate positioning hints
  const positioningHints: string[] = [];

  if (roleFamily !== "general") {
    positioningHints.push(`Position as ${roleFamily.replace(/-/g, " ")}`);
  }

  if (seniority === "senior" || seniority === "senior-staff") {
    positioningHints.push("Emphasize leadership and system ownership");
  }

  if (domainSignals.includes("ai-ml")) {
    positioningHints.push("Highlight any AI/ML tooling or experimentation");
  }

  if (softSkillSignals.includes("communication")) {
    positioningHints.push("Lead with clear communication examples");
  }

  if (topGaps.length > 0) {
    positioningHints.push(`Prepare response for: ${topGaps[0]}`);
  }

  // Log for debugging
  console.log("[relevance/engine] jobSignals:", {
    roleFamily,
    seniority,
    domainCount: domainSignals.length,
    techCount: technicalSignals.length,
  });
  console.log(`[relevance/engine] projects: ${relevantProjects.length} relevant (scored ${scoredProjects.length})`);
  console.log(`[relevance/engine] experiences: ${relevantExperiences.length} relevant (scored ${scoredExperiences.length})`);

  return {
    jobSignals,
    relevantProjects,
    relevantExperiences,
    topStrengths,
    topGaps,
    positioningHints: positioningHints.slice(0, 5),
  };
}

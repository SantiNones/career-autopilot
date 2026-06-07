/**
 * Relevance Engine V1.1
 *
 * Family-based transferable capability scoring.
 * Focus: What the candidate CAN DO, not just keyword matches.
 */

import {
  CapabilityFamily,
  classifyTextFamilies,
  calculateFamilyOverlap,
  calculateTransferabilityBonus,
} from "./relevance/capabilityFamilies";

export type JobSignals = {
  roleFamily: string;
  seniority: string;
  domainSignals: string[];
  technicalSignals: string[];
  softSkillSignals: string[];
  mustHaveSignals: string[];
  niceToHaveSignals: string[];
  capabilityFamilies: CapabilityFamily[];
};

export type RelevantProject = {
  name: string;
  relevanceScore: number;
  reason: string;
  signals: string[];
  families: CapabilityFamily[];
};

export type RelevantExperience = {
  company: string;
  role: string;
  relevanceScore: number;
  reason: string;
  signals: string[];
  families: CapabilityFamily[];
};

export type RelevanceContext = {
  jobSignals: JobSignals;
  relevantProjects: RelevantProject[];
  relevantExperiences: RelevantExperience[];
  topStrengths: string[];
  topGaps: string[];
  positioningHints: string[];
};

// ─── Scoring Configuration ──────────────────────────────────────────────────

const SCORE_WEIGHTS = {
  familyOverlap: 40,      // Exact family match
  transferability: 25,    // Transferable family bonus
  fitAnalysis: 25,        // Explicit fit analysis mention
  technologyOverlap: 10,  // Keyword overlap (secondary)
} as const;

const RELEVANCE_THRESHOLD = 50;  // Minimum score to be considered relevant
const FALLBACK_COUNT = 2;        // If nothing passes threshold, return top N
const MAX_ITEMS = 5;             // Maximum items to return

// ─── Input Types ────────────────────────────────────────────────────────────

type ProjectInput = {
  name: string;
  description?: string | null;
  technologies?: string[] | null;
  keyFeatures?: string[] | null;
};

type ExperienceInput = {
  company: string;
  role: string;
  description?: string | null;
  transferableNarratives?: string[];
  professionalThemes?: string[];
  workEnvironment?: string[];
  metrics?: string[];
};

// ─── Classification Helpers ─────────────────────────────────────────────────

function classifyJobFamilies(jobText: string): CapabilityFamily[] {
  return classifyTextFamilies(jobText);
}

function classifyProjectFamilies(project: ProjectInput): CapabilityFamily[] {
  const text = [
    project.name,
    project.description || "",
    (project.technologies || []).join(" "),
    (project.keyFeatures || []).join(" "),
  ].join(" ");
  return classifyTextFamilies(text);
}

function classifyExperienceFamilies(exp: ExperienceInput): CapabilityFamily[] {
  const text = [
    exp.company,
    exp.role,
    exp.description || "",
    (exp.transferableNarratives || []).join(" "),
    (exp.professionalThemes || []).join(" "),
    (exp.workEnvironment || []).join(" "),
  ].join(" ");
  return classifyTextFamilies(text);
}

function calculateTechOverlap(source: string, target: string): number {
  const sourceWords = new Set(source.toLowerCase().split(/\s+/));
  const targetWords = target.toLowerCase().split(/\s+/);
  if (sourceWords.size === 0 || targetWords.length === 0) return 0;

  let matches = 0;
  for (const word of targetWords) {
    if (sourceWords.has(word)) matches++;
  }

  return Math.round((matches / targetWords.length) * 100);
}

function detectSeniority(jobText: string): string {
  const text = jobText.toLowerCase();
  if (text.includes("senior staff") || text.includes("principal") || text.includes("staff engineer")) return "senior-staff";
  if (text.includes("senior") || text.includes("sr.") || text.includes("lead")) return "senior";
  if (text.includes("junior") || text.includes("jr.") || text.includes("entry")) return "junior";
  if (text.includes("intern")) return "intern";
  return "mid";
}

// ─── Project Scoring ──────────────────────────────────────────────────────

function scoreProject(
  project: ProjectInput,
  jobFamilies: CapabilityFamily[],
  jobText: string,
  fitAnalysis: {
    matchingProjects: string[];
    strengths: string[];
    gaps: string[];
  } | null
): RelevantProject {
  const projectFamilies = classifyProjectFamilies(project);
  const projectText = [
    project.name,
    project.description || "",
    (project.technologies || []).join(" "),
  ].join(" ");

  let score = 0;
  const signals: string[] = [];
  const reasons: string[] = [];

  // 1. Family overlap (exact capability match)
  const familyOverlap = calculateFamilyOverlap(projectFamilies, jobFamilies);
  score += Math.round((familyOverlap / 100) * SCORE_WEIGHTS.familyOverlap);
  if (familyOverlap > 0) {
    signals.push(`families:${projectFamilies.slice(0, 3).join(",")}`);
    reasons.push(`${familyOverlap}% family overlap`);
  }

  // 2. Transferability bonus (transferable capabilities)
  const transferBonus = calculateTransferabilityBonus(projectFamilies, jobFamilies);
  score += Math.min(SCORE_WEIGHTS.transferability, transferBonus);
  if (transferBonus > 0) {
    signals.push("transferability:bonus");
    reasons.push(`${transferBonus} transferability bonus`);
  }

  // 3. Fit analysis match (explicit mention)
  if (fitAnalysis?.matchingProjects.some((p) =>
    project.name.toLowerCase().includes(p.toLowerCase()) ||
    p.toLowerCase().includes(project.name.toLowerCase())
  )) {
    score += SCORE_WEIGHTS.fitAnalysis;
    signals.push("fit:explicit");
    reasons.push("Explicitly mentioned in fit analysis");
  }

  // 4. Technology overlap (secondary)
  const techOverlap = calculateTechOverlap(projectText, jobText);
  score += Math.round((techOverlap / 100) * SCORE_WEIGHTS.technologyOverlap);

  return {
    name: project.name,
    relevanceScore: Math.min(100, score),
    reason: reasons.join("; ") || "Limited relevance signals",
    signals: signals.slice(0, 5),
    families: projectFamilies,
  };
}

// ─── Experience Scoring ───────────────────────────────────────────────────

function scoreExperience(
  exp: ExperienceInput,
  jobFamilies: CapabilityFamily[],
  jobText: string,
  fitAnalysis: {
    strengths: string[];
    gaps: string[];
  } | null
): RelevantExperience {
  const expFamilies = classifyExperienceFamilies(exp);
  const expText = [
    exp.company,
    exp.role,
    exp.description || "",
    (exp.transferableNarratives || []).join(" "),
    (exp.professionalThemes || []).join(" "),
  ].join(" ");

  let score = 0;
  const signals: string[] = [];
  const reasons: string[] = [];

  // 1. Family overlap (exact capability match)
  const familyOverlap = calculateFamilyOverlap(expFamilies, jobFamilies);
  score += Math.round((familyOverlap / 100) * SCORE_WEIGHTS.familyOverlap);
  if (familyOverlap > 0) {
    signals.push(`families:${expFamilies.slice(0, 3).join(",")}`);
    reasons.push(`${familyOverlap}% family overlap`);
  }

  // 2. Transferability bonus
  const transferBonus = calculateTransferabilityBonus(expFamilies, jobFamilies);
  score += Math.min(SCORE_WEIGHTS.transferability, transferBonus);
  if (transferBonus > 0) {
    signals.push("transferability:bonus");
    reasons.push(`${transferBonus} transferability bonus`);
  }

  // 3. Experience Intelligence quality bonus
  const hasNarratives = (exp.transferableNarratives || []).length > 0;
  const hasThemes = (exp.professionalThemes || []).length > 0;
  const hasMetrics = (exp.metrics || []).length > 0;
  const eiBonus = (hasNarratives ? 5 : 0) + (hasThemes ? 5 : 0) + (hasMetrics ? 5 : 0);
  score += eiBonus;
  if (eiBonus > 0) {
    signals.push("ei:quality");
    reasons.push(`${eiBonus} EI quality bonus`);
  }

  // 4. Technology overlap (secondary)
  const techOverlap = calculateTechOverlap(expText, jobText);
  score += Math.round((techOverlap / 100) * SCORE_WEIGHTS.technologyOverlap);

  return {
    company: exp.company,
    role: exp.role,
    relevanceScore: Math.min(100, score),
    reason: reasons.join("; ") || "Limited relevance signals",
    signals: signals.slice(0, 5),
    families: expFamilies,
  };
}

// ─── Selection Logic ────────────────────────────────────────────────────────

function selectItems<T extends { relevanceScore: number }>(
  scoredItems: T[],
  threshold: number,
  maxItems: number,
  fallbackCount: number
): T[] {
  // Filter by threshold
  const passing = scoredItems
    .filter((item) => item.relevanceScore >= threshold)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  if (passing.length > 0) {
    return passing.slice(0, maxItems);
  }

  // Fallback: return top N by score (even below threshold)
  // This ensures we NEVER return 0 items if data exists
  console.log(`[relevance/selection] Fallback: no items passed threshold ${threshold}, returning top ${fallbackCount}`);
  return scoredItems
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, fallbackCount);
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

  // 1. Classify job and extract signals
  const jobFamilies = classifyJobFamilies(jobText);
  const seniority = params.fitAnalysis?.seniorityDetected || detectSeniority(jobText);

  const jobSignals: JobSignals = {
    roleFamily: jobFamilies[0] || "general",
    seniority,
    domainSignals: [],
    technicalSignals: [],
    softSkillSignals: [],
    mustHaveSignals: [],
    niceToHaveSignals: [],
    capabilityFamilies: jobFamilies,
  };

  // 2. Score all projects
  const scoredProjects = params.projects.map((p) =>
    scoreProject(p, jobFamilies, jobText, params.fitAnalysis)
  );

  // 3. Score all experiences
  const scoredExperiences = params.experiences.map((e) =>
    scoreExperience(e, jobFamilies, jobText, params.fitAnalysis)
  );

  // 4. Select relevant items (with mandatory fallback)
  const relevantProjects = selectItems(scoredProjects, RELEVANCE_THRESHOLD, MAX_ITEMS, FALLBACK_COUNT);
  const relevantExperiences = selectItems(scoredExperiences, RELEVANCE_THRESHOLD, MAX_ITEMS, FALLBACK_COUNT);

  // 5. Extract strengths and gaps
  const topStrengths = (params.fitAnalysis?.strengths || []).slice(0, 3);
  const topGaps = (params.fitAnalysis?.gaps || []).slice(0, 3);

  // 6. Generate positioning hints
  const positioningHints: string[] = [];

  if (jobFamilies.length > 0) {
    positioningHints.push(`Position as ${jobFamilies.slice(0, 2).join(" + ").replace(/_/g, " ")}`);
  }

  if (seniority === "senior" || seniority === "senior-staff") {
    positioningHints.push("Emphasize leadership and system ownership");
  }

  if (jobFamilies.includes("AI_AUTOMATION")) {
    positioningHints.push("Highlight any AI/ML tooling or experimentation");
  }

  if (jobFamilies.includes("COMMUNICATION")) {
    positioningHints.push("Lead with clear communication examples");
  }

  if (topGaps.length > 0) {
    positioningHints.push(`Prepare response for: ${topGaps[0]}`);
  }

  // 7. Debug logging with family info
  console.log("[relevance/engine] jobFamilies:", jobFamilies.join(", ") || "none");
  console.log("[relevance/engine] seniority:", seniority);

  for (const p of scoredProjects) {
    console.log(`[relevance] ${p.name}: score=${p.relevanceScore}, families=[${p.families.slice(0, 3).join(",")}]`);
  }
  for (const e of scoredExperiences) {
    console.log(`[relevance] ${e.company}: score=${e.relevanceScore}, families=[${e.families.slice(0, 3).join(",")}]`);
  }

  console.log(`[positioning/relevance] selected projects: ${relevantProjects.map(p => `${p.name}(${p.relevanceScore})`).join(", ") || "none"}`);
  console.log(`[positioning/relevance] selected experiences: ${relevantExperiences.map(e => `${e.company}(${e.relevanceScore})`).join(", ") || "none"}`);

  return {
    jobSignals,
    relevantProjects,
    relevantExperiences,
    topStrengths,
    topGaps,
    positioningHints: positioningHints.slice(0, 5),
  };
}

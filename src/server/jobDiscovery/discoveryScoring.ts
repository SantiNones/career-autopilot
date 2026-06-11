import type { CandidatePreferences, JobLabel } from "@prisma/client";
import { scoreJob } from "@/server/jobScoring";
import { classifyLocationEligibility, type LocationEligibility } from "./classifiers/locationEligibility";
import { classifySeniority, type SeniorityClassification } from "./classifiers/seniorityClassification";
import { classifyRoleIntent, type RoleIntentClassification } from "./classifiers/roleIntentClassification";
import { analyzeFitV2, type FitAnalysisV2 } from "@/server/jobScoring/fitAnalysisV2";

export type DiscoveryScore = {
  matchScore: number;
  label: string; // Changed from JobLabel to string for consistency
  reasons: string[];
  risks: string[];
  gaps: string[];
  locationEligibility: LocationEligibility;
  seniorityClassification: SeniorityClassification;
  roleIntent: RoleIntentClassification;
  queryMatch?: {
    matches: boolean;
    reason: string;
  };
  baseScore: number;
  finalScore: number;
  // V2 Scoring Fields
  discoveryScore: number;
  fitScore: number;
  positionabilityScore: number;
  finalVerdict: string;
  fitReasons: string[];
  fitRisks: string[];
  fitGaps: string[];
  fitBreakdown: unknown;
  positionabilityBreakdown: unknown;
};

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

export function discoveryScoreJob(
  job: { 
    title: string; 
    company: string; 
    location: string | null; 
    description: string | null;
    applyUrl: string;
    source: string;
    provider: string;
  },
  prefs: CandidatePreferences | null,
  query?: string
): DiscoveryScore {
  const reasons: string[] = [];
  const risks: string[] = [];
  const gaps: string[] = [];

  // Extract preference arrays
  const preferredLocations = toStringArray(prefs?.preferredLocations);
  const preferredCountries = toStringArray(prefs?.preferredCountries);
  const remotePreference = prefs?.remotePreference || "any";
  const openToRelocation = prefs?.openToRelocation || false;
  const excludedCountries = toStringArray(prefs?.excludedCountries);
  const targetRoleKeywords = toStringArray(prefs?.targetRoleKeywords);
  const excludedRoleKeywords = toStringArray(prefs?.excludedRoleKeywords);
  const allowedSeniorities = toStringArray(prefs?.allowedSeniorities);

  // Get classifications
  const locationEligibility = classifyLocationEligibility(job, {
    preferredLocations,
    preferredCountries,
    remotePreference,
    openToRelocation,
    excludedCountries
  });

  const seniorityClassification = classifySeniority(job, {
    allowedSeniorities,
    excludedRoleKeywords
  });

  const roleIntent = classifyRoleIntent(job);

  // Define commonly used variables
  const titleLower = job.title.toLowerCase();
  const descLower = (job.description || "").toLowerCase();
  const locationLower = (job.location || "").toLowerCase();

  // V1.3: Query-aware matching
  let queryMatch = { matches: false, reason: "" };
  if (query) {
    const queryLower = query.toLowerCase();
    
    // Location-based queries
    if (queryLower.includes("barcelona") || queryLower.includes("spain")) {
      if (locationLower.includes("barcelona") || locationLower.includes("spain")) {
        queryMatch = { matches: true, reason: "Location matches Barcelona/Spain query" };
      } else if (locationLower.includes("remote") && locationLower.includes("europe")) {
        queryMatch = { matches: true, reason: "Remote Europe matches Spain query" };
      }
    } else if (queryLower.includes("remote europe") || queryLower.includes("europe")) {
      if (locationLower.includes("europe") || locationLower.includes("emea") || 
          locationLower.includes("eu") || locationLower.includes("european union")) {
        queryMatch = { matches: true, reason: "Location matches Europe query" };
      } else if (locationLower.includes("remote") && !locationLower.includes("us")) {
        queryMatch = { matches: true, reason: "Global remote matches Europe query" };
      }
    }
    
    // Role-based queries
    if (queryLower.includes("support")) {
      if (roleIntent.roleFamily === "product_support" || roleIntent.roleFamily === "solutions_engineering") {
        queryMatch = { matches: true, reason: "Role matches support query" };
      }
    } else if (queryLower.includes("ai")) {
      if (roleIntent.roleFamily === "ai_engineering" || 
          titleLower.includes("ai") || titleLower.includes("llm") || 
          titleLower.includes("automation") || titleLower.includes("machine learning")) {
        queryMatch = { matches: true, reason: "Role matches AI query" };
      }
    } else if (queryLower.includes("junior")) {
      if (seniorityClassification.level === "junior" || seniorityClassification.level === "internship") {
        queryMatch = { matches: true, reason: "Seniority matches junior query" };
      }
    } else if (queryLower.includes("frontend")) {
      if (roleIntent.roleFamily === "frontend") {
        queryMatch = { matches: true, reason: "Role matches frontend query" };
      }
    } else if (queryLower.includes("backend")) {
      if (roleIntent.roleFamily === "backend") {
        queryMatch = { matches: true, reason: "Role matches backend query" };
      }
    }
  }

  // Get base score from existing scoring system
  const jobText = `${job.title}\n${job.company}\n${job.location || ""}\n${job.description || ""}`;
  const baseScoring = scoreJob(jobText, prefs);
  
  let finalScore = baseScoring.totalScore;
  const baseScore = baseScoring.totalScore;

  // V1.3: Hard cap rules and specific bonuses
  let maxScore = 100;
  let maxLabel: JobLabel = "APPLY";

  // Hard cap rules
  if (!locationEligibility.eligible) {
    maxScore = 55;
    maxLabel = "MAYBE";
    risks.push(`Location not eligible: ${locationEligibility.reason}`);
  }

  if (!seniorityClassification.allowed) {
    maxScore = Math.min(maxScore, 55);
    maxLabel = maxLabel === "APPLY" ? "MAYBE" : "SKIP";
    risks.push(`Seniority not allowed: ${seniorityClassification.reason}`);
  }

  if (!roleIntent.isTargetRole && roleIntent.roleFamily !== "unknown") {
    maxScore = Math.min(maxScore, 50);
    maxLabel = "SKIP";
    risks.push(`Role family not target: ${roleIntent.roleFamily}`);
  }

  if (query && !queryMatch.matches) {
    maxScore = Math.min(maxScore, 55);
    maxLabel = "MAYBE";
    risks.push(`Job does not match query intent: ${query}`);
  }

  // Apply penalties
  if (!locationEligibility.eligible) {
    finalScore -= 35;
  }

  if (!seniorityClassification.allowed) {
    finalScore -= 30;
  }

  if (locationEligibility.category === "remote_us_only") {
    finalScore -= 35;
    risks.push("Remote position is US-only");
  }

  // Apply bonuses
  if (roleIntent.isTargetRole) {
    finalScore += 15;
    reasons.push(`Role family matches target: ${roleIntent.roleFamily}`);
  }

  if (queryMatch.matches) {
    finalScore += 10;
    reasons.push(queryMatch.reason);
  }

  // Location bonuses
  if (locationEligibility.category === "spain" || locationEligibility.category === "barcelona") {
    finalScore += 10;
    reasons.push("Spain/Barcelona location");
  } else if (locationEligibility.category === "europe" || locationEligibility.category === "remote_europe") {
    finalScore += 10;
    reasons.push("Europe/Remote Europe location");
  }

  // Role-specific bonuses
  const roleBonusKeywords = ["ai", "automation", "fullstack", "support", "solutions", "implementation"];
  if (roleBonusKeywords.some(keyword => titleLower.includes(keyword))) {
    finalScore += 10;
    const matchedKeyword = roleBonusKeywords.find(keyword => titleLower.includes(keyword));
    reasons.push(`Role keywords match: ${matchedKeyword}`);
  }

  if (seniorityClassification.level === "junior" || seniorityClassification.level === "internship") {
    finalScore += 5;
    reasons.push("Junior/New Grad title signal");
  }

  // Check for target role keywords in title
  const foundTargetKeyword = targetRoleKeywords.find(keyword => 
    titleLower.includes(keyword.toLowerCase())
  );
  if (foundTargetKeyword) {
    finalScore += 15;
    reasons.push(`Role matches target keyword: ${foundTargetKeyword}`);
  }

  // Check for target role keywords in description
  const descriptionLower = (job.description || "").toLowerCase();
  const foundTargetKeywordInDesc = targetRoleKeywords.find(keyword => 
    descriptionLower.includes(keyword.toLowerCase())
  );
  if (foundTargetKeywordInDesc && foundTargetKeywordInDesc !== foundTargetKeyword) {
    finalScore += 8;
    reasons.push(`Description matches target keyword: ${foundTargetKeywordInDesc}`);
  }

  // Bonus for AI/fullstack/support/solutions overlap
  const bonusKeywords = ["ai", "automation", "full stack", "fullstack", "support", "solutions", "customer engineer", "implementation"];
  const foundBonusKeyword = bonusKeywords.find(keyword => 
    titleLower.includes(keyword.toLowerCase())
  );
  if (foundBonusKeyword) {
    finalScore += 10;
    reasons.push(`Role includes preferred technology/area: ${foundBonusKeyword}`);
  }

  // Ensure score stays within bounds
  finalScore = Math.max(0, Math.min(100, finalScore));

  // Merge reasons and risks from base scoring
  reasons.push(...baseScoring.reasons);
  risks.push(...baseScoring.risks);
  gaps.push(...baseScoring.gaps);

  // Apply hard cap
  finalScore = Math.min(finalScore, maxScore);

  // Determine label based on V1.3 rules
  let label: JobLabel = maxLabel;
  if (maxLabel === "APPLY") {
    if (finalScore >= 80) {
      label = "APPLY";
    } else if (finalScore >= 60) {
      label = "MAYBE";
    } else {
      label = "SKIP";
    }
  }

  // Add location and seniority info to reasons
  if (locationEligibility.eligible) {
    reasons.push(`Location eligible: ${locationEligibility.reason}`);
  }
  
  if (seniorityClassification.allowed) {
    reasons.push(`Seniority eligible: ${seniorityClassification.reason}`);
  }

  // Calculate V2 Fit Analysis
  const jobTextForFitAnalysis = `${job.title} ${job.description || ''}`;
  
  // Extract candidate profile data from preferences and defaults
  const candidateTechnologies = toStringArray(prefs?.positiveKeywords).length > 0 
    ? toStringArray(prefs?.positiveKeywords)
    : ['javascript', 'typescript', 'python', 'react', 'node.js'];
  
  const candidateLanguages = ['English']; // Default language, can be extended from profile
  
  const candidateProfile = {
    yearsExperience: 3, // Default - will be extracted from CV when available
    technologies: candidateTechnologies,
    domains: ['software engineering'], // Default - can be enhanced from experience
    credentials: [], // Will be extracted from CV when available
    languages: candidateLanguages,
    location: 'Spain', // Default - can be extracted from profile
    openToRelocation: prefs?.openToRelocation || false,
    preferredCountries: toStringArray(prefs?.preferredCountries),
    excludedCountries: toStringArray(prefs?.excludedCountries),
    projects: ['AI-powered applications', 'Full-stack web development'], // Will be extracted from CV
    customerFacingExperience: true, // Default assumption
    narrativeStrength: 75, // Default assessment
    adjacentSkills: ['AI/ML', 'Product development', 'Technical consulting'] // Default
  };
  
  const fitAnalysis = analyzeFitV2(jobTextForFitAnalysis, prefs, finalScore, candidateProfile);

  // Use V2 final verdict instead of V1.3 label
  const finalVerdict = fitAnalysis.finalVerdict;

  // Debug logging for top jobs (will be handled by caller)
  if (finalScore >= 60) {
    console.log(`[discovery-score] title: ${job.title}`);
    console.log(`[discovery-score] company: ${job.company}`);
    console.log(`[discovery-score] location: ${job.location}`);
    console.log(`[discovery-score] locationEligibility: ${locationEligibility.category} (${locationEligibility.eligible})`);
    console.log(`[discovery-score] seniority: ${seniorityClassification.level} (${seniorityClassification.allowed})`);
    console.log(`[discovery-score] baseScore: ${baseScore}`);
    console.log(`[discovery-score] finalScore: ${finalScore}`);
    console.log(`[discovery-score] V2 discoveryScore: ${fitAnalysis.discoveryScore}`);
    console.log(`[discovery-score] V2 fitScore: ${fitAnalysis.fitScore}`);
    console.log(`[discovery-score] V2 positionabilityScore: ${fitAnalysis.positionabilityScore}`);
    console.log(`[discovery-score] V2 finalVerdict: ${finalVerdict}`);
    console.log(`[discovery-score] reasons: ${reasons.slice(0, 3).join("; ")}`);
    console.log(`[discovery-score] risks: ${risks.slice(0, 3).join("; ")}`);
    console.log(`[discovery-score] ---`);
  }

  return {
    matchScore: finalScore,
    label,
    reasons,
    risks,
    gaps,
    locationEligibility,
    seniorityClassification,
    roleIntent,
    queryMatch,
    baseScore,
    finalScore,
    // V2 Scoring Fields
    discoveryScore: fitAnalysis.discoveryScore,
    fitScore: fitAnalysis.fitScore,
    positionabilityScore: fitAnalysis.positionabilityScore,
    finalVerdict: fitAnalysis.finalVerdict,
    fitReasons: fitAnalysis.fitReasons,
    fitRisks: fitAnalysis.fitRisks,
    fitGaps: fitAnalysis.fitGaps,
    fitBreakdown: fitAnalysis.fitBreakdown,
    positionabilityBreakdown: fitAnalysis.positionabilityBreakdown
  };
}

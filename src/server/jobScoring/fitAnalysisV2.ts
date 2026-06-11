/**
 * Fit Analysis V2 - Separate scoring for Discovery, Fit, and Positionability
 * 
 * This implements the new scoring architecture where:
 * - Discovery Score: How relevant the job is to the user's search/preferences
 * - Fit Score: How realistically the candidate matches the requirements
 * - Positionability Score: Can we build a credible interview narrative despite gaps
 */

import type { CandidatePreferences, JobLabel } from "@prisma/client";
import { 
  extractAllRequirements, 
  type ExtractedRequirements 
} from "./requirementExtraction";

export interface FitScoreComponents {
  experienceFit: number;
  seniorityFit: number;
  stackFit: number;
  domainFit: number;
  geographyFit: number;
  languageFit: number;
  honestyFit: number;
}

export interface PositionabilityFactors {
  relevantProjects: number;
  transferableExperience: number;
  customerFacingExperience: number;
  narrativeStrength: number;
  adjacentSkills: number;
}

export interface FitAnalysisV2 {
  discoveryScore: number;
  fitScore: number;
  positionabilityScore: number;
  finalVerdict: string;
  fitReasons: string[];
  fitRisks: string[];
  fitGaps: string[];
  fitBreakdown: FitScoreComponents;
  positionabilityBreakdown: PositionabilityFactors;
}

/**
 * Calculate Fit Score based on actual candidate compatibility
 */
export function calculateFitScore(
  jobText: string,
  candidatePrefs: CandidatePreferences | null,
  candidateProfile?: {
    yearsExperience?: number;
    technologies?: string[];
    domains?: string[];
    credentials?: string[];
    languages?: string[];
    location?: string;
    openToRelocation?: boolean;
    preferredCountries?: string[];
    excludedCountries?: string[];
  }
): {
  score: number;
  components: FitScoreComponents;
  reasons: string[];
  risks: string[];
  gaps: string[];
} {
  const requirements = extractAllRequirements(jobText);
  const reasons: string[] = [];
  const risks: string[] = [];
  const gaps: string[] = [];

  // Initialize components
  const components: FitScoreComponents = {
    experienceFit: 0,
    seniorityFit: 0,
    stackFit: 0,
    domainFit: 0,
    geographyFit: 0,
    languageFit: 0,
    honestyFit: 0,
  };

  // Experience Fit (25% weight)
  if (requirements.requiredYears && candidateProfile?.yearsExperience) {
    const required = requirements.requiredYears;
    const candidate = candidateProfile.yearsExperience;
    
    if (candidate >= required) {
      components.experienceFit = 100;
      reasons.push(`Meets ${required}+ years experience requirement (${candidate} years)`);
    } else if (candidate >= required * 0.8) {
      components.experienceFit = 75;
      reasons.push(`Close to experience requirement (${candidate} vs ${required}+ years)`);
      gaps.push(`Slightly below required experience (${required - candidate} years gap)`);
    } else if (candidate >= required * 0.6) {
      components.experienceFit = 50;
      reasons.push(`Some relevant experience (${candidate} vs ${required}+ years)`);
      gaps.push(`Significant experience gap (${required - candidate} years)`);
      risks.push(`May not meet minimum experience expectations`);
    } else {
      components.experienceFit = 25;
      gaps.push(`Major experience gap (${required - candidate} years)`);
      risks.push(`Likely does not meet minimum experience requirements`);
    }
  } else if (!requirements.requiredYears) {
    components.experienceFit = 100;
    reasons.push('No specific experience requirement');
  } else {
    components.experienceFit = 50;
    gaps.push('Experience requirement unclear');
  }

  // Seniority Fit (20% weight)
  if (requirements.seniorityLevel) {
    const candidateSeniority = candidatePrefs?.targetSeniority || 'mid';
    
    if (requirements.seniorityLevel === candidateSeniority) {
      components.seniorityFit = 100;
      reasons.push(`Seniority level matches (${requirements.seniorityLevel})`);
    } else if (
      (requirements.seniorityLevel === 'junior' && candidateSeniority === 'mid') ||
      (requirements.seniorityLevel === 'mid' && candidateSeniority === 'senior')
    ) {
      components.seniorityFit = 80;
      reasons.push(`Overqualified for seniority level (${candidateSeniority} vs ${requirements.seniorityLevel})`);
    } else if (
      (requirements.seniorityLevel === 'senior' && candidateSeniority === 'mid') ||
      (requirements.seniorityLevel === 'mid' && candidateSeniority === 'junior')
    ) {
      components.seniorityFit = 40;
      gaps.push(`Seniority level mismatch (${candidateSeniority} vs ${requirements.seniorityLevel})`);
      risks.push(`May be perceived as underqualified`);
    } else {
      components.seniorityFit = 20;
      gaps.push(`Significant seniority mismatch`);
      risks.push(`Major seniority incompatibility`);
    }
  } else {
    components.seniorityFit = 100;
    reasons.push('No specific seniority requirement');
  }

  // Stack Fit (20% weight)
  if (requirements.requiredTechnologies.length > 0) {
    const candidateStack = candidateProfile?.technologies || [];
    const requiredStack = requirements.requiredTechnologies;
    
    const overlap = requiredStack.filter(tech => 
      candidateStack.some(candidate => 
        candidate.toLowerCase().includes(tech.toLowerCase()) ||
        tech.toLowerCase().includes(candidate.toLowerCase())
      )
    );
    
    const overlapPercentage = (overlap.length / requiredStack.length) * 100;
    components.stackFit = Math.round(overlapPercentage);
    
    if (overlapPercentage >= 80) {
      reasons.push(`Strong stack match (${overlap.length}/${requiredStack.length} technologies)`);
    } else if (overlapPercentage >= 60) {
      reasons.push(`Good stack match (${overlap.length}/${requiredStack.length} technologies)`);
      gaps.push(`Missing some required technologies: ${requiredStack.filter(t => !overlap.includes(t)).join(', ')}`);
    } else if (overlapPercentage >= 40) {
      reasons.push(`Partial stack match (${overlap.length}/${requiredStack.length} technologies)`);
      gaps.push(`Missing many required technologies: ${requiredStack.filter(t => !overlap.includes(t)).join(', ')}`);
      risks.push(`Significant technology gap may impact performance`);
    } else {
      gaps.push(`Major technology gap: ${requiredStack.join(', ')}`);
      risks.push(`Insufficient technology overlap for success`);
    }
  } else {
    components.stackFit = 100;
    reasons.push('No specific technology requirements');
  }

  // Domain Fit (15% weight)
  if (requirements.requiredDomains.length > 0) {
    const candidateDomains = candidateProfile?.domains || [];
    const requiredDomains = requirements.requiredDomains;
    
    const domainMatch = requiredDomains.some(domain =>
      candidateDomains.some(candidate =>
        candidate.toLowerCase().includes(domain.toLowerCase()) ||
        domain.toLowerCase().includes(candidate.toLowerCase())
      )
    );
    
    if (domainMatch) {
      components.domainFit = 100;
      reasons.push(`Relevant domain experience`);
    } else {
      components.domainFit = 50;
      gaps.push(`No direct domain experience in: ${requiredDomains.join(', ')}`);
      risks.push(`Domain knowledge gap may require learning curve`);
    }
  } else {
    components.domainFit = 100;
    reasons.push('No specific domain requirement');
  }

  // Geography Fit (10% weight)
  const locationConstraints = requirements.locationConstraints;
  if (locationConstraints.includes('US-only') && candidateProfile?.location?.toLowerCase().includes('spain')) {
    if (candidateProfile.openToRelocation) {
      components.geographyFit = 60;
      reasons.push('Open to relocation for US-only role');
      gaps.push('Requires relocation from Spain to US');
      risks.push('Relocation complexity and visa requirements');
    } else {
      components.geographyFit = 20;
      gaps.push('US-only location incompatible with Spain base');
      risks.push('Location incompatibility is a hard blocker');
    }
  } else if (locationConstraints.includes('On-site required')) {
    components.geographyFit = 70;
    reasons.push('On-site work acceptable');
    gaps.push('Requires on-site presence');
  } else {
    components.geographyFit = 100;
    reasons.push('Location compatible');
  }

  // Language Fit (5% weight)
  if (requirements.requiredLanguages.length > 0) {
    const candidateLanguages = candidateProfile?.languages || [];
    const requiredLanguages = requirements.requiredLanguages;
    
    const languageMatch = requiredLanguages.every(lang =>
      candidateLanguages.some(candidate =>
        candidate.toLowerCase() === lang.toLowerCase()
      )
    );
    
    if (languageMatch) {
      components.languageFit = 100;
      reasons.push(`Language requirements met: ${requiredLanguages.join(', ')}`);
    } else {
      components.languageFit = 50;
      gaps.push(`Language requirements: ${requiredLanguages.join(', ')}`);
      risks.push(`Language barrier may impact communication`);
    }
  } else {
    components.languageFit = 100;
    reasons.push('No specific language requirements');
  }

  // Honesty Fit (5% weight)
  const hasMajorGaps = gaps.some(gap => 
    gap.includes('Major') || gap.includes('Significant') || gap.includes('hard blocker')
  );
  
  if (hasMajorGaps) {
    components.honestyFit = 30;
    risks.push('Major gaps exist - honest assessment required');
  } else if (gaps.length > 0) {
    components.honestyFit = 70;
    reasons.push('Some gaps but overall honest fit');
  } else {
    components.honestyFit = 100;
    reasons.push('Strong, honest fit with no major gaps');
  }

  // Calculate weighted score
  const weightedScore = Math.round(
    components.experienceFit * 0.25 +
    components.seniorityFit * 0.20 +
    components.stackFit * 0.20 +
    components.domainFit * 0.15 +
    components.geographyFit * 0.10 +
    components.languageFit * 0.05 +
    components.honestyFit * 0.05
  );

  return {
    score: weightedScore,
    components,
    reasons,
    risks,
    gaps,
  };
}

/**
 * Calculate Positionability Score
 */
export function calculatePositionabilityScore(
  jobText: string,
  candidatePrefs: CandidatePreferences | null,
  candidateProfile?: {
    projects?: string[];
    customerFacingExperience?: boolean;
    narrativeStrength?: number;
    adjacentSkills?: string[];
  }
): {
  score: number;
  breakdown: PositionabilityFactors;
  reasons: string[];
  risks: string[];
} {
  const requirements = extractAllRequirements(jobText);
  const reasons: string[] = [];
  const risks: string[] = [];

  const breakdown: PositionabilityFactors = {
    relevantProjects: 0,
    transferableExperience: 0,
    customerFacingExperience: 0,
    narrativeStrength: 0,
    adjacentSkills: 0,
  };

  // Relevant Projects (30% weight)
  if (candidateProfile?.projects && candidateProfile.projects.length > 0) {
    breakdown.relevantProjects = 80;
    reasons.push(`Has ${candidateProfile.projects.length} relevant projects to showcase`);
  } else {
    breakdown.relevantProjects = 40;
    risks.push('Limited project portfolio to demonstrate capabilities');
  }

  // Transferable Experience (25% weight)
  const targetTitles = candidatePrefs?.targetTitles as string[] | undefined;
  const hasTransferableExperience = 
    targetTitles?.some(keyword => 
      jobText.toLowerCase().includes(keyword.toLowerCase())
    ) || false;
  
  if (hasTransferableExperience) {
    breakdown.transferableExperience = 85;
    reasons.push('Strong transferable experience alignment');
  } else {
    breakdown.transferableExperience = 60;
    reasons.push('Some transferable experience');
    risks.push('Limited direct transferable experience');
  }

  // Customer Facing Experience (20% weight)
  if (candidateProfile?.customerFacingExperience) {
    breakdown.customerFacingExperience = 90;
    reasons.push('Has customer-facing experience');
  } else if (jobText.toLowerCase().includes('customer') || jobText.toLowerCase().includes('client')) {
    breakdown.customerFacingExperience = 50;
    risks.push('Limited customer-facing experience for client-facing role');
    risks.push('May need to develop customer interaction skills');
  } else {
    breakdown.customerFacingExperience = 100;
    reasons.push('No customer-facing requirements');
  }

  // Narrative Strength (15% weight)
  const narrativeScore = candidateProfile?.narrativeStrength || 70;
  breakdown.narrativeStrength = narrativeScore;
  
  if (narrativeScore >= 80) {
    reasons.push('Strong narrative capability');
  } else if (narrativeScore >= 60) {
    reasons.push('Good narrative capability');
  } else {
    risks.push('Narrative needs development');
  }

  // Adjacent Skills (10% weight)
  if (candidateProfile?.adjacentSkills && candidateProfile.adjacentSkills.length > 0) {
    breakdown.adjacentSkills = 85;
    reasons.push(`Has adjacent skills: ${candidateProfile.adjacentSkills.join(', ')}`);
  } else {
    breakdown.adjacentSkills = 60;
    reasons.push('Limited adjacent skills');
  }

  // Calculate weighted score
  const weightedScore = Math.round(
    breakdown.relevantProjects * 0.30 +
    breakdown.transferableExperience * 0.25 +
    breakdown.customerFacingExperience * 0.20 +
    breakdown.narrativeStrength * 0.15 +
    breakdown.adjacentSkills * 0.10
  );

  return {
    score: weightedScore,
    breakdown,
    reasons,
    risks,
  };
}

/**
 * Calculate Final Verdict based on Fit and Positionability scores
 */
export function calculateFinalVerdict(
  fitScore: number,
  positionabilityScore: number,
  discoveryScore: number
): string {
  // APPLY: High fit and good positionability
  if (fitScore >= 75 && positionabilityScore >= 70) {
    return 'APPLY';
  }
  
  // APPLY_STRETCH: Lower fit but excellent positionability
  if (fitScore >= 50 && fitScore <= 74 && positionabilityScore >= 75) {
    return 'APPLY_STRETCH';
  }
  
  // MAYBE: Moderate fit or unclear data
  if (fitScore >= 45 && fitScore <= 65) {
    return 'MAYBE';
  }
  
  // SKIP: Low fit or hard blockers
  return 'SKIP';
}

/**
 * Main Fit Analysis V2 function
 */
export function analyzeFitV2(
  jobText: string,
  candidatePrefs: CandidatePreferences | null,
  discoveryScore: number,
  candidateProfile?: {
    yearsExperience?: number;
    technologies?: string[];
    domains?: string[];
    credentials?: string[];
    languages?: string[];
    location?: string;
    openToRelocation?: boolean;
    preferredCountries?: string[];
    excludedCountries?: string[];
    projects?: string[];
    customerFacingExperience?: boolean;
    narrativeStrength?: number;
    adjacentSkills?: string[];
  }
): FitAnalysisV2 {
  // Calculate Fit Score
  const fitAnalysis = calculateFitScore(jobText, candidatePrefs, candidateProfile);
  
  // Calculate Positionability Score
  const positionabilityAnalysis = calculatePositionabilityScore(jobText, candidatePrefs, candidateProfile);
  
  // Calculate Final Verdict
  const finalVerdict = calculateFinalVerdict(
    fitAnalysis.score,
    positionabilityAnalysis.score,
    discoveryScore
  );

  // Combine reasons, risks, and gaps
  const allReasons = [
    ...fitAnalysis.reasons,
    ...positionabilityAnalysis.reasons
  ];
  
  const allRisks = [
    ...fitAnalysis.risks,
    ...positionabilityAnalysis.risks
  ];
  
  const allGaps = [
    ...fitAnalysis.gaps,
    ...positionabilityAnalysis.risks.filter(r => r.includes('gap'))
  ];

  return {
    discoveryScore,
    fitScore: fitAnalysis.score,
    positionabilityScore: positionabilityAnalysis.score,
    finalVerdict,
    fitReasons: allReasons,
    fitRisks: allRisks,
    fitGaps: allGaps,
    fitBreakdown: fitAnalysis.components,
    positionabilityBreakdown: positionabilityAnalysis.breakdown,
  };
}

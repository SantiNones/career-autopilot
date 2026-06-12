import { JobPosting, CandidateIntelligence } from "@prisma/client";
import OpenAI from "openai";

const openai = new OpenAI();

interface JobRequirement {
  requirement: string;
  category: "Technical Skills" | "Experience" | "Languages" | "Domain Knowledge" | "Customer-facing Skills" | "Leadership" | "Product Experience" | "AI / ML Experience";
  importance: "critical" | "important" | "nice_to_have";
}

interface EvidenceMatch {
  requirement: string;
  evidence: string[];
  evidenceStrength: "strong" | "medium" | "weak" | "none";
  gap: string;
}

interface GapAnalysis {
  strongEvidence: string[];
  partialEvidence: string[];
  missingEvidence: string[];
}

interface FitAnalysisV3Result {
  requirements: JobRequirement[];
  evidenceMatches: EvidenceMatch[];
  gapAnalysis: GapAnalysis;
  score: number;
  scoreBreakdown: {
    strongEvidence: number;
    partialEvidence: number;
    weakEvidence: number;
    missingEvidence: number;
    criticalGaps: number;
  };
}

export async function analyzeFitV3(
  jobPosting: JobPosting,
  candidateIntelligence: CandidateIntelligence
): Promise<FitAnalysisV3Result> {
  
  console.log("[fit-analysis-v3] Starting evidence-based fit analysis");

  // Extract requirements from job description
  const requirements = await extractRequirements(jobPosting);
  console.log("[fit-analysis-v3] Extracted", requirements.length, "requirements");

  // Match evidence against requirements
  const evidenceMatches = await matchEvidence(requirements, candidateIntelligence);
  console.log("[fit-analysis-v3] Generated", evidenceMatches.length, "evidence matches");

  // Analyze gaps
  const gapAnalysis = analyzeGaps(evidenceMatches);

  // Calculate evidence-based score
  const score = calculateEvidenceScore(evidenceMatches, gapAnalysis);

  const scoreBreakdown = {
    strongEvidence: evidenceMatches.filter(m => m.evidenceStrength === 'strong').length * 10,
    partialEvidence: evidenceMatches.filter(m => m.evidenceStrength === 'medium').length * 5,
    weakEvidence: evidenceMatches.filter(m => m.evidenceStrength === 'weak').length * 2,
    missingEvidence: evidenceMatches.filter(m => m.evidenceStrength === 'none').length * -10,
    criticalGaps: evidenceMatches.filter(m => 
      m.evidenceStrength === 'none' && 
      requirements.find(r => r.requirement === m.requirement)?.importance === 'critical'
    ).length * -20
  };

  return {
    requirements,
    evidenceMatches,
    gapAnalysis,
    score,
    scoreBreakdown
  };
}

async function extractRequirements(jobPosting: JobPosting): Promise<JobRequirement[]> {
  const prompt = `
You are a job requirements analyst. Extract structured requirements from this job description.

JOB TITLE: ${jobPosting.title}
COMPANY: ${jobPosting.companyName}
DESCRIPTION: ${jobPosting.rawText}

CATEGORIES:
- Technical Skills
- Experience  
- Languages
- Domain Knowledge
- Customer-facing Skills
- Leadership
- Product Experience
- AI / ML Experience

IMPORTANCE LEVELS:
- critical: must-have requirement, deal-breaker if missing
- important: strong preference, significantly impacts fit
- nice_to_have: bonus skill, nice to have but not essential

For each requirement, extract:
- requirement: specific requirement (e.g., "Python programming", "3+ years software engineering")
- category: from the list above
- importance: critical | important | nice_to_have

Focus on:
1. Technical skills and technologies mentioned
2. Experience requirements (years, level, domain)
3. Language requirements
4. Industry/domain knowledge
5. Customer interaction requirements
6. Leadership or management expectations
7. Product development experience
8. AI/ML specific requirements

RETURN JSON with this exact structure:
{
  "requirements": [
    {
      "requirement": "specific_requirement",
      "category": "category_name", 
      "importance": "critical|important|nice_to_have"
    }
  ]
}

Be thorough but concise. Extract 5-15 key requirements.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a job requirements analyst. Always return valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const result = JSON.parse(content);
    return result.requirements || [];

  } catch (error) {
    console.error("[fit-analysis-v3] Error extracting requirements:", error);
    return [];
  }
}

async function matchEvidence(
  requirements: JobRequirement[],
  candidateIntelligence: CandidateIntelligence
): Promise<EvidenceMatch[]> {
  
  const ci = candidateIntelligence as any;
  const evidenceInventory = ci.evidenceInventory || [];
  
  const matches: EvidenceMatch[] = [];

  for (const requirement of requirements) {
    const match = await findMatchingEvidence(requirement, evidenceInventory, ci);
    matches.push(match);
  }

  return matches;
}

async function findMatchingEvidence(
  requirement: JobRequirement,
  evidenceInventory: any[],
  candidateIntelligence: any
): Promise<EvidenceMatch> {
  
  // Find evidence items that match the requirement
  const matchingEvidence = evidenceInventory.filter((evidence: any) => 
    isEvidenceMatching(requirement.requirement, evidence, candidateIntelligence)
  );

  if (matchingEvidence.length === 0) {
    return {
      requirement: requirement.requirement,
      evidence: [],
      evidenceStrength: "none",
      gap: `No evidence found for ${requirement.requirement}`
    };
  }

  // Determine evidence strength based on quality and quantity
  const strongEvidence = matchingEvidence.filter((e: any) => e.evidenceStrength === 'strong');
  const mediumEvidence = matchingEvidence.filter((e: any) => e.evidenceStrength === 'medium');
  const weakEvidence = matchingEvidence.filter((e: any) => e.evidenceStrength === 'weak');

  let evidenceStrength: "strong" | "medium" | "weak" | "none";
  let gap: string;

  if (strongEvidence.length > 0) {
    evidenceStrength = "strong";
    gap = "";
  } else if (mediumEvidence.length > 0) {
    evidenceStrength = "medium";
    gap = "Limited evidence depth";
  } else if (weakEvidence.length > 0) {
    evidenceStrength = "weak";
    gap = "Tangential evidence only";
  } else {
    evidenceStrength = "none";
    gap = "No matching evidence";
  }

  // Flatten evidence sources
  const evidenceSources = matchingEvidence.flatMap((e: any) => e.evidence || []);

  return {
    requirement: requirement.requirement,
    evidence: evidenceSources,
    evidenceStrength,
    gap
  };
}

function isEvidenceMatching(requirement: string, evidence: any, candidateIntelligence: any): boolean {
  const evidenceClaim = evidence.claim?.toLowerCase() || "";
  const requirementLower = requirement.toLowerCase();
  
  // Check if evidence claim contains requirement keywords
  const requirementKeywords = extractKeywords(requirementLower);
  
  // Direct claim matching
  if (requirementKeywords.some(keyword => evidenceClaim.includes(keyword))) {
    return true;
  }
  
  // Technical stack matching
  if (candidateIntelligence.technicalStack) {
    const techStack = Object.keys(candidateIntelligence.technicalStack).map(t => t.toLowerCase());
    if (requirementKeywords.some(keyword => techStack.some(tech => tech.includes(keyword)))) {
      return true;
    }
  }
  
  // Technical strengths matching
  if (candidateIntelligence.technicalStrengths) {
    const strengths = (candidateIntelligence.technicalStrengths as string[]).map(s => s.toLowerCase());
    if (requirementKeywords.some(keyword => strengths.some(strength => strength.includes(keyword)))) {
      return true;
    }
  }
  
  return false;
}

function extractKeywords(text: string): string[] {
  // Extract meaningful keywords from requirement
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['and', 'the', 'for', 'with', 'have', 'has', 'are', 'was', 'were', 'will', 'can', 'could', 'should', 'would'].includes(word));
  
  return [...new Set(words)];
}

function analyzeGaps(evidenceMatches: EvidenceMatch[]): GapAnalysis {
  const strongEvidence = evidenceMatches
    .filter(match => match.evidenceStrength === 'strong')
    .map(match => match.requirement);

  const partialEvidence = evidenceMatches
    .filter(match => match.evidenceStrength === 'medium')
    .map(match => match.requirement);

  const missingEvidence = evidenceMatches
    .filter(match => match.evidenceStrength === 'none')
    .map(match => match.requirement);

  return {
    strongEvidence,
    partialEvidence,
    missingEvidence
  };
}

function calculateEvidenceScore(evidenceMatches: EvidenceMatch[], gapAnalysis: GapAnalysis): number {
  let score = 0;
  
  evidenceMatches.forEach(match => {
    switch (match.evidenceStrength) {
      case 'strong':
        score += 10;
        break;
      case 'medium':
        score += 5;
        break;
      case 'weak':
        score += 2;
        break;
      case 'none':
        score -= 10;
        break;
    }
  });
  
  // Additional penalty for critical gaps
  const criticalGaps = evidenceMatches.filter(match => 
    match.evidenceStrength === 'none' && 
    match.requirement.includes('critical') // This is a simplification - in real implementation, we'd track importance
  );
  
  score -= criticalGaps.length * 20;
  
  return Math.max(0, Math.min(100, score)); // Clamp between 0-100
}

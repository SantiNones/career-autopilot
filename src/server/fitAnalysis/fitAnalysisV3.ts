import { JobPosting, CandidateIntelligence } from "@prisma/client";
import OpenAI from "openai";
import { extractRequirementsDeterministic } from "./deterministicExtractor";

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
  
  console.log("[v3-debug] ACTIVE FIT ANALYSIS V3 FUNCTION CALLED");

  const ciDebug = candidateIntelligence as any;
  const inventoryDebug = ciDebug.evidenceInventory || [];
  console.log("[v3-debug:input]");
  console.log(`  jobTitle: ${jobPosting.title}`);
  console.log(`  jobDescriptionLength: ${jobPosting.rawText?.length || 0}`);
  console.log(`  candidateIntelligenceExists: ${!!candidateIntelligence}`);
  console.log(`  evidenceInventoryCount: ${inventoryDebug.length}`);
  console.log(`  sampleEvidenceItem: ${JSON.stringify(inventoryDebug[0] || null)}`);

  // Extract requirements from job description
  const requirements = await extractRequirements(jobPosting);

  console.log("[v3-debug:requirements]");
  console.log(`  requirementsCount: ${requirements.length}`);
  requirements.forEach(r => {
    console.log(`  - ${r.requirement} | ${r.category} | ${r.importance}`);
  });

  if (requirements.length === 0) {
    throw new Error("Requirement extraction returned 0 requirements.");
  }

  // Match evidence against requirements
  const evidenceMatches = await matchEvidence(requirements, candidateIntelligence);
  console.log("[fit-analysis-v3] Generated", evidenceMatches.length, "evidence matches");

  // Analyze gaps
  const gapAnalysis = analyzeGaps(evidenceMatches);

  // Calculate evidence-based score
  const score = calculateEvidenceScore(evidenceMatches, gapAnalysis);

  const strongCount = evidenceMatches.filter(m => m.evidenceStrength === 'strong').length;
  const mediumCount = evidenceMatches.filter(m => m.evidenceStrength === 'medium').length;
  const weakCount = evidenceMatches.filter(m => m.evidenceStrength === 'weak').length;
  const noneCount = evidenceMatches.filter(m => m.evidenceStrength === 'none').length;
  const rawScore = strongCount * 10 + mediumCount * 5 + weakCount * 2 - noneCount * 10;
  console.log("[v3-debug:aggregation]");
  console.log(`  strongCount: ${strongCount}`);
  console.log(`  mediumCount: ${mediumCount}`);
  console.log(`  weakCount: ${weakCount}`);
  console.log(`  noneCount: ${noneCount}`);
  console.log(`  rawScoreBeforeClamp: ${rawScore}`);
  console.log(`  finalScore: ${score}`);

  console.log("[v3-debug:output]");
  console.log(`  fitScore: ${score}`);
  console.log(`  strongEvidence: ${gapAnalysis.strongEvidence.join(', ') || 'none'}`);
  console.log(`  partialEvidence: ${gapAnalysis.partialEvidence.join(', ') || 'none'}`);
  console.log(`  missingEvidence: ${gapAnalysis.missingEvidence.join(', ') || 'none'}`);

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

    const result = JSON.parse(extractJsonBlock(content));
    return result.requirements || [];

  } catch (error) {
    console.error("[fit-analysis-v3] OpenAI requirement extraction failed, falling back to deterministic extractor:", error instanceof Error ? error.message : error);
    const deterministic = extractRequirementsDeterministic(
      jobPosting.title || "",
      jobPosting.rawText || ""
    );
    console.log(`[fit-analysis-v3] Deterministic extraction: roleFamily=${deterministic.roleFamily}, requirements=${deterministic.requirements.length}`);
    return deterministic.requirements;
  }
}

function extractJsonBlock(content: string): string {
  // Strip markdown code fences if present (GPT-4 often wraps JSON in ```json ... ```)
  const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    return fenceMatch[1];
  }
  // Extract the first JSON object if there is surrounding prose
  const braceStart = content.indexOf("{");
  const braceEnd = content.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    return content.slice(braceStart, braceEnd + 1);
  }
  return content;
}

async function matchEvidence(
  requirements: JobRequirement[],
  candidateIntelligence: CandidateIntelligence
): Promise<EvidenceMatch[]> {
  
  const ci = candidateIntelligence as any;
  const evidenceInventory = ci.evidenceInventory || [];
  
  const matches: EvidenceMatch[] = [];

  console.log("[v3-debug:matching]");
  for (const requirement of requirements) {
    const match = await findMatchingEvidence(requirement, evidenceInventory, ci);
    console.log(`  requirement: ${requirement.requirement} | category: ${requirement.category} | evidenceItemsChecked: ${evidenceInventory.length} | matchesFound: ${match.evidence.length} | matchStrength: ${match.evidenceStrength}`);
    matches.push(match);
  }

  return matches;
}

async function findMatchingEvidence(
  requirement: JobRequirement,
  evidenceInventory: any[],
  candidateIntelligence: any
): Promise<EvidenceMatch> {
  
  // Find evidence items that match the requirement with detailed matching info
  const matchingEvidenceWithDetails = evidenceInventory.map((evidence: any) => {
    const matchResult = isEvidenceMatching(requirement.requirement, evidence, candidateIntelligence);
    return {
      evidence,
      matchResult
    };
  }).filter(item => item.matchResult.matches);
  
  const matchingEvidence = matchingEvidenceWithDetails.map(item => item.evidence);

  if (matchingEvidence.length === 0) {
    return {
      requirement: requirement.requirement,
      evidence: [],
      evidenceStrength: "none",
      gap: `No evidence found for ${requirement.requirement}`
    };
  }

  // Determine evidence strength based on matching results and original evidence strength
  let finalStrength: "strong" | "medium" | "weak" | "none" = "none";
  let gap: string = "No matching evidence";
  let matchReasons: string[] = [];

  // Calculate final strength based on match confidence and original evidence strength
  for (const item of matchingEvidenceWithDetails) {
    const originalStrength = item.evidence.evidenceStrength || "medium";
    const matchStrength = item.matchResult.strength;
    
    // Final strength is limited by the lower of original strength and match confidence
    let itemStrength: "strong" | "medium" | "weak" | "none" = "none";
    
    if (originalStrength === "strong" && matchStrength === "strong") {
      itemStrength = "strong";
    } else if ((originalStrength === "strong" || originalStrength === "medium") && 
               (matchStrength === "strong" || matchStrength === "medium")) {
      itemStrength = "medium";
    } else {
      itemStrength = "weak";
    }
    
    // Use the highest strength found
    if (itemStrength === "strong") {
      finalStrength = "strong";
      gap = "";
    } else if (itemStrength === "medium" && finalStrength !== "strong") {
      finalStrength = "medium";
      gap = "Limited evidence depth";
    } else if (itemStrength === "weak" && finalStrength === "none") {
      finalStrength = "weak";
      gap = "Tangential evidence only";
    }
    
    matchReasons.push(item.matchResult.reason);
  }

  const evidenceStrength = finalStrength;

  // Flatten evidence sources
  const evidenceSources = matchingEvidence.flatMap((e: any) => e.evidence || []);

  return {
    requirement: requirement.requirement,
    evidence: evidenceSources,
    evidenceStrength,
    gap
  };
}

function isEvidenceMatching(requirement: string, evidence: any, candidateIntelligence: any): { matches: boolean; strength: "strong" | "medium" | "weak" | "none"; reason: string } {
  const requirementLower = requirement.toLowerCase();
  const evidenceClaim = evidence.claim?.toLowerCase() || "";
  const evidenceCategory = evidence.category?.toLowerCase() || "";
  const evidenceTexts = (evidence.evidence || []).map((e: string) => e.toLowerCase());
  
  // Extract keywords from requirement
  const requirementKeywords = extractKeywords(requirementLower);
  const requirementTokens = normalizeTokens(requirementLower);
  
  // 1. Category overlap matching
  const categoryMatch = checkCategoryOverlap(requirementLower, evidenceCategory);
  if (categoryMatch.matches) {
    return {
      matches: true,
      strength: categoryMatch.strength,
      reason: `Category overlap: ${categoryMatch.reason}`
    };
  }
  
  // 2. Keyword overlap with synonyms
  const keywordMatch = checkKeywordOverlap(requirementTokens, evidenceClaim, evidenceTexts, candidateIntelligence);
  if (keywordMatch.matches) {
    return {
      matches: true,
      strength: keywordMatch.strength,
      reason: `Keyword overlap: ${keywordMatch.reason}`
    };
  }
  
  // 3. Direct claim matching (original logic)
  if (requirementKeywords.some(keyword => evidenceClaim.includes(keyword))) {
    return {
      matches: true,
      strength: "weak",
      reason: "Direct claim keyword match"
    };
  }
  
  // 4. Technical stack matching
  if (candidateIntelligence.technicalStack) {
    const techStack = Object.keys(candidateIntelligence.technicalStack).map(t => t.toLowerCase());
    if (requirementKeywords.some(keyword => techStack.some(tech => tech.includes(keyword)))) {
      return {
        matches: true,
        strength: "medium",
        reason: "Technical stack match"
      };
    }
  }
  
  // 5. Technical strengths matching
  if (candidateIntelligence.technicalStrengths) {
    const strengths = (candidateIntelligence.technicalStrengths as string[]).map(s => s.toLowerCase());
    if (requirementKeywords.some(keyword => strengths.some(strength => strength.includes(keyword)))) {
      return {
        matches: true,
        strength: "medium",
        reason: "Technical strengths match"
      };
    }
  }
  
  return {
    matches: false,
    strength: "none",
    reason: "No match found"
  };
}

function checkCategoryOverlap(requirement: string, evidenceCategory: string): { matches: boolean; strength: "strong" | "medium" | "weak" | "none"; reason: string } {
  // Category mapping for overlap detection
  const categoryGroups = {
    "ai / ml experience": ["ai / llm development", "ai development", "machine learning", "artificial intelligence"],
    "technical skills": ["frontend development", "backend development", "full stack development", "javascript development", "typescript development", "react development", "node.js development"],
    "full stack": ["frontend development", "backend development", "full stack development", "javascript development", "typescript development"],
    "frontend": ["frontend development", "javascript development", "typescript development", "react development"],
    "backend": ["backend development", "node.js development", "javascript development", "python development"],
    "customer-facing skills": ["customer-facing experience", "communication", "client interaction"],
    "leadership": ["project ownership", "leadership", "team management"],
    "product experience": ["product development", "project ownership", "product building"],
    "experience": ["professional experience", "project experience", "work experience"]
  };
  
  // Check if requirement contains any category keywords
  for (const [categoryKey, relatedCategories] of Object.entries(categoryGroups)) {
    if (requirement.includes(categoryKey) || requirement.includes(categoryKey.replace(/[^a-z\s]/g, ''))) {
      if (relatedCategories.some(cat => evidenceCategory.includes(cat))) {
        return {
          matches: true,
          strength: "medium",
          reason: `${categoryKey} matches ${evidenceCategory}`
        };
      }
    }
  }
  
  // Direct category match
  if (requirement.includes(evidenceCategory) || evidenceCategory.includes(requirement)) {
    return {
      matches: true,
      strength: "strong",
      reason: "Direct category match"
    };
  }
  
  return { matches: false, strength: "weak", reason: "No category overlap" };
}

function checkKeywordOverlap(
  requirementTokens: string[], 
  evidenceClaim: string, 
  evidenceTexts: string[], 
  candidateIntelligence: any
): { matches: boolean; strength: "strong" | "medium" | "weak" | "none"; reason: string } {
  // Synonym map
  const synonymMap: { [key: string]: string[] } = {
    // AI terms
    "ai": ["artificial intelligence", "generative ai", "genai", "llm", "openai", "agent", "agents", "agentic", "langchain", "langgraph", "prompt", "prompting", "rag"],
    "machine learning": ["ai", "artificial intelligence", "ml", "llm", "generative ai"],
    "llm": ["ai", "artificial intelligence", "large language model", "openai", "generative ai", "genai"],
    "openai": ["ai", "llm", "generative ai", "artificial intelligence"],
    "generative ai": ["ai", "genai", "llm", "artificial intelligence"],
    "agentic": ["ai", "agent", "agents", "llm", "generative ai"],
    
    // Full stack terms
    "full stack": ["frontend", "backend", "react", "next.js", "typescript", "javascript", "node", "python", "flask", "api", "database", "postgres", "prisma"],
    "react": ["frontend", "javascript", "typescript", "next.js", "full stack"],
    "javascript": ["frontend", "backend", "node.js", "react", "typescript", "full stack"],
    "typescript": ["frontend", "backend", "react", "javascript", "node.js", "full stack"],
    "node": ["backend", "javascript", "typescript", "api", "full stack"],
    "python": ["backend", "flask", "api", "full stack", "ai"],
    "api": ["backend", "node", "python", "flask", "full stack"],
    "database": ["postgres", "sql", "backend", "full stack"],
    
    // Customer-facing terms
    "customer": ["client", "stakeholder", "support", "communication", "discovery", "requirements", "consulting", "implementation", "solutions"],
    "client": ["customer", "stakeholder", "support", "communication", "consulting", "solutions"],
    "communication": ["customer", "client", "stakeholder", "support", "consulting"],
    
    // Operations / quality terms
    "quality": ["kpi", "compliance", "policy", "operations", "process", "documentation", "analysis"],
    "operations": ["quality", "kpi", "compliance", "policy", "process", "documentation"],
    "process": ["operations", "quality", "compliance", "policy", "documentation"]
  };
  
  // Check all evidence sources
  const allEvidenceTexts = [evidenceClaim, ...evidenceTexts];
  
  for (const requirementToken of requirementTokens) {
    // Find synonyms for this token
    const synonyms = synonymMap[requirementToken] || [requirementToken];
    
    for (const evidenceText of allEvidenceTexts) {
      const evidenceTokens = normalizeTokens(evidenceText);
      
      // Check for any synonym overlap
      const hasSynonymOverlap = synonyms.some(synonym => 
        evidenceTokens.some(evidenceToken => 
          evidenceToken.includes(synonym) || synonym.includes(evidenceToken)
        )
      );
      
      if (hasSynonymOverlap) {
        const matchedSynonyms = synonyms.filter(synonym => 
          evidenceTokens.some(evidenceToken => 
            evidenceToken.includes(synonym) || synonym.includes(evidenceToken)
          )
        );
        
        return {
          matches: true,
          strength: "medium",
          reason: `"${requirementToken}" matches "${matchedSynonyms.join(', ')}"`
        };
      }
    }
  }
  
  return { matches: false, strength: "none", reason: "No keyword overlap" };
}

function normalizeTokens(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
    .filter(word => !['and', 'the', 'for', 'with', 'have', 'has', 'are', 'was', 'were', 'will', 'can', 'could', 'should', 'would', 'not', 'but', 'or', 'nor'].includes(word));
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

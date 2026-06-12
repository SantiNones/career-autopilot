import { CandidateIntelligence, ExperienceInsight, ResumeMaster } from "@prisma/client";
import OpenAI from "openai";
import { enrichEvidenceInventory, parseProjectsFromResume } from "./evidenceEnrichment";

const openai = new OpenAI();

interface EvidenceItem {
  claim: string;
  evidence: string[];
  evidenceStrength: "strong" | "medium" | "weak";
  category: string;
  sources: string[];
}

interface EvidenceInventory {
  items: EvidenceItem[];
  topEvidenceAreas: string[];
  summary: string;
}

interface EvidenceEngineInput {
  candidateIntelligence: any;
  experienceInsight: ExperienceInsight;
  resumeMaster: ResumeMaster;
}

export async function generateEvidenceInventory(
  candidateIntelligence: any,
  experienceInsight: ExperienceInsight,
  resumeMaster: ResumeMaster
): Promise<EvidenceInventory> {
  
  console.log("[evidence-engine] Starting evidence inventory generation");

  const insights = experienceInsight.insights as any;
  const ci = candidateIntelligence as any;

  // Names parsed from the user's actual data (never hardcoded)
  const projectNames = parseProjectsFromResume(resumeMaster.projects).map(p => p.name);
  const companyNames = Array.isArray(insights)
    ? insights.map((e: any) => e.company).filter(Boolean)
    : [];

  // Prepare the prompt for OpenAI
  const prompt = `
You are an evidence analyst. Build a structured evidence inventory for a candidate.

EVIDENCE CATEGORIES:
- AI / LLM Development
- Full Stack Development  
- Backend Development
- Frontend Development
- Product Building
- Customer-facing Experience
- Operations Experience
- Project Ownership
- Communication
- Problem Solving
- Leadership
- Analytics
- Automation

CANDIDATE DATA:
Resume Summary: ${resumeMaster.summary || 'Not provided'}
Experience Insights: ${JSON.stringify(insights, null, 2)}
Candidate Intelligence: ${JSON.stringify(ci, null, 2)}

TASK:
Generate evidence items that answer "Why is this candidate a fit for this role?"

EVIDENCE QUALITY RULES:
- Evidence MUST be concrete, named, and reusable
- NEVER use generic sources like "Resume Summary", "Technical Stack", "Projects"
- ALWAYS use specific project names, company names, and achievements
- Evidence should be specific enough to be reused in CV bullets

SOURCE PRIORITY:
1. Named projects${projectNames.length ? ` (${projectNames.join(", ")})` : ""}
2. Named work experiences${companyNames.length ? ` (${companyNames.join(", ")})` : ""}
3. Specific metrics or achievements
4. Education
5. Technical stack only as support, never primary evidence

EVIDENCE STRENGTH:
strong: named project or professional experience directly proves the claim
medium: adjacent project/work evidence supports the claim  
weak: only technical stack, education, or indirect signal supports the claim

For each evidence item, provide:
- claim: Specific capability (e.g., "AI Workflow Development")
- evidence: List of specific, named evidence sources
- evidenceStrength: "strong" | "medium" | "weak"
- category: From the list above
- sources: Where evidence comes from (projects, experience, etc.)

EXAMPLES OF GOOD EVIDENCE (format, use the candidate's real names):
- "<Project Name>: built <specific feature/outcome> using <technology>"
- "<Company>: <specific accomplishment in concrete work context>"

EXAMPLES OF BAD EVIDENCE:
- "Resume Summary"
- "Technical Stack"
- "Projects"
- "AI-assisted workflows project"

RETURN JSON with this exact structure:
{
  "items": [
    {
      "claim": "specific_capability",
      "evidence": ["specific_named_evidence_1", "specific_named_evidence_2"],
      "evidenceStrength": "strong|medium|weak",
      "category": "category_name",
      "sources": ["projects", "experience", "education"]
    }
  ],
  "topEvidenceAreas": ["top_3_capability_areas"],
  "summary": "brief_summary_of_candidate_strengths"
}

Focus on:
1. Named projects and specific achievements
2. Concrete work experiences with company names
3. Specific metrics and accomplishments
4. Evidence specific enough for CV bullets and positioning
5. Honest assessment of evidence strength
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an evidence analyst. Always return valid JSON. Be thorough but concise."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const evidenceInventory = JSON.parse(content) as EvidenceInventory;

    console.log("[evidence-engine] LLM generated", evidenceInventory.items.length, "items");

    // Deterministic enrichment: named projects, linked technologies,
    // professional experience — all parsed from the user's actual data
    const enrichedItems = enrichEvidenceInventory(
      evidenceInventory.items,
      resumeMaster.projects,
      resumeMaster.skills,
      insights,
      ci.technicalStack || null,
      ci.languages || null
    );

    console.log("[evidence-engine] Enriched inventory:", enrichedItems.length, "items");
    console.log("[evidence-engine] Top evidence areas:", evidenceInventory.topEvidenceAreas);

    return {
      ...evidenceInventory,
      items: enrichedItems as any,
    };

  } catch (error) {
    console.error("[evidence-engine] OpenAI error:", error);
    
    // Fallback to basic evidence generation
    return generateFallbackEvidenceInventory(candidateIntelligence, experienceInsight, resumeMaster);
  }
}

function generateFallbackEvidenceInventory(
  candidateIntelligence: CandidateIntelligence,
  experienceInsight: ExperienceInsight,
  resumeMaster: ResumeMaster
): EvidenceInventory {
  
  console.log("[evidence-engine] Using fallback evidence generation");

  const ci = candidateIntelligence as any;
  const insights = experienceInsight.insights as any;

  const items: EvidenceItem[] = [];

  // Extract evidence from technical stack
  if (ci.technicalStack) {
    Object.entries(ci.technicalStack as any).forEach(([tech, level]) => {
      if (level === 'professional_experience' || level === 'proven_project_experience') {
        items.push({
          claim: `${tech} Development`,
          evidence: [`${tech} - ${level}`],
          evidenceStrength: level === 'professional_experience' ? 'strong' : 'medium',
          category: getTechCategory(tech),
          sources: ['projects', 'experience']
        });
      }
    });
  }

  // Extract evidence from positioning assets
  if (ci.positioningAssets && Array.isArray(ci.positioningAssets)) {
    ci.positioningAssets.forEach((asset: string) => {
      items.push({
        claim: asset,
        evidence: [asset],
        evidenceStrength: 'medium',
        category: getAssetCategory(asset),
        sources: ['analysis']
      });
    });
  }

  // Extract evidence from experience
  if (ci.experienceEvidence && Array.isArray(ci.experienceEvidence)) {
    ci.experienceEvidence.forEach((exp: any) => {
      if (exp.transferableCapabilities && Array.isArray(exp.transferableCapabilities)) {
        exp.transferableCapabilities.forEach((capability: string) => {
          items.push({
            claim: capability,
            evidence: [`${exp.company} - ${capability}`],
            evidenceStrength: 'medium',
            category: getCapabilityCategory(capability),
            sources: ['experience']
          });
        });
      }
    });
  }

  // Deterministic enrichment also applies to the fallback path so the
  // inventory stays rich even when OpenAI is unavailable
  const enrichedItems = enrichEvidenceInventory(
    items,
    resumeMaster.projects,
    resumeMaster.skills,
    insights,
    ci.technicalStack || null,
    ci.languages || null
  );

  const topEvidenceAreas = enrichedItems
    .filter(item => item.evidenceStrength === 'strong' || item.evidenceStrength === 'medium')
    .slice(0, 3)
    .map(item => item.claim);

  return {
    items: enrichedItems as any,
    topEvidenceAreas,
    summary: `Evidence inventory with ${enrichedItems.length} capability areas identified.`
  };
}

function getTechCategory(tech: string): string {
  const techLower = tech.toLowerCase();
  if (techLower.includes('react') || techLower.includes('vue') || techLower.includes('angular')) {
    return 'Frontend Development';
  }
  if (techLower.includes('node') || techLower.includes('python') || techLower.includes('java')) {
    return 'Backend Development';
  }
  if (techLower.includes('openai') || techLower.includes('llm') || techLower.includes('ai')) {
    return 'AI / LLM Development';
  }
  if (techLower.includes('postgres') || techLower.includes('mysql') || techLower.includes('mongo')) {
    return 'Backend Development';
  }
  return 'Full Stack Development';
}

function getAssetCategory(asset: string): string {
  const assetLower = asset.toLowerCase();
  if (assetLower.includes('communication') || assetLower.includes('customer')) {
    return 'Customer-facing Experience';
  }
  if (assetLower.includes('project') || assetLower.includes('product')) {
    return 'Product Building';
  }
  if (assetLower.includes('operation') || assetLower.includes('process')) {
    return 'Operations Experience';
  }
  return 'Project Ownership';
}

function getCapabilityCategory(capability: string): string {
  const capLower = capability.toLowerCase();
  if (capLower.includes('communication') || capLower.includes('verbal')) {
    return 'Communication';
  }
  if (capLower.includes('problem') || capLower.includes('analytical')) {
    return 'Problem Solving';
  }
  if (capLower.includes('team') || capLower.includes('lead')) {
    return 'Leadership';
  }
  if (capLower.includes('organize') || capLower.includes('coordinate')) {
    return 'Operations Experience';
  }
  return 'Project Ownership';
}

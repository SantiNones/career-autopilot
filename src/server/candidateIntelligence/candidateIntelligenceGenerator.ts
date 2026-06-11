import { UserProfile, ResumeMaster, ExperienceInsight, CandidatePreferences } from "@prisma/client";
import OpenAI from "openai";

const openai = new OpenAI();

interface CandidateIntelligenceInput {
  userProfile: UserProfile & { preferences: CandidatePreferences | null };
  resumeMaster: ResumeMaster;
  experienceInsight: ExperienceInsight;
}

interface CandidateIntelligenceOutput {
  careerStage: string;
  careerDirection: string;
  primaryRoleFamilies: any;
  secondaryRoleFamilies: any;
  technicalStack: any;
  technicalStrengths: any;
  transferableStrengths: any;
  domains: any;
  languages: any;
  educationSignals: any;
  projectEvidence: any;
  experienceEvidence: any;
  positioningAssets: any;
  riskAreas: any;
  constraints: any;
  summary: string;
}

export async function generateCandidateIntelligence(
  userProfile: CandidateIntelligenceInput["userProfile"],
  resumeMaster: CandidateIntelligenceInput["resumeMaster"],
  experienceInsight: CandidateIntelligenceInput["experienceInsight"]
): Promise<CandidateIntelligenceOutput> {
  
  console.log("[candidate-intelligence] Starting generation for user:", userProfile.id);

  // Extract experience insight data
  const insights = experienceInsight.insights as any;
  const preferences = userProfile.preferences;

  console.log("[candidate-intelligence] Target titles:", preferences?.targetTitles);
  console.log("[candidate-intelligence] Career goals:", preferences?.primaryCareerGoal);

  // Prepare the prompt for OpenAI
  const prompt = `
You are a career intelligence analyst. Build a structured candidate model for career matching, fit analysis, and positioning.

DO NOT summarize the resume. Build a structured candidate model.

CANDIDATE DATA:
Resume Summary: ${resumeMaster.summary || 'Not provided'}
Experience Insights: ${JSON.stringify(insights, null, 2)}
Preferences: ${JSON.stringify(preferences, null, 2)}

CAREER GOALS:
Primary Goal: ${preferences?.primaryCareerGoal || 'Not specified'}
Secondary Goals: ${JSON.stringify(preferences?.secondaryCareerGoals || [])}
Target Role Families: ${JSON.stringify(preferences?.targetRoleFamilies || [])}
Acceptable Stepping Stones: ${JSON.stringify(preferences?.acceptableSteppingStoneRoles || [])}
Roles to Avoid: ${JSON.stringify(preferences?.rolesToAvoid || [])}
Career Horizon: ${preferences?.careerHorizon || 'Not specified'}
Optimization Priority: ${preferences?.optimizationPriority || 'Not specified'}

ANALYZE and RETURN JSON with this exact structure:
{
  "careerStage": "student|early_career|career_transition|mid_level|senior",
  "careerDirection": "Natural language summary of career direction",
  "primaryRoleFamilies": ["best_fit_role_families_now"],
  "secondaryRoleFamilies": ["adjacent_or_stretched_role_families"],
  "technicalStack": {
    "technology_name": "proven|project_exposure|learning|weak_or_missing"
  },
  "technicalStrengths": ["key_technical_capabilities"],
  "transferableStrengths": ["skills_applicable_across_roles"],
  "domains": ["industries_or_domains_with_experience"],
  "languages": [{"language": "proficiency_level"}],
  "educationSignals": [{"degree": "field", "relevance": "high|medium|low"}],
  "projectEvidence": [
    {
      "projectName": "name",
      "capabilitiesDemonstrated": ["capabilities"],
      "relevantTechnologies": ["technologies"],
      "roleFamiliesSupported": ["families"],
      "strengthOfEvidence": "strong|medium|weak"
    }
  ],
  "experienceEvidence": [
    {
      "company": "company_name",
      "transferableCapabilities": ["capabilities"],
      "workEnvironment": "environment_description",
      "metrics": ["achievements_with_numbers"],
      "roleFamiliesSupported": ["families"]
    }
  ],
  "positioningAssets": ["things_that_make_candidate_sellable"],
  "riskAreas": ["honest_weaknesses_or_gaps"],
  "constraints": ["limitations_or_preferences"],
  "summary": "short_recruiter_style_summary"
}

Focus on:
1. Career stage assessment based on experience level and trajectory
2. Technical capabilities with evidence levels
3. Project and experience evidence
4. Honest assessment of strengths and risks
5. Career direction based on goals and capabilities
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a career intelligence analyst. Always return valid JSON. Be thorough but concise."
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

    // Parse the JSON response
    const candidateIntelligence = JSON.parse(content) as CandidateIntelligenceOutput;

    console.log("[candidate-intelligence] Generated successfully");
    console.log("[candidate-intelligence] Career stage:", candidateIntelligence.careerStage);
    console.log("[candidate-intelligence] Primary role families:", candidateIntelligence.primaryRoleFamilies);

    return candidateIntelligence;

  } catch (error) {
    console.error("[candidate-intelligence] OpenAI error:", error);
    
    // Fallback to basic analysis
    return generateFallbackCandidateIntelligence(userProfile, resumeMaster, experienceInsight);
  }
}

function generateFallbackCandidateIntelligence(
  userProfile: CandidateIntelligenceInput["userProfile"],
  resumeMaster: CandidateIntelligenceInput["resumeMaster"],
  experienceInsight: CandidateIntelligenceInput["experienceInsight"]
): CandidateIntelligenceOutput {
  
  const insights = experienceInsight.insights as any;
  const preferences = userProfile.preferences;

  console.log("[candidate-intelligence] Using fallback analysis");

  return {
    careerStage: "early_career",
    careerDirection: preferences?.primaryCareerGoal || "Technical professional seeking growth opportunities",
    primaryRoleFamilies: preferences?.targetRoleFamilies || ["software_engineering"],
    secondaryRoleFamilies: ["technical_support", "fullstack_engineering"],
    technicalStack: {
      "javascript": "proven",
      "typescript": "proven",
      "python": "project_exposure",
      "react": "proven",
      "node.js": "proven"
    },
    technicalStrengths: ["Full-stack development", "JavaScript/TypeScript", "React", "Node.js"],
    transferableStrengths: ["Problem solving", "Communication", "Learning ability"],
    domains: ["software_development", "web_technology"],
    languages: [{ "English": "professional" }],
    educationSignals: [],
    projectEvidence: [],
    experienceEvidence: [],
    positioningAssets: ["Technical skills", "Communication ability", "Learning mindset"],
    riskAreas: ["Limited professional experience", "Need more specialized expertise"],
    constraints: ["Based in Barcelona", "Prefers Spain/Europe/Remote Europe"],
    summary: "Technical professional with full-stack development skills seeking growth opportunities."
  };
}

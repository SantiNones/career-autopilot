import { mapToCapabilities } from "../capability/capabilityMapper";

// ---------------------------------------------------------------------------
// Evidence Enrichment (generic, deterministic)
// Builds structured evidence items from any user's actual data:
// - Named projects parsed from the resume projects section
// - Technologies linked to the projects/experiences that prove them
// - Professional experience from Experience Intelligence insights
// Every item is tagged with capabilities from the capability taxonomy.
// No user-specific names are hardcoded: everything is parsed from data.
// ---------------------------------------------------------------------------

export interface EnrichedEvidenceItem {
  claim: string;
  evidence: string[];
  evidenceStrength: "strong" | "medium" | "weak";
  category: string;
  sources: string[];
  source: "project" | "technology" | "experience" | "analysis";
  capabilities: string[];
  technologies?: string[];
}

export interface ParsedProject {
  name: string;
  description: string[];
  technologies: string[];
}

// --- Generic project parser -------------------------------------------------
// Parses resume project sections of the common form:
//   PROJECT NAME — short tagline
//   <description lines / bullets>
//   Technologies: A, B, C.
// Blocks are separated by blank lines before a new title line.

const TITLE_LINE = /^([A-Z][A-Z0-9 .&'\-+]{2,60})(?:\s+[—–-]\s+(.{0,120}))?$/;
const TECH_LINE = /^Technolog(?:y|ies)\s*:\s*(.+)$/i;
const LINK_LINE = /^(github|live demo|demo|url|link)s?\s*:/i;

export function parseProjectsFromResume(projectsText: string | null | undefined): ParsedProject[] {
  if (!projectsText) return [];

  const lines = projectsText.split("\n").map(l => l.trim());
  const projects: ParsedProject[] = [];
  let current: ParsedProject | null = null;

  for (const line of lines) {
    if (!line) continue;

    const titleMatch = line.match(TITLE_LINE);
    // A title line has an all-caps name part (project headers are conventionally caps)
    const isTitle = !!titleMatch && /[A-Z]{3,}/.test(titleMatch[1]);

    if (isTitle && titleMatch) {
      if (current) projects.push(current);
      current = {
        name: toTitleCase(titleMatch[1].trim()),
        description: titleMatch[2] ? [titleMatch[2].trim()] : [],
        technologies: [],
      };
      continue;
    }

    if (!current) continue;

    const techMatch = line.match(TECH_LINE);
    if (techMatch) {
      current.technologies = techMatch[1]
        .split(/[,;]/)
        .map(t => t.replace(/\.$/, "").trim())
        .filter(Boolean);
      continue;
    }

    if (LINK_LINE.test(line)) continue;

    if (current.description.length < 4) {
      current.description.push(line);
    }
  }
  if (current) projects.push(current);

  return projects.filter(p => p.name.length > 1);
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map(w => (w.length > 2 || w === "ai" ? w.charAt(0).toUpperCase() + w.slice(1) : w.toUpperCase()))
    .join(" ")
    .replace(/\bAi\b/g, "AI")
    .replace(/\bMvp\b/g, "MVP")
    .replace(/\bApp\b/g, "App");
}

// --- Skills section parser ---------------------------------------------------
// Parses "Group: tech1, tech2, ..." lines into a flat technology list.

export function parseSkillsSection(skillsText: string | null | undefined): string[] {
  if (!skillsText) return [];
  const techs = new Set<string>();
  for (const line of skillsText.split("\n")) {
    const afterColon = line.includes(":") ? line.slice(line.indexOf(":") + 1) : line;
    afterColon
      .split(/[,;]/)
      .map(t => t.replace(/\.$/, "").trim())
      .filter(t => t.length > 1 && t.length < 40)
      .forEach(t => techs.add(t));
  }
  return [...techs];
}

// --- Capability tagging -------------------------------------------------------

function tagCapabilities(texts: string[]): string[] {
  const mapping = mapToCapabilities(texts.join(". "));
  return mapping.capabilities.map(c => c.capabilityId);
}

function categoryFromCapabilities(capabilities: string[], fallback: string): string {
  const categoryHints: [string, string][] = [
    ["llm_integration", "AI / LLM Development"],
    ["ai_workflows", "AI / LLM Development"],
    ["ai_product_development", "AI / LLM Development"],
    ["fullstack_development", "Full Stack Development"],
    ["frontend_development", "Frontend Development"],
    ["backend_development", "Backend Development"],
    ["database_querying", "Backend Development"],
    ["customer_support", "Customer-facing Experience"],
    ["customer_communication", "Customer-facing Experience"],
    ["quality_assurance", "Operations Experience"],
    ["compliance", "Operations Experience"],
    ["product_building", "Product Building"],
    ["workflow_automation", "Automation"],
    ["data_analysis", "Analytics"],
  ];
  for (const [cap, category] of categoryHints) {
    if (capabilities.includes(cap)) return category;
  }
  return fallback;
}

// --- Evidence builders ---------------------------------------------------------

export function buildProjectEvidence(projects: ParsedProject[]): EnrichedEvidenceItem[] {
  return projects.map(p => {
    const allText = [p.name, ...p.description, ...p.technologies];
    const capabilities = tagCapabilities(allText);
    return {
      claim: p.name,
      evidence: p.description.slice(0, 3),
      evidenceStrength: "strong" as const,
      category: categoryFromCapabilities(capabilities, "Project Ownership"),
      sources: ["projects"],
      source: "project" as const,
      capabilities,
      technologies: p.technologies,
    };
  });
}

export function buildTechnologyEvidence(
  projects: ParsedProject[],
  skillsTechs: string[],
  technicalStack: Record<string, string> | null
): EnrichedEvidenceItem[] {
  // Collect candidate technologies from projects + skills + stack
  const techSet = new Map<string, string>(); // normalized -> display
  const addTech = (t: string) => {
    const norm = t.toLowerCase().trim();
    if (norm.length > 1 && !techSet.has(norm)) techSet.set(norm, t.trim());
  };
  projects.forEach(p => p.technologies.forEach(addTech));
  skillsTechs.forEach(addTech);
  if (technicalStack) Object.keys(technicalStack).forEach(addTech);

  const items: EnrichedEvidenceItem[] = [];

  for (const [norm, display] of techSet) {
    // Link the technology to projects that prove it
    const linkedProjects = projects.filter(p =>
      p.technologies.some(t => t.toLowerCase().includes(norm) || norm.includes(t.toLowerCase())) ||
      p.description.some(d => d.toLowerCase().includes(norm))
    );

    const capabilities = tagCapabilities([display, ...linkedProjects.map(p => p.name)]);
    // Skip technologies that map to no capability and have no project link (noise)
    if (capabilities.length === 0 && linkedProjects.length === 0) continue;

    const stackLevel = technicalStack?.[display] || technicalStack?.[norm];
    const evidence = linkedProjects.length > 0
      ? linkedProjects.map(p => `Used in ${p.name}`)
      : [stackLevel ? `${display} — ${stackLevel}` : `${display} — listed skill`];

    items.push({
      claim: display,
      evidence,
      evidenceStrength: linkedProjects.length > 0 ? "strong" : "weak",
      category: categoryFromCapabilities(capabilities, "Technical Skills"),
      sources: linkedProjects.length > 0 ? ["projects"] : ["skills"],
      source: "technology",
      capabilities,
      technologies: [display],
    });
  }

  return items;
}

export function buildExperienceEvidence(insights: any): EnrichedEvidenceItem[] {
  if (!Array.isArray(insights)) return [];

  return insights
    .filter((exp: any) => exp.company || exp.role)
    .map((exp: any) => {
      const narratives: string[] = [
        ...(exp.transferableNarratives || []),
        ...(exp.metrics || []),
      ].slice(0, 4);
      const tagText = [
        exp.role || "",
        ...(exp.skills || []),
        ...(exp.keywords || []),
        ...(exp.professionalThemes || []),
        ...(exp.workEnvironment || []),
      ];
      const capabilities = tagCapabilities(tagText);
      return {
        claim: `${exp.company || "Experience"} — ${exp.role || "Professional role"}`,
        evidence: narratives.length > 0 ? narratives : (exp.responsibilities || []).slice(0, 3),
        evidenceStrength: "strong" as const,
        category: categoryFromCapabilities(capabilities, "Operations Experience"),
        sources: ["experience"],
        source: "experience" as const,
        capabilities,
      };
    });
}

// --- Merge --------------------------------------------------------------------

export function enrichEvidenceInventory(
  baseItems: any[],
  resumeProjects: string | null | undefined,
  resumeSkills: string | null | undefined,
  experienceInsights: any,
  technicalStack: Record<string, string> | null
): EnrichedEvidenceItem[] {
  const projects = parseProjectsFromResume(resumeProjects);
  const skillsTechs = parseSkillsSection(resumeSkills);

  const projectItems = buildProjectEvidence(projects);
  const techItems = buildTechnologyEvidence(projects, skillsTechs, technicalStack);
  const experienceItems = buildExperienceEvidence(experienceInsights);

  // Tag base (LLM/fallback) items with capabilities; keep as "analysis" source
  const analysisItems: EnrichedEvidenceItem[] = (baseItems || []).map((item: any) => ({
    claim: item.claim || "",
    evidence: item.evidence || [],
    evidenceStrength: item.evidenceStrength || "medium",
    category: item.category || "General",
    sources: item.sources || ["analysis"],
    source: "analysis" as const,
    capabilities: item.capabilities?.length
      ? item.capabilities
      : tagCapabilities([item.claim || "", ...(item.evidence || [])]),
  }));

  // Merge with dedupe by normalized claim (structured items win)
  const merged = new Map<string, EnrichedEvidenceItem>();
  for (const item of [...projectItems, ...experienceItems, ...techItems, ...analysisItems]) {
    const key = item.claim.toLowerCase().trim();
    if (!key || merged.has(key)) continue;
    merged.set(key, item);
  }

  return [...merged.values()];
}

import type { DiscoveredJob } from "../types";

// More flexible job type for role classification
type JobForRoleIntent = {
  title: string;
  company: string;
  location?: string | null;
  description?: string | null;
  applyUrl: string;
  source: string;
  provider: string;
  providerSlug?: string;
  externalId?: string;
  postedAt?: Date | null;
};

export type RoleFamily = 
  | "software_engineering"
  | "frontend"
  | "backend"
  | "fullstack"
  | "product_support"
  | "solutions_engineering"
  | "customer_success"
  | "ai_engineering"
  | "data"
  | "devops"
  | "product_management"
  | "sales"
  | "developer_relations"
  | "implementation"
  | "unknown";

export interface RoleIntentClassification {
  roleFamily: RoleFamily;
  isTargetRole: boolean;
  reason: string;
}

// Santiago's target role families
const TARGET_ROLE_FAMILIES: Set<RoleFamily> = new Set([
  "fullstack",
  "frontend", 
  "backend",
  "product_support",
  "solutions_engineering",
  "ai_engineering",
  "developer_relations",
  "implementation"
]);

// Role family keyword mappings
const ROLE_FAMILY_KEYWORDS: Record<RoleFamily, string[]> = {
  software_engineering: [
    "software engineer", "software developer", "engineer", "developer", "programmer"
  ],
  frontend: [
    "frontend", "front end", "ui engineer", "ux engineer", "react", "vue", "angular",
    "frontend developer", "ui developer", "web developer", "javascript", "typescript"
  ],
  backend: [
    "backend", "back end", "api engineer", "server", "database", "infrastructure",
    "backend developer", "api developer", "server developer", "systems engineer"
  ],
  fullstack: [
    "fullstack", "full stack", "full-stack", "full stack engineer", "fullstack developer",
    "full-stack developer", "web engineer", "software engineer"
  ],
  product_support: [
    "product support", "technical support", "support engineer", "customer support",
    "support specialist", "product specialist", "technical specialist"
  ],
  solutions_engineering: [
    "solutions engineer", "solutions architect", "customer engineer", "implementation engineer",
    "implementation specialist", "technical solutions", "solutions consultant"
  ],
  customer_success: [
    "customer success", "customer success manager", "client success", "account manager",
    "customer relationship", "client services"
  ],
  ai_engineering: [
    "ai engineer", "ai developer", "machine learning engineer", "ml engineer",
    "ai automation", "llm engineer", "applied ai", "ai researcher", "ai specialist"
  ],
  data: [
    "data engineer", "data scientist", "data analyst", "analytics engineer",
    "data platform", "bi engineer", "business intelligence"
  ],
  devops: [
    "devops", "site reliability", "sre", "platform engineer", "infrastructure engineer",
    "cloud engineer", "reliability engineer", "operations engineer"
  ],
  product_management: [
    "product manager", "product owner", "product marketing", "product strategy",
    "product lead", "product director"
  ],
  sales: [
    "account executive", "sales engineer", "sales development", "business development",
    "sales representative", "sales manager", "revenue"
  ],
  developer_relations: [
    "developer advocate", "developer relations", "devrel", "developer experience",
    "devex", "developer advocate", "technical evangelist", "community manager"
  ],
  implementation: [
    "implementation specialist", "implementation engineer", "implementation consultant",
    "implementation manager", "customer implementation", "technical implementation"
  ],
  unknown: []
};

// Excluded role keywords (lower priority)
const EXCLUDED_ROLE_KEYWORDS = [
  "product management", "account executive", "sales", "finance", "legal", 
  "security engineer", "mobile-only", "senior management", "director", "vp",
  "human resources", "hr", "recruiting", "marketing", "design", "operations"
];

// Helper function to check if any terms are in text
const containsAny = (text: string, terms: string[]): boolean => 
  terms.some(term => text.toLowerCase().includes(term.toLowerCase()));

// Helper to convert JSON arrays to string arrays
const toStringArray = (json: any): string[] => {
  if (!json) return [];
  if (Array.isArray(json)) return json.filter(item => typeof item === 'string');
  return [];
};

export function classifyRoleIntent(job: JobForRoleIntent | DiscoveredJob): RoleIntentClassification {
  const title = job.title.toLowerCase();
  const description = (job.description || '').toLowerCase();
  const combinedText = `${title} ${description}`;

  // Check for excluded roles first (highest priority)
  if (containsAny(combinedText, EXCLUDED_ROLE_KEYWORDS)) {
    const foundKeyword = EXCLUDED_ROLE_KEYWORDS.find(keyword => 
      combinedText.includes(keyword.toLowerCase())
    );
    return {
      roleFamily: "unknown",
      isTargetRole: false,
      reason: `Role contains excluded keyword: ${foundKeyword}`
    };
  }

  // Check role family keywords in title (highest priority)
  for (const [family, keywords] of Object.entries(ROLE_FAMILY_KEYWORDS)) {
    if (keywords.length > 0 && containsAny(title, keywords)) {
      const foundKeyword = keywords.find(keyword => 
        title.includes(keyword.toLowerCase())
      );
      const roleFamily = family as RoleFamily;
      const isTarget = TARGET_ROLE_FAMILIES.has(roleFamily);
      
      return {
        roleFamily,
        isTargetRole: isTarget,
        reason: `Role family: ${roleFamily}${foundKeyword ? ` (matched: ${foundKeyword})` : ''}`
      };
    }
  }

  // If no clear match in title, check description for supporting evidence
  for (const [family, keywords] of Object.entries(ROLE_FAMILY_KEYWORDS)) {
    if (keywords.length > 0 && containsAny(description, keywords)) {
      const foundKeyword = keywords.find(keyword => 
        description.includes(keyword.toLowerCase())
      );
      const roleFamily = family as RoleFamily;
      const isTarget = TARGET_ROLE_FAMILIES.has(roleFamily);
      
      return {
        roleFamily,
        isTargetRole: isTarget,
        reason: `Role family: ${roleFamily} (from description: ${foundKeyword})`
      };
    }
  }

  // Default to unknown
  return {
    roleFamily: "unknown",
    isTargetRole: false,
    reason: "Role family unclear"
  };
}

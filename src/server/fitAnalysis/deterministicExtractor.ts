export interface DeterministicRequirement {
  requirement: string;
  category: "Technical Skills" | "Experience" | "Languages" | "Domain Knowledge" | "Customer-facing Skills" | "Leadership" | "Product Experience" | "AI / ML Experience";
  importance: "critical" | "important" | "nice_to_have";
  source: "deterministic";
}

export interface DeterministicExtractionResult {
  roleFamily: string;
  requirements: DeterministicRequirement[];
}

type Category = DeterministicRequirement["category"];

interface KeywordRule {
  // Any of these tokens appearing in title+description triggers the requirement
  patterns: string[];
  requirement: string;
  category: Category;
  defaultImportance: "critical" | "important" | "nice_to_have";
}

interface RoleFamily {
  name: string;
  // Tokens that suggest this role family (matched against title primarily, description secondarily)
  titleSignals: string[];
  descriptionSignals: string[];
  rules: KeywordRule[];
}

// ---------------------------------------------------------------------------
// Cross-cutting rules applied to every job regardless of role family
// ---------------------------------------------------------------------------
const CROSS_CUTTING_RULES: KeywordRule[] = [
  { patterns: ["python"], requirement: "Python", category: "Technical Skills", defaultImportance: "important" },
  { patterns: ["javascript"], requirement: "JavaScript", category: "Technical Skills", defaultImportance: "important" },
  { patterns: ["typescript"], requirement: "TypeScript", category: "Technical Skills", defaultImportance: "important" },
  { patterns: ["react"], requirement: "React", category: "Technical Skills", defaultImportance: "important" },
  { patterns: ["node.js", "node js", "nodejs", " node "], requirement: "Node.js", category: "Technical Skills", defaultImportance: "important" },
  { patterns: ["sql", "postgres", "postgresql", "database"], requirement: "Databases / SQL", category: "Technical Skills", defaultImportance: "important" },
  { patterns: ["communication", "communicate"], requirement: "Communication skills", category: "Customer-facing Skills", defaultImportance: "important" },
  { patterns: ["collaborat", "cross-functional", "teamwork", "team player"], requirement: "Collaboration", category: "Customer-facing Skills", defaultImportance: "important" },
  { patterns: ["english"], requirement: "English language", category: "Languages", defaultImportance: "important" },
  { patterns: ["spanish"], requirement: "Spanish language", category: "Languages", defaultImportance: "nice_to_have" },
  { patterns: ["german"], requirement: "German language", category: "Languages", defaultImportance: "nice_to_have" },
];

// ---------------------------------------------------------------------------
// Role family definitions with modular keyword groups
// ---------------------------------------------------------------------------
const ROLE_FAMILIES: RoleFamily[] = [
  {
    name: "AI / Automation",
    titleSignals: ["ai", "ml", "machine learning", "llm", "automation", "agentic", "genai", "generative"],
    descriptionSignals: ["llm", "openai", "generative ai", "prompt", "agentic", "langchain", "langgraph", "rag", "machine learning"],
    rules: [
      { patterns: ["llm", "large language model", "generative ai", "genai", "openai", "anthropic"], requirement: "LLM / Generative AI experience", category: "AI / ML Experience", defaultImportance: "critical" },
      { patterns: ["agent", "agentic", "workflow"], requirement: "Agentic / AI workflows", category: "AI / ML Experience", defaultImportance: "important" },
      { patterns: ["prompt"], requirement: "Prompt engineering", category: "AI / ML Experience", defaultImportance: "important" },
      { patterns: ["rag", "retrieval"], requirement: "RAG / retrieval systems", category: "AI / ML Experience", defaultImportance: "nice_to_have" },
      { patterns: ["langchain", "langgraph", "llamaindex"], requirement: "AI frameworks (LangChain/LangGraph)", category: "AI / ML Experience", defaultImportance: "nice_to_have" },
      { patterns: ["machine learning", "deep learning", "tensorflow", "pytorch"], requirement: "Machine learning fundamentals", category: "AI / ML Experience", defaultImportance: "important" },
      { patterns: ["evaluation", "evals", "quality"], requirement: "AI evaluation / quality", category: "AI / ML Experience", defaultImportance: "important" },
      { patterns: ["observability", "monitoring", "debugging"], requirement: "Observability / debugging", category: "Technical Skills", defaultImportance: "important" },
      { patterns: ["api"], requirement: "API integration", category: "Technical Skills", defaultImportance: "important" },
    ],
  },
  {
    name: "Technical / Engineering",
    titleSignals: ["engineer", "developer", "programmer", "devops", "sre", "architect", "full stack", "frontend", "backend", "software"],
    descriptionSignals: ["software engineering", "web application", "microservice", "ci/cd", "git", "code review"],
    rules: [
      { patterns: ["software engineering", "software development", "engineering fundamentals", "best practices"], requirement: "Software engineering fundamentals", category: "Technical Skills", defaultImportance: "critical" },
      { patterns: ["frontend", "front-end", "ui", "css", "html"], requirement: "Frontend development", category: "Technical Skills", defaultImportance: "important" },
      { patterns: ["backend", "back-end", "server-side", "rest", "api"], requirement: "Backend / API development", category: "Technical Skills", defaultImportance: "important" },
      { patterns: ["full stack", "full-stack", "fullstack"], requirement: "Full stack development", category: "Technical Skills", defaultImportance: "important" },
      { patterns: ["cloud", "aws", "gcp", "azure"], requirement: "Cloud platforms", category: "Technical Skills", defaultImportance: "important" },
      { patterns: ["docker", "kubernetes", "ci/cd", "pipeline", "infrastructure"], requirement: "DevOps / infrastructure", category: "Technical Skills", defaultImportance: "important" },
      { patterns: ["test", "testing", "tdd"], requirement: "Testing practices", category: "Technical Skills", defaultImportance: "nice_to_have" },
      { patterns: ["scalab", "distributed", "high-performance", "high performance"], requirement: "Scalable / distributed systems", category: "Technical Skills", defaultImportance: "important" },
      { patterns: ["security", "penetration", "compliance"], requirement: "Security practices", category: "Domain Knowledge", defaultImportance: "important" },
    ],
  },
  {
    name: "Solutions / Consulting / Implementation",
    titleSignals: ["solutions", "consultant", "consulting", "implementation", "presales", "pre-sales", "customer engineer", "sales engineer"],
    descriptionSignals: ["client", "stakeholder", "discovery", "requirements gathering", "implementation", "advisory"],
    rules: [
      { patterns: ["client", "customer"], requirement: "Client / customer engagement", category: "Customer-facing Skills", defaultImportance: "critical" },
      { patterns: ["stakeholder"], requirement: "Stakeholder management", category: "Customer-facing Skills", defaultImportance: "important" },
      { patterns: ["discovery", "requirements"], requirement: "Requirements discovery", category: "Customer-facing Skills", defaultImportance: "important" },
      { patterns: ["demo", "demonstration", "presentation", "present"], requirement: "Product demonstrations / presentations", category: "Customer-facing Skills", defaultImportance: "important" },
      { patterns: ["implementation", "deploy", "onboarding", "integration"], requirement: "Solution implementation / integration", category: "Domain Knowledge", defaultImportance: "important" },
      { patterns: ["technical", "coding", "programming", "scripting"], requirement: "Technical foundation", category: "Technical Skills", defaultImportance: "important" },
      { patterns: ["business", "commercial", "advisory", "consult"], requirement: "Business / advisory acumen", category: "Domain Knowledge", defaultImportance: "important" },
      { patterns: ["project management", "project delivery"], requirement: "Project management", category: "Product Experience", defaultImportance: "nice_to_have" },
    ],
  },
  {
    name: "Customer Support / Technical Support",
    titleSignals: ["support", "helpdesk", "service desk", "technical support", "customer success"],
    descriptionSignals: ["troubleshoot", "ticket", "sla", "escalation", "customer issues"],
    rules: [
      { patterns: ["troubleshoot", "diagnose", "resolve"], requirement: "Troubleshooting / problem resolution", category: "Customer-facing Skills", defaultImportance: "critical" },
      { patterns: ["customer", "client", "user"], requirement: "Customer interaction", category: "Customer-facing Skills", defaultImportance: "critical" },
      { patterns: ["ticket", "sla", "escalation", "zendesk", "jira"], requirement: "Support tooling / processes", category: "Domain Knowledge", defaultImportance: "important" },
      { patterns: ["documentation", "knowledge base"], requirement: "Documentation", category: "Domain Knowledge", defaultImportance: "important" },
      { patterns: ["technical", "debug", "logs", "scripting"], requirement: "Technical troubleshooting skills", category: "Technical Skills", defaultImportance: "important" },
      { patterns: ["empathy", "patience", "de-escalat"], requirement: "Customer empathy", category: "Customer-facing Skills", defaultImportance: "nice_to_have" },
    ],
  },
  {
    name: "Data / Analytics",
    titleSignals: ["data", "analytics", "analyst", "scientist", "bi "],
    descriptionSignals: ["data pipeline", "etl", "data warehouse", "dashboards", "data analysis", "reporting"],
    rules: [
      { patterns: ["sql"], requirement: "SQL", category: "Technical Skills", defaultImportance: "critical" },
      { patterns: ["pipeline", "etl", "airflow", "dbt"], requirement: "Data pipelines / ETL", category: "Technical Skills", defaultImportance: "important" },
      { patterns: ["dashboard", "tableau", "power bi", "looker", "visualization"], requirement: "Data visualization / BI", category: "Technical Skills", defaultImportance: "important" },
      { patterns: ["statistics", "statistical", "modeling"], requirement: "Statistics / modeling", category: "Domain Knowledge", defaultImportance: "important" },
      { patterns: ["data warehouse", "snowflake", "bigquery", "redshift"], requirement: "Data warehousing", category: "Technical Skills", defaultImportance: "nice_to_have" },
      { patterns: ["analysis", "insight", "reporting"], requirement: "Data analysis / reporting", category: "Domain Knowledge", defaultImportance: "important" },
    ],
  },
  {
    name: "Product / Project Management",
    titleSignals: ["product manager", "project manager", "program manager", "product owner", "scrum"],
    descriptionSignals: ["roadmap", "backlog", "sprint", "agile", "user stories", "prioritization"],
    rules: [
      { patterns: ["roadmap", "prioritiz", "backlog"], requirement: "Roadmap / prioritization", category: "Product Experience", defaultImportance: "critical" },
      { patterns: ["agile", "scrum", "sprint", "kanban"], requirement: "Agile methodologies", category: "Product Experience", defaultImportance: "important" },
      { patterns: ["stakeholder"], requirement: "Stakeholder management", category: "Customer-facing Skills", defaultImportance: "important" },
      { patterns: ["user research", "user stories", "ux"], requirement: "User research / UX collaboration", category: "Product Experience", defaultImportance: "important" },
      { patterns: ["metrics", "kpi", "analytics"], requirement: "Metrics / KPI tracking", category: "Domain Knowledge", defaultImportance: "important" },
      { patterns: ["cross-functional", "coordination"], requirement: "Cross-functional coordination", category: "Leadership", defaultImportance: "important" },
    ],
  },
  {
    name: "Sales / Business Development",
    titleSignals: ["sales", "account executive", "business development", "bdr", "sdr", "account manager"],
    descriptionSignals: ["quota", "pipeline", "prospecting", "closing", "crm", "negotiation"],
    rules: [
      { patterns: ["prospect", "lead generation", "outbound"], requirement: "Prospecting / lead generation", category: "Customer-facing Skills", defaultImportance: "critical" },
      { patterns: ["quota", "closing", "deals", "negotiation"], requirement: "Deal closing / negotiation", category: "Customer-facing Skills", defaultImportance: "critical" },
      { patterns: ["crm", "salesforce", "hubspot"], requirement: "CRM tooling", category: "Domain Knowledge", defaultImportance: "important" },
      { patterns: ["relationship", "account management"], requirement: "Relationship / account management", category: "Customer-facing Skills", defaultImportance: "important" },
      { patterns: ["presentation", "demo"], requirement: "Sales presentations / demos", category: "Customer-facing Skills", defaultImportance: "important" },
    ],
  },
  {
    name: "Operations / Process / Compliance",
    titleSignals: ["operations", "compliance", "process", "quality assurance", "qa specialist", "auditor"],
    descriptionSignals: ["sop", "compliance", "regulatory", "process improvement", "kpi", "audit"],
    rules: [
      { patterns: ["process", "sop", "workflow"], requirement: "Process design / improvement", category: "Domain Knowledge", defaultImportance: "critical" },
      { patterns: ["compliance", "regulatory", "policy", "audit"], requirement: "Compliance / policy", category: "Domain Knowledge", defaultImportance: "important" },
      { patterns: ["kpi", "metrics", "reporting"], requirement: "KPI / performance reporting", category: "Domain Knowledge", defaultImportance: "important" },
      { patterns: ["quality"], requirement: "Quality management", category: "Domain Knowledge", defaultImportance: "important" },
      { patterns: ["documentation"], requirement: "Documentation", category: "Domain Knowledge", defaultImportance: "important" },
      { patterns: ["operations", "operational"], requirement: "Operations management", category: "Domain Knowledge", defaultImportance: "important" },
    ],
  },
  {
    name: "Marketing / Content",
    titleSignals: ["marketing", "content", "seo", "growth", "brand", "copywriter"],
    descriptionSignals: ["campaign", "seo", "content creation", "social media", "branding"],
    rules: [
      { patterns: ["campaign"], requirement: "Campaign management", category: "Domain Knowledge", defaultImportance: "critical" },
      { patterns: ["seo", "sem"], requirement: "SEO / SEM", category: "Domain Knowledge", defaultImportance: "important" },
      { patterns: ["content", "copywriting", "writing"], requirement: "Content creation", category: "Domain Knowledge", defaultImportance: "important" },
      { patterns: ["social media"], requirement: "Social media", category: "Domain Knowledge", defaultImportance: "important" },
      { patterns: ["analytics", "metrics"], requirement: "Marketing analytics", category: "Domain Knowledge", defaultImportance: "important" },
    ],
  },
  {
    name: "People / Recruiting / HR",
    titleSignals: ["recruiter", "talent", "hr ", "human resources", "people operations"],
    descriptionSignals: ["sourcing", "candidates", "onboarding", "employee", "talent acquisition"],
    rules: [
      { patterns: ["sourcing", "talent acquisition", "candidates"], requirement: "Candidate sourcing", category: "Domain Knowledge", defaultImportance: "critical" },
      { patterns: ["interview"], requirement: "Interviewing", category: "Customer-facing Skills", defaultImportance: "important" },
      { patterns: ["onboarding", "employee experience"], requirement: "Onboarding / employee experience", category: "Domain Knowledge", defaultImportance: "important" },
      { patterns: ["hris", "ats"], requirement: "HR tooling (HRIS/ATS)", category: "Domain Knowledge", defaultImportance: "nice_to_have" },
    ],
  },
  {
    name: "Finance / Legal / Admin",
    titleSignals: ["finance", "accountant", "legal", "counsel", "controller", "admin", "bookkeeper"],
    descriptionSignals: ["accounting", "financial reporting", "contracts", "legal review", "invoicing"],
    rules: [
      { patterns: ["accounting", "bookkeeping", "ledger"], requirement: "Accounting", category: "Domain Knowledge", defaultImportance: "critical" },
      { patterns: ["financial reporting", "budget", "forecast"], requirement: "Financial reporting / budgeting", category: "Domain Knowledge", defaultImportance: "important" },
      { patterns: ["contract", "legal"], requirement: "Contracts / legal review", category: "Domain Knowledge", defaultImportance: "important" },
      { patterns: ["excel", "spreadsheet"], requirement: "Excel / spreadsheets", category: "Technical Skills", defaultImportance: "important" },
    ],
  },
];

// Priority order used as tie-breaker for Career Autopilot's current target user.
// Extensible: reorder or extend for future users in other fields.
const FAMILY_PRIORITY = [
  "AI / Automation",
  "Technical / Engineering",
  "Solutions / Consulting / Implementation",
  "Customer Support / Technical Support",
  "Data / Analytics",
  "Product / Project Management",
  "Sales / Business Development",
  "Operations / Process / Compliance",
  "Marketing / Content",
  "People / Recruiting / HR",
  "Finance / Legal / Admin",
];

export function inferRoleFamily(title: string, description: string): string {
  const titleLower = title.toLowerCase();
  const descLower = description.toLowerCase();

  let bestFamily = "Technical / Engineering";
  let bestScore = 0;

  for (const family of ROLE_FAMILIES) {
    let score = 0;
    // Title signals are strong indicators
    for (const signal of family.titleSignals) {
      if (titleLower.includes(signal)) score += 3;
    }
    // Description signals are weaker indicators
    for (const signal of family.descriptionSignals) {
      if (descLower.includes(signal)) score += 1;
    }

    if (score > bestScore) {
      bestScore = score;
      bestFamily = family.name;
    } else if (score === bestScore && score > 0) {
      // Tie-breaker: prefer higher-priority families
      const currentIdx = FAMILY_PRIORITY.indexOf(bestFamily);
      const candidateIdx = FAMILY_PRIORITY.indexOf(family.name);
      if (candidateIdx !== -1 && (currentIdx === -1 || candidateIdx < currentIdx)) {
        bestFamily = family.name;
      }
    }
  }

  return bestFamily;
}

function detectImportance(text: string, pattern: string, defaultImportance: "critical" | "important" | "nice_to_have"): "critical" | "important" | "nice_to_have" {
  const idx = text.indexOf(pattern);
  if (idx === -1) return defaultImportance;

  // Look at surrounding context (80 chars window) for importance signals
  const windowStart = Math.max(0, idx - 80);
  const windowEnd = Math.min(text.length, idx + pattern.length + 80);
  const context = text.slice(windowStart, windowEnd);

  if (/(must|required|essential|need to have)/.test(context)) return "critical";
  if (/(nice to have|plus|bonus|preferred|ideally)/.test(context)) return "nice_to_have";
  return defaultImportance;
}

export function extractRequirementsDeterministic(
  title: string,
  description: string
): DeterministicExtractionResult {
  const roleFamily = inferRoleFamily(title, description);
  const text = `${title} ${description}`.toLowerCase();

  const family = ROLE_FAMILIES.find(f => f.name === roleFamily);
  const applicableRules: KeywordRule[] = [
    ...(family?.rules || []),
    ...CROSS_CUTTING_RULES,
  ];

  const requirements: DeterministicRequirement[] = [];
  const seen = new Set<string>();

  for (const rule of applicableRules) {
    const matchedPattern = rule.patterns.find(p => text.includes(p));
    if (matchedPattern && !seen.has(rule.requirement)) {
      seen.add(rule.requirement);
      requirements.push({
        requirement: rule.requirement,
        category: rule.category,
        importance: detectImportance(text, matchedPattern, rule.defaultImportance),
        source: "deterministic",
      });
    }
  }

  // Experience-level requirement from years mentions (cross-cutting)
  const yearsMatch = text.match(/(\d+)\+?\s*years?/);
  if (yearsMatch && !seen.has("Experience level")) {
    const years = parseInt(yearsMatch[1], 10);
    requirements.push({
      requirement: `${years}+ years experience`,
      category: "Experience",
      importance: years >= 5 ? "critical" : "important",
      source: "deterministic",
    });
  }

  // Seniority signal from title (cross-cutting)
  if (/(senior|staff|principal|lead|head of|director|vp|chief)/.test(title.toLowerCase()) && !seen.has("Senior-level experience")) {
    requirements.push({
      requirement: "Senior-level experience",
      category: "Experience",
      importance: "critical",
      source: "deterministic",
    });
  }

  return { roleFamily, requirements };
}

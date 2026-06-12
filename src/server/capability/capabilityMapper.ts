import { CAPABILITY_INDEX } from "./capabilityTaxonomy";

// ---------------------------------------------------------------------------
// Deterministic Capability Mapper (Phase 1)
// Maps free text (job requirements OR candidate evidence) to capability tags.
// Architecture is embedding-ready: an AI fallback can be added behind
// mapToCapabilities() for texts that return no/low-confidence capabilities.
// ---------------------------------------------------------------------------

export type MappingConfidence = "high" | "medium" | "low";

export interface CapabilityMapping {
  capabilityId: string;
  confidence: MappingConfidence;
  matchedTerm: string;
}

export interface CapabilityMappingResult {
  text: string;
  capabilities: CapabilityMapping[];
  source: "deterministic" | "ai";
  unmapped: boolean;
}

interface TermRule {
  // Terms matched against normalized text (word-boundary aware where sensible)
  terms: string[];
  capabilities: { id: string; confidence: MappingConfidence }[];
}

// Term rules: each canonical term maps to 1-3 capabilities with confidence.
// This is NOT a synonym list — terms map to canonical capabilities, and
// matching happens in capability space.
const TERM_RULES: TermRule[] = [
  // --- Languages / frameworks / tools ---
  { terms: ["javascript", "js "], capabilities: [{ id: "fullstack_development", confidence: "medium" }, { id: "web_development", confidence: "high" }] },
  { terms: ["typescript"], capabilities: [{ id: "fullstack_development", confidence: "medium" }, { id: "web_development", confidence: "high" }] },
  { terms: ["python"], capabilities: [{ id: "backend_development", confidence: "medium" }, { id: "scripting", confidence: "high" }] },
  { terms: ["react native"], capabilities: [{ id: "mobile_development", confidence: "high" }] },
  { terms: ["react", "next.js", "nextjs", "vue", "angular", "svelte"], capabilities: [{ id: "frontend_development", confidence: "high" }, { id: "web_development", confidence: "medium" }] },
  { terms: ["node.js", "nodejs", "node js", "express", "fastify"], capabilities: [{ id: "backend_development", confidence: "high" }, { id: "api_development", confidence: "medium" }] },
  { terms: ["flask", "django", "fastapi", "rails", "ruby on rails", "spring"], capabilities: [{ id: "backend_development", confidence: "high" }, { id: "api_development", confidence: "medium" }] },
  { terms: ["sql", "postgresql", "postgres", "mysql", "sqlite", "database"], capabilities: [{ id: "database_querying", confidence: "high" }, { id: "data_modeling", confidence: "medium" }] },
  { terms: ["prisma", "orm", "sqlalchemy"], capabilities: [{ id: "database_querying", confidence: "high" }, { id: "backend_development", confidence: "medium" }] },
  { terms: ["mongodb", "redis", "nosql"], capabilities: [{ id: "database_querying", confidence: "medium" }] },
  { terms: ["html", "css", "tailwind"], capabilities: [{ id: "frontend_development", confidence: "high" }] },
  { terms: ["swift", "swiftui", "kotlin", "android", "ios"], capabilities: [{ id: "mobile_development", confidence: "high" }] },
  { terms: ["c++", "rtos", "embedded", "can bus", "cuda"], capabilities: [{ id: "embedded_systems", confidence: "high" }] },
  { terms: ["excel", "spreadsheet"], capabilities: [{ id: "data_analysis", confidence: "medium" }, { id: "reporting", confidence: "medium" }] },
  { terms: ["git", "github", "version control"], capabilities: [{ id: "version_control", confidence: "high" }] },

  // --- Requirement phrases from deterministic extractor + common JD phrasing ---
  { terms: ["full stack", "full-stack", "fullstack"], capabilities: [{ id: "fullstack_development", confidence: "high" }] },
  { terms: ["frontend", "front-end", "front end"], capabilities: [{ id: "frontend_development", confidence: "high" }] },
  { terms: ["backend", "back-end", "back end", "server-side"], capabilities: [{ id: "backend_development", confidence: "high" }] },
  { terms: ["web application", "web developer", "web development"], capabilities: [{ id: "web_development", confidence: "high" }] },
  { terms: ["rest api", "rest ", "graphql", "api development", "api design", "endpoints"], capabilities: [{ id: "api_development", confidence: "high" }] },
  { terms: ["api integration", "webhook", "third-party api", "external service", "api "], capabilities: [{ id: "api_integration", confidence: "high" }] },
  { terms: ["integration", "integrate"], capabilities: [{ id: "systems_integration", confidence: "medium" }, { id: "api_integration", confidence: "medium" }] },
  { terms: ["software engineering fundamentals", "software engineering", "software development", "engineering best practices", "code review"], capabilities: [{ id: "software_engineering_fundamentals", confidence: "high" }] },
  { terms: ["testing", "test-driven", "tdd", "unit test", "automated test", "selenium", "playwright"], capabilities: [{ id: "testing_qa", confidence: "high" }] },
  { terms: ["quality assurance", "qa "], capabilities: [{ id: "quality_assurance", confidence: "high" }, { id: "testing_qa", confidence: "medium" }] },
  { terms: ["debug", "debugging"], capabilities: [{ id: "debugging", confidence: "high" }, { id: "technical_troubleshooting", confidence: "medium" }] },
  { terms: ["scripting", "scripts", "automation script"], capabilities: [{ id: "scripting", confidence: "high" }] },
  { terms: ["scalable", "scalability", "distributed system", "high-performance", "high performance", "microservice"], capabilities: [{ id: "scalable_systems", confidence: "high" }] },
  { terms: ["architecture", "architect", "system design"], capabilities: [{ id: "architecture_design", confidence: "high" }] },

  // --- Cloud / infra / ops ---
  { terms: ["aws", "gcp", "azure", "cloud platform", "cloud service", "cloud infrastructure", "cloud"], capabilities: [{ id: "cloud_operations", confidence: "high" }] },
  { terms: ["docker", "kubernetes", "ci/cd", "cicd", "pipeline", "containeriz", "terraform", "devops"], capabilities: [{ id: "devops_practices", confidence: "high" }, { id: "infrastructure_management", confidence: "medium" }] },
  { terms: ["infrastructure"], capabilities: [{ id: "infrastructure_management", confidence: "high" }] },
  { terms: ["sre", "site reliability", "slo", "sla", "on-call", "incident response", "incident management"], capabilities: [{ id: "site_reliability", confidence: "high" }] },
  { terms: ["observability", "monitoring", "logging", "alerting", "logs"], capabilities: [{ id: "observability_monitoring", confidence: "high" }] },
  { terms: ["security", "penetration", "threat model", "oscp", "cissp"], capabilities: [{ id: "security_practices", confidence: "high" }] },

  // --- Data ---
  { terms: ["data analysis", "analyze data", "insights", "analytics", "analytical"], capabilities: [{ id: "data_analysis", confidence: "high" }] },
  { terms: ["data pipeline", "etl", "airflow", "dbt", "spark", "data engineering"], capabilities: [{ id: "data_engineering", confidence: "high" }] },
  { terms: ["dashboard", "tableau", "power bi", "looker", "visualization", "data visualization"], capabilities: [{ id: "data_visualization", confidence: "high" }] },
  { terms: ["statistics", "statistical", "causal inference", "quantitative"], capabilities: [{ id: "statistics", confidence: "high" }] },
  { terms: ["snowflake", "bigquery", "redshift", "data warehouse", "data warehousing"], capabilities: [{ id: "data_warehousing", confidence: "high" }] },
  { terms: ["reporting", "reports", "kpi"], capabilities: [{ id: "reporting", confidence: "high" }, { id: "metrics_tracking", confidence: "medium" }] },

  // --- AI / ML ---
  { terms: ["openai", "anthropic", "mistral model", "llm", "large language model", "gpt", "generative ai", "genai"], capabilities: [{ id: "llm_integration", confidence: "high" }] },
  { terms: ["prompt engineering", "prompt design", "prompts", "prompt"], capabilities: [{ id: "prompt_engineering", confidence: "high" }] },
  { terms: ["agentic", "ai agent", "ai workflow", "ai-powered", "ai automation"], capabilities: [{ id: "ai_workflows", confidence: "high" }] },
  { terms: ["rag", "retrieval-augmented", "retrieval augmented", "vector database", "embeddings"], capabilities: [{ id: "rag_systems", confidence: "high" }] },
  { terms: ["evals", "ai evaluation", "ai quality", "evaluation framework"], capabilities: [{ id: "ai_evaluation", confidence: "high" }] },
  { terms: ["machine learning", "ml engineering", "pytorch", "tensorflow", "model training", "model serving", "fine-tuning", "fine tuning", "mlops"], capabilities: [{ id: "ml_engineering", confidence: "high" }] },
  { terms: ["research scientist", "publication", "neurips", "acl", "phd"], capabilities: [{ id: "ml_research", confidence: "high" }] },
  { terms: ["ai product", "ai feature"], capabilities: [{ id: "ai_product_development", confidence: "high" }] },
  { terms: ["langchain", "langgraph", "llamaindex", "ai framework"], capabilities: [{ id: "ai_workflows", confidence: "high" }, { id: "llm_integration", confidence: "medium" }] },

  // --- Customer-facing / consulting ---
  { terms: ["customer support", "technical support", "support engineer", "helpdesk", "service desk", "ticket", "zendesk"], capabilities: [{ id: "customer_support", confidence: "high" }] },
  { terms: ["troubleshoot", "troubleshooting", "diagnose", "issue resolution", "resolve issues", "problem resolution"], capabilities: [{ id: "technical_troubleshooting", confidence: "high" }] },
  { terms: ["customer interaction", "customer-facing", "customer facing", "client engagement", "customer engagement", "client relationship", "with customers", "with clients", "customer communication", "client communication"], capabilities: [{ id: "customer_communication", confidence: "high" }] },
  { terms: ["persuasion", "persuasive", "door-to-door", "face-to-face", "public-facing", "verbal communication"], capabilities: [{ id: "customer_communication", confidence: "medium" }, { id: "communication", confidence: "medium" }] },
  { terms: ["deployed", "shipped", "launched", "live demo", "production features"], capabilities: [{ id: "product_building", confidence: "medium" }, { id: "product_demos", confidence: "medium" }] },
  { terms: ["analyze logs", "log analysis", "log files", "logs"], capabilities: [{ id: "observability_monitoring", confidence: "medium" }, { id: "technical_troubleshooting", confidence: "medium" }] },
  { terms: ["stakeholder"], capabilities: [{ id: "stakeholder_communication", confidence: "high" }] },
  { terms: ["presentation", "presenting", "present findings", "workshops"], capabilities: [{ id: "presentation_skills", confidence: "high" }] },
  { terms: ["demo", "demos", "demonstration", "proof-of-concept", "proof of concept", "poc"], capabilities: [{ id: "product_demos", confidence: "high" }] },
  { terms: ["pre-sales", "presales", "sales engineer"], capabilities: [{ id: "presales", confidence: "high" }] },
  { terms: ["consulting", "consultant", "advisory", "advise clients"], capabilities: [{ id: "consulting", confidence: "high" }] },
  { terms: ["discovery", "requirements gathering", "gather requirements", "scoping", "requirements discovery"], capabilities: [{ id: "requirements_discovery", confidence: "high" }] },
  { terms: ["solution design", "design solutions"], capabilities: [{ id: "solution_design", confidence: "high" }] },
  { terms: ["implementation", "implement solutions", "configure", "deployment for clients", "onboarding"], capabilities: [{ id: "solution_implementation", confidence: "high" }] },
  { terms: ["training session", "train users", "user training"], capabilities: [{ id: "onboarding_training", confidence: "high" }] },
  { terms: ["account management", "account manager", "renewals"], capabilities: [{ id: "account_management", confidence: "high" }] },
  { terms: ["quota", "prospecting", "closing deals", "negotiation", "lead generation"], capabilities: [{ id: "sales", confidence: "high" }] },
  { terms: ["empathy", "de-escalat", "patience"], capabilities: [{ id: "customer_empathy", confidence: "high" }] },

  // --- Product / project ---
  { terms: ["ship features", "shipped", "product feature", "end to end", "end-to-end", "ownership", "product building", "build product"], capabilities: [{ id: "product_building", confidence: "high" }] },
  { terms: ["roadmap", "prioritization", "prioritiz", "backlog", "product strategy", "product manage"], capabilities: [{ id: "product_management", confidence: "high" }] },
  { terms: ["project management", "project delivery", "project coordination", "deliver projects"], capabilities: [{ id: "project_management", confidence: "high" }] },
  { terms: ["agile", "scrum", "kanban", "sprint"], capabilities: [{ id: "agile_methods", confidence: "high" }] },
  { terms: ["user research", "user stories", "user interview"], capabilities: [{ id: "user_research", confidence: "high" }] },
  { terms: ["ui/ux", "ux", "user experience", "user interface", "accessible interface"], capabilities: [{ id: "ui_ux", confidence: "high" }] },
  { terms: ["cross-functional", "cross functional", "coordination across"], capabilities: [{ id: "cross_functional_coordination", confidence: "high" }] },
  { terms: ["metrics", "success metrics"], capabilities: [{ id: "metrics_tracking", confidence: "medium" }] },

  // --- Operations / business ---
  { terms: ["workflow automation", "automate", "automation", "business process"], capabilities: [{ id: "workflow_automation", confidence: "high" }] },
  { terms: ["process improvement", "process design", "sop", "operational process"], capabilities: [{ id: "process_improvement", confidence: "high" }] },
  { terms: ["operations", "operational"], capabilities: [{ id: "operations_management", confidence: "medium" }] },
  { terms: ["business analysis", "business acumen", "commercial"], capabilities: [{ id: "business_analysis", confidence: "high" }] },
  { terms: ["compliance", "regulatory", "audit", "policy"], capabilities: [{ id: "compliance", confidence: "high" }] },
  { terms: ["documentation", "knowledge base", "document"], capabilities: [{ id: "documentation", confidence: "high" }] },
  { terms: ["technical writing", "developer docs", "sdk example"], capabilities: [{ id: "technical_writing", confidence: "high" }] },
  { terms: ["investigation", "investigate", "root cause"], capabilities: [{ id: "investigation", confidence: "high" }] },
  { terms: ["accounting", "bookkeeping", "financial reporting", "budget", "forecast"], capabilities: [{ id: "finance_accounting", confidence: "high" }] },
  { terms: ["seo", "campaign", "social media", "content marketing", "copywriting"], capabilities: [{ id: "marketing", confidence: "high" }] },
  { terms: ["sourcing", "talent acquisition", "interviewing candidates", "recruiting"], capabilities: [{ id: "recruiting", confidence: "high" }] },

  // --- Leadership / experience / general ---
  { terms: ["team lead", "lead team", "leading team", "technical leadership", "mentor senior"], capabilities: [{ id: "team_leadership", confidence: "high" }] },
  { terms: ["people management", "direct reports", "performance review", "hiring"], capabilities: [{ id: "people_management", confidence: "high" }] },
  { terms: ["director", "vp ", "vice president", "head of", "executive", "org design", "board reporting"], capabilities: [{ id: "org_leadership", confidence: "high" }] },
  { terms: ["mentoring", "mentorship", "coaching"], capabilities: [{ id: "mentoring", confidence: "high" }] },
  { terms: ["senior-level experience", "senior level", "5+ years", "6+ years", "7+ years", "8+ years", "10+ years", "12+ years"], capabilities: [{ id: "senior_experience", confidence: "high" }] },
  { terms: ["years experience", "professional experience", "work experience"], capabilities: [{ id: "professional_experience", confidence: "high" }] },
  { terms: ["communication"], capabilities: [{ id: "communication", confidence: "high" }] },
  { terms: ["collaboration", "collaborat", "teamwork", "team player"], capabilities: [{ id: "collaboration", confidence: "high" }] },
  { terms: ["learning mindset", "fast learner", "willingness to learn", "learning velocity", "adaptab"], capabilities: [{ id: "learning_agility", confidence: "high" }] },
  { terms: ["english"], capabilities: [{ id: "english_language", confidence: "high" }] },
  { terms: ["spanish"], capabilities: [{ id: "spanish_language", confidence: "high" }] },
  { terms: ["german"], capabilities: [{ id: "german_language", confidence: "high" }] },
  { terms: ["french"], capabilities: [{ id: "french_language", confidence: "high" }] },

  // --- Common LLM-extracted requirement phrasings ---
  { terms: ["junior level", "junior", "entry level", "entry-level", "graduate"], capabilities: [{ id: "professional_experience", confidence: "medium" }] },
  { terms: ["prototype", "prototyping", "build prototypes"], capabilities: [{ id: "product_building", confidence: "medium" }, { id: "solution_design", confidence: "medium" }] },
  { terms: ["production deployment", "deploy to production", "deployment"], capabilities: [{ id: "devops_practices", confidence: "medium" }] },
  { terms: ["portfolio", "side project", "personal project"], capabilities: [{ id: "product_building", confidence: "medium" }] },
  { terms: ["enterprise customer", "enterprise client", "enterprise software"], capabilities: [{ id: "customer_communication", confidence: "medium" }] },
  { terms: ["application support", "escalat"], capabilities: [{ id: "customer_support", confidence: "high" }, { id: "technical_troubleshooting", confidence: "medium" }] },
  { terms: ["solutions engineering", "solutions engineer"], capabilities: [{ id: "solution_implementation", confidence: "high" }, { id: "presales", confidence: "medium" }] },
  { terms: ["applied ai", "ai solutions", "data and ai"], capabilities: [{ id: "ai_product_development", confidence: "medium" }, { id: "llm_integration", confidence: "medium" }] },
  { terms: ["gpu"], capabilities: [{ id: "ml_engineering", confidence: "medium" }, { id: "infrastructure_management", confidence: "medium" }] },
  { terms: ["product expertise", "product knowledge"], capabilities: [{ id: "product_building", confidence: "low" }] },
  { terms: ["technically minded", "technical aptitude", "technical foundation"], capabilities: [{ id: "software_engineering_fundamentals", confidence: "medium" }] },
  { terms: ["problem solving", "problem-solving"], capabilities: [{ id: "investigation", confidence: "medium" }] },

  // --- Evidence-claim phrasings (candidate side) ---
  { terms: ["technical skills"], capabilities: [{ id: "software_engineering_fundamentals", confidence: "low" }] },
  { terms: ["whatsapp", "twilio", "chatbot", "conversational"], capabilities: [{ id: "ai_workflows", confidence: "medium" }, { id: "api_integration", confidence: "medium" }] },
];

export function mapToCapabilities(text: string): CapabilityMappingResult {
  const normalized = ` ${text.toLowerCase().trim()} `;
  const found = new Map<string, CapabilityMapping>();

  for (const rule of TERM_RULES) {
    const matchedTerm = rule.terms.find(t => {
      // Short terms must match on word boundaries to avoid substring false
      // positives (e.g. "vp " inside "mvp ", "rag" inside "storage")
      if (t.trim().length <= 4) {
        const escaped = t.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`).test(normalized);
      }
      return normalized.includes(t);
    });
    if (!matchedTerm) continue;

    for (const cap of rule.capabilities) {
      if (!CAPABILITY_INDEX.has(cap.id)) continue;
      const existing = found.get(cap.id);
      // Keep the highest confidence per capability
      if (!existing || confidenceRank(cap.confidence) > confidenceRank(existing.confidence)) {
        found.set(cap.id, {
          capabilityId: cap.id,
          confidence: cap.confidence,
          matchedTerm,
        });
      }
    }
  }

  const capabilities = Array.from(found.values());
  return {
    text,
    capabilities,
    source: "deterministic",
    unmapped: capabilities.length === 0,
  };
}

export function confidenceRank(c: MappingConfidence): number {
  return c === "high" ? 3 : c === "medium" ? 2 : 1;
}

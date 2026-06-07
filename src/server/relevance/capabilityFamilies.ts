/**
 * Capability Families Taxonomy
 *
 * Recruiter-style transferable capability classification.
 * Focus on what the candidate CAN DO, not just keywords they mention.
 */

export type CapabilityFamily =
  | "AI_AUTOMATION"
  | "FULLSTACK"
  | "FRONTEND"
  | "BACKEND"
  | "DATA"
  | "DEVOPS"
  | "QA"
  | "PRODUCT"
  | "SUPPORT"
  | "OPERATIONS"
  | "COMMUNICATION"
  | "DOCUMENTATION"
  | "LEADERSHIP"
  | "SALES"
  | "RECRUITING"
  | "PROJECT_MANAGEMENT"
  | "ANALYTICS"
  | "CUSTOMER_SUCCESS"
  | "COMPLIANCE"
  | "DECISION_MAKING"
  | "STAKEHOLDER_MANAGEMENT"
  | "COORDINATION"
  | "EXECUTION";

export const CAPABILITY_FAMILIES: Record<CapabilityFamily, string[]> = {
  // ─── Technical Families ───────────────────────────────────────────────────

  AI_AUTOMATION: [
    // Core AI/LLM
    "openai", "anthropic", "llm", "gpt", "claude", "gemini",
    "langchain", "llamaindex", "huggingface", "transformers",
    // Agents & Workflows
    "agent", "workflow", "automation", "prompt", "prompt engineering",
    "chatbot", "assistant", "copilot", "orchestration",
    // Integration patterns
    "webhook", "event-driven", "streaming", "sse", "websocket",
    "api integration", "third-party api", "sdk",
    // AI features
    "embedding", "vector", "rag", "retrieval", "classification",
    "summarization", "generation", "completion", "fine-tuning",
  ],

  FULLSTACK: [
    // Frontend
    "react", "next", "next.js", "vue", "nuxt", "svelte", "solid",
    "typescript", "javascript", "frontend", "client-side", "spa",
    // Backend
    "node", "nodejs", "express", "fastify", "nest", "bun", "deno",
    "python", "django", "flask", "fastapi",
    "go", "golang", "rust",
    // Database
    "postgres", "postgresql", "mysql", "sqlite", "prisma", "orm",
    "redis", "mongodb", "dynamodb", "firebase",
    // Full-stack patterns
    "end-to-end", "e2e", "full-stack", "fullstack", "product", "mvp",
    "crud", "rest", "graphql", "trpc", "api design",
  ],

  FRONTEND: [
    "react", "vue", "angular", "svelte", "solid", "preact",
    "next.js", "next", "nuxt", "gatsby", "remix", "astro",
    "typescript", "javascript", "es6", "es2020",
    "html", "css", "sass", "scss", "less",
    "tailwind", "bootstrap", "mui", "chakra", "shadcn",
    "dom", "browser", "client-side", "spa", "pwa",
    "responsive", "mobile-first", "accessibility", "a11y",
    "webpack", "vite", "esbuild", "parcel", "bundler",
  ],

  BACKEND: [
    "node", "nodejs", "express", "fastify", "nest", "koa",
    "python", "django", "flask", "fastapi", "tornado",
    "go", "golang", "gin", "echo", "fiber",
    "rust", "actix", "axum",
    "java", "spring", "kotlin",
    "microservices", "distributed", "server", "backend",
    "grpc", "protobuf", "soap", "rest", "graphql", "websocket",
    "message queue", "kafka", "rabbitmq", "sqs", "event-driven",
    "postgres", "mysql", "mongodb", "redis", "elasticsearch",
    "database", "orm", "sql", "nosql",
  ],

  DATA: [
    "sql", "data", "etl", "pipeline", "warehouse", "analytics",
    "dbt", "airflow", "prefect", "dagster",
    "pandas", "numpy", "scipy", "polars", "dask",
    "looker", "tableau", "powerbi", "metabase", "grafana",
    "spark", "hadoop", "bigquery", "snowflake", "redshift",
    "ml", "machine learning", "model", "training", "inference",
    "feature store", "experimentation", "ab testing",
  ],

  DEVOPS: [
    "docker", "kubernetes", "k8s", "helm", "container",
    "terraform", "pulumi", "ansible", "cloudformation",
    "aws", "gcp", "azure", "vercel", "netlify", "heroku",
    "ci/cd", "github actions", "jenkins", "gitlab ci", "circleci",
    "argo", "flux", "gitops",
    "monitoring", "observability", "logging", "tracing", "metrics",
    "prometheus", "grafana", "datadog", "newrelic",
    "load balancer", "cdn", "edge", "cdn",
  ],

  QA: [
    "quality", "qa", "testing", "test", "accuracy", "precision",
    "moderation", "compliance", "policy", "guidelines",
    "review", "audit", "verification", "validation",
    "unit test", "integration test", "e2e test", "cypress", "playwright",
    "jest", "vitest", "mocha", "pytest",
    "bug", "defect", "issue tracking", "triage",
    "kpi", "metrics", "quality assurance", "qc",
  ],

  // ─── Product & Business Families ──────────────────────────────────────────

  PRODUCT: [
    "product", "feature", "roadmap", "prioritization",
    "user research", "ux research", "interview", "survey",
    "experimentation", "mvp", "prototype", "iteration",
    "stakeholder", "pm", "product manager", "product owner",
    "requirement", "spec", "user story", "acceptance criteria",
    "metrics", "kpi", "okrs", "north star",
    "growth", "conversion", "retention", "engagement",
  ],

  SUPPORT: [
    "support", "customer support", "technical support",
    "troubleshoot", "troubleshooting", "debug", "debugging",
    "help desk", "ticketing", "incident", "escalation",
    "sla", "response time", "resolution",
    "customer success", "cs", "csat", "nps",
    "onboarding", "training", "documentation",
    "problem solving", "root cause", "investigation",
  ],

  OPERATIONS: [
    "operations", "ops", "process", "workflow", "procedure",
    "efficiency", "optimization", "throughput", "scalability",
    "incident response", "on-call", "pagerduty", "sre",
    "capacity planning", "forecasting", "resource allocation",
    "runbook", "playbook", "standard operating procedure", "sop",
    "vendor", "third-party", "integration", "system",
  ],

  // ─── People & Communication Families ──────────────────────────────────────

  COMMUNICATION: [
    "communication", "communicate", "present", "presentation",
    "writing", "documentation", "docs", "readme", "wiki",
    "explain", "teach", "mentor", "coach", "train",
    "influence", "persuade", "negotiate", "consensus",
    "public speaking", "speaking", "talk", "conference",
    "cross-functional", "collaboration", "teamwork",
    "feedback", "critique", "review", "1:1", "performance review",
    "slack", "async", "remote", "distributed",
  ],

  DOCUMENTATION: [
    "documentation", "docs", "readme", "wiki", "notion", "confluence",
    "api docs", "openapi", "swagger", "redoc",
    "technical writing", "writer", "author", "editor",
    "diagram", "flowchart", "architecture diagram",
    "knowledge base", "kb", "faq", "guide", "tutorial",
    "onboarding doc", "runbook", "playbook", "sop",
  ],

  LEADERSHIP: [
    "lead", "leader", "leadership", "manage", "manager",
    "mentor", "mentorship", "coach", "coaching",
    "team lead", "tech lead", "engineering manager", "em",
    "cto", "vp", "director", "head of",
    "strategy", "vision", "direction", "roadmap",
    "hiring", "recruiting", "interview", "team building",
    "performance", "promotion", "career development",
    "conflict resolution", "mediation", "crisis management",
  ],

  SALES: [
    "sales", "sell", "revenue", "quota", "target", "goal",
    "prospect", "prospecting", "lead", "lead generation",
    "pipeline", "funnel", "conversion", "close", "closing",
    "negotiation", "contract", "deal", "account",
    "crm", "salesforce", "hubspot", "pipedrive",
    "cold call", "outbound", "inbound", "sdr", "bdr", "ae",
    "relationship", "rapport", "trust", "objection handling",
  ],

  RECRUITING: [
    "recruit", "recruiting", "recruitment", "talent",
    "sourcing", "sourcer", "boolean search", "linkedin",
    "interview", "interviewer", "hiring", "hire",
    "offer", "negotiation", "compensation", "salary",
    "culture fit", "values alignment", "diversity",
    "employer branding", "candidate experience",
    "ats", "applicant tracking", "greenhouse", "lever",
  ],

  // ─── Professional Skill Families ────────────────────────────────────────────

  PROJECT_MANAGEMENT: [
    "project", "program", "portfolio", "ppm",
    "pm", "project manager", "program manager",
    "plan", "planning", "schedule", "timeline", "milestone",
    "waterfall", "agile", "scrum", "kanban", "sprint",
    "jira", "asana", "monday", "linear", "notion",
    "risk", "dependency", "stakeholder", "status", "report",
    "budget", "resource", "allocation", "capacity",
    "kickoff", "retro", "retrospective", "post-mortem",
  ],

  ANALYTICS: [
    "analytics", "analysis", "analyst", "data-driven",
    "metrics", "kpi", "dashboard", "reporting", "report",
    "sql", "query", "database", "warehouse",
    "excel", "sheets", "tableau", "looker", "powerbi",
    "python", "r", "spss", "sas", "stata",
    "statistical", "regression", "correlation", "hypothesis",
    "funnel", "cohort", "segmentation", "attribution",
    "experiment", "ab test", "multivariate", "significance",
  ],

  CUSTOMER_SUCCESS: [
    "customer success", "cs", "csm", "account manager",
    "retention", "churn", "renewal", "expansion", "upsell",
    "onboarding", "adoption", "activation", "engagement",
    "health score", "risk score", "qbr", "business review",
    "relationship", "partnership", "trusted advisor",
    "outcome", "value realization", "roi",
    "satisfaction", "csat", "nps", "feedback",
  ],

  COMPLIANCE: [
    "compliance", "regulatory", "regulation", "legal",
    "policy", "procedure", "guideline", "standard",
    "gdpr", "ccpa", "privacy", "data protection",
    "sox", "hipaa", "pci", "dss", "security",
    "audit", "auditor", "examination", "review",
    "risk", "control", "mitigation", "assessment",
    "certification", "iso", "soc", "framework",
  ],

  DECISION_MAKING: [
    "decision", "decide", "judgment", "judgement", "discretion",
    "analysis", "evaluate", "assessment", "weigh", "trade-off",
    "prioritize", "prioritization", "urgent", "important",
    "stakeholder", "input", "consultation", "consensus",
    "escalation", "escalate", "delegate", "ownership",
    "ambiguity", "uncertainty", "incomplete information",
    "outcome", "result", "impact", "consequence",
  ],

  STAKEHOLDER_MANAGEMENT: [
    "stakeholder", "stakeholder management", "relationship management",
    "influence", "influencing", "negotiate", "negotiation",
    "align", "alignment", "buy-in", "support",
    "expectation", "expectation management", "communication",
    "executive", "leadership", "sponsor", "champion",
    "cross-functional", "matrix", "dotted line", "virtual team",
    "conflict", "tension", "resolution", "diplomacy",
  ],

  COORDINATION: [
    "coordinate", "coordination", "organize", "organization",
    "schedule", "scheduling", "calendar", "booking",
    "logistics", "planning", "preparation", "setup",
    "event", "workshop", "meeting", "offsite", "all-hands",
    "vendor", "supplier", "contractor", "third-party",
    "multi-task", "context switching", "parallel work",
    "follow-up", "follow through", "closure", "completion",
  ],

  EXECUTION: [
    "execution", "execute", "deliver", "delivery", "ship", "shipping",
    "bias to action", "get things done", "gtd", "results",
    "outcome", "output", "impact", "achievement",
    "deadline", "milestone", "commitment", "promise",
    "quality", "excellence", "craft", "polish",
    "speed", "velocity", "throughput", "efficiency",
    "ownership", "accountability", "responsibility", "end-to-end",
  ],
};

// ─── Classification Helpers ─────────────────────────────────────────────────

export function classifyTextFamilies(text: string): CapabilityFamily[] {
  const normalized = text.toLowerCase();
  const families: CapabilityFamily[] = [];

  for (const [family, keywords] of Object.entries(CAPABILITY_FAMILIES)) {
    let score = 0;
    for (const keyword of keywords) {
      if (normalized.includes(keyword.toLowerCase())) {
        score++;
        // Early exit if strong match
        if (score >= 2) break;
      }
    }
    // Family matches if at least 2 keywords or 1 very specific keyword
    if (score >= 2) {
      families.push(family as CapabilityFamily);
    }
  }

  return families;
}

export function calculateFamilyOverlap(
  sourceFamilies: CapabilityFamily[],
  targetFamilies: CapabilityFamily[]
): number {
  if (sourceFamilies.length === 0 || targetFamilies.length === 0) return 0;

  const sourceSet = new Set(sourceFamilies);
  let matches = 0;

  for (const family of targetFamilies) {
    if (sourceSet.has(family)) matches++;
  }

  // Score based on proportion of overlap
  return Math.round((matches / Math.max(sourceFamilies.length, targetFamilies.length)) * 100);
}

// ─── Transferability Matrix ───────────────────────────────────────────────

/**
 * Defines which capability families transfer well to which other families.
 * Used to boost scores for non-exact but transferable matches.
 */
export const TRANSFERABILITY_MATRIX: Record<CapabilityFamily, CapabilityFamily[]> = {
  AI_AUTOMATION: ["FULLSTACK", "BACKEND", "PRODUCT", "DOCUMENTATION", "EXECUTION"],
  FULLSTACK: ["FRONTEND", "BACKEND", "AI_AUTOMATION", "PRODUCT", "EXECUTION"],
  FRONTEND: ["FULLSTACK", "PRODUCT", "DOCUMENTATION"],
  BACKEND: ["FULLSTACK", "DEVOPS", "DATA", "AI_AUTOMATION"],
  DATA: ["BACKEND", "ANALYTICS", "AI_AUTOMATION", "QA"],
  DEVOPS: ["BACKEND", "OPERATIONS", "QA", "SUPPORT"],
  QA: ["SUPPORT", "OPERATIONS", "DEVOPS", "COMPLIANCE"],
  PRODUCT: ["FULLSTACK", "FRONTEND", "ANALYTICS", "PROJECT_MANAGEMENT"],
  SUPPORT: ["QA", "CUSTOMER_SUCCESS", "OPERATIONS", "COMMUNICATION"],
  OPERATIONS: ["DEVOPS", "QA", "SUPPORT", "PROJECT_MANAGEMENT"],
  COMMUNICATION: ["DOCUMENTATION", "SALES", "RECRUITING", "SUPPORT", "LEADERSHIP"],
  DOCUMENTATION: ["COMMUNICATION", "PRODUCT", "QA", "SUPPORT"],
  LEADERSHIP: ["PROJECT_MANAGEMENT", "STAKEHOLDER_MANAGEMENT", "DECISION_MAKING", "EXECUTION"],
  SALES: ["COMMUNICATION", "CUSTOMER_SUCCESS", "RECRUITING"],
  RECRUITING: ["SALES", "COMMUNICATION", "STAKEHOLDER_MANAGEMENT", "COORDINATION"],
  PROJECT_MANAGEMENT: ["LEADERSHIP", "COORDINATION", "OPERATIONS", "PRODUCT"],
  ANALYTICS: ["DATA", "QA", "PRODUCT", "DECISION_MAKING"],
  CUSTOMER_SUCCESS: ["SUPPORT", "SALES", "COMMUNICATION"],
  COMPLIANCE: ["QA"],
  DECISION_MAKING: ["LEADERSHIP", "ANALYTICS", "PRODUCT", "STAKEHOLDER_MANAGEMENT"],
  STAKEHOLDER_MANAGEMENT: ["LEADERSHIP", "COMMUNICATION", "PROJECT_MANAGEMENT", "COORDINATION"],
  COORDINATION: ["PROJECT_MANAGEMENT", "OPERATIONS", "RECRUITING"],
  EXECUTION: ["FULLSTACK", "AI_AUTOMATION", "LEADERSHIP", "PROJECT_MANAGEMENT"],
};

export function calculateTransferabilityBonus(
  sourceFamilies: CapabilityFamily[],
  targetFamilies: CapabilityFamily[]
): number {
  let bonus = 0;

  for (const source of sourceFamilies) {
    const transferableTo = TRANSFERABILITY_MATRIX[source] || [];
    for (const target of targetFamilies) {
      if (transferableTo.includes(target)) {
        bonus += 15; // 15 points per transferable family match
      }
    }
  }

  return Math.min(bonus, 50); // Cap at 50 bonus points
}

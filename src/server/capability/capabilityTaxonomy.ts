// ---------------------------------------------------------------------------
// Capability Taxonomy V1
// Canonical capability representation used by the Capability Mapping Layer.
// ~90 capabilities across technical, data, AI, customer-facing, operations,
// and leadership domains. Descriptions are embedding-ready for a future
// AI fallback (not enabled in Phase 1).
// `adjacent` lists related capabilities used for the partial-match tier.
// ---------------------------------------------------------------------------

export interface Capability {
  id: string;
  name: string;
  description: string;
  adjacent: string[];
}

export const CAPABILITY_TAXONOMY: Capability[] = [
  // --- Software engineering ---
  { id: "frontend_development", name: "Frontend Development", description: "Building user interfaces and client-side web applications", adjacent: ["fullstack_development", "ui_ux", "web_development"] },
  { id: "backend_development", name: "Backend Development", description: "Building server-side applications, services and business logic", adjacent: ["fullstack_development", "api_development", "database_querying"] },
  { id: "fullstack_development", name: "Full Stack Development", description: "Building applications across frontend and backend", adjacent: ["frontend_development", "backend_development", "web_development"] },
  { id: "web_development", name: "Web Development", description: "Building web sites and web applications", adjacent: ["frontend_development", "fullstack_development"] },
  { id: "mobile_development", name: "Mobile Development", description: "Building native or cross-platform mobile applications", adjacent: ["frontend_development"] },
  { id: "api_development", name: "API Development", description: "Designing and building REST or GraphQL APIs", adjacent: ["backend_development", "api_integration"] },
  { id: "api_integration", name: "API Integration", description: "Integrating third-party APIs, webhooks and external services", adjacent: ["api_development", "workflow_automation", "systems_integration"] },
  { id: "systems_integration", name: "Systems Integration", description: "Connecting and integrating software systems and platforms", adjacent: ["api_integration", "solution_implementation"] },
  { id: "database_querying", name: "Database Querying", description: "Writing queries and working with relational or NoSQL databases (SQL, PostgreSQL, MySQL)", adjacent: ["data_modeling", "backend_development", "data_analysis"] },
  { id: "data_modeling", name: "Data Modeling", description: "Designing database schemas and data structures", adjacent: ["database_querying", "data_engineering"] },
  { id: "software_engineering_fundamentals", name: "Software Engineering Fundamentals", description: "Core software engineering practices: version control, code review, design patterns", adjacent: ["testing_qa", "backend_development", "frontend_development"] },
  { id: "testing_qa", name: "Testing & QA", description: "Writing automated tests, QA processes, test-driven development", adjacent: ["software_engineering_fundamentals", "quality_assurance"] },
  { id: "quality_assurance", name: "Quality Assurance", description: "Ensuring product and process quality through systematic verification", adjacent: ["testing_qa", "process_improvement"] },
  { id: "debugging", name: "Debugging", description: "Diagnosing and fixing software defects", adjacent: ["technical_troubleshooting", "software_engineering_fundamentals"] },
  { id: "scripting", name: "Scripting", description: "Writing scripts for automation and tooling (Python, Bash, JavaScript)", adjacent: ["workflow_automation", "backend_development"] },
  { id: "version_control", name: "Version Control", description: "Using Git and collaborative development workflows", adjacent: ["software_engineering_fundamentals"] },
  { id: "scalable_systems", name: "Scalable Systems", description: "Designing distributed, high-performance, scalable systems", adjacent: ["backend_development", "cloud_operations", "architecture_design"] },
  { id: "architecture_design", name: "Architecture Design", description: "Designing software and solution architectures", adjacent: ["scalable_systems", "solution_design"] },
  { id: "embedded_systems", name: "Embedded Systems", description: "Developing software for embedded and hardware systems", adjacent: [] },

  // --- Cloud / infrastructure / operations ---
  { id: "cloud_operations", name: "Cloud Operations", description: "Working with cloud platforms (AWS, GCP, Azure) and cloud services", adjacent: ["devops_practices", "infrastructure_management"] },
  { id: "devops_practices", name: "DevOps Practices", description: "CI/CD pipelines, containerization, deployment automation (Docker, Kubernetes)", adjacent: ["cloud_operations", "infrastructure_management", "site_reliability"] },
  { id: "infrastructure_management", name: "Infrastructure Management", description: "Managing servers, networks and infrastructure as code (Terraform)", adjacent: ["cloud_operations", "devops_practices"] },
  { id: "site_reliability", name: "Site Reliability", description: "SRE practices: SLOs, incident response, on-call, production reliability", adjacent: ["devops_practices", "observability_monitoring"] },
  { id: "observability_monitoring", name: "Observability & Monitoring", description: "Monitoring, logging, alerting and system observability", adjacent: ["site_reliability", "technical_troubleshooting"] },
  { id: "security_practices", name: "Security Practices", description: "Application security, threat modeling, security operations", adjacent: ["compliance", "infrastructure_management"] },

  // --- Data ---
  { id: "data_analysis", name: "Data Analysis", description: "Analyzing data to derive insights, reporting and metrics analysis", adjacent: ["data_visualization", "database_querying", "statistics"] },
  { id: "data_engineering", name: "Data Engineering", description: "Building data pipelines, ETL processes and data infrastructure", adjacent: ["database_querying", "data_modeling", "cloud_operations"] },
  { id: "data_visualization", name: "Data Visualization", description: "Building dashboards and visual reports (Tableau, Power BI, charts)", adjacent: ["data_analysis", "reporting"] },
  { id: "statistics", name: "Statistics", description: "Statistical analysis, modeling and quantitative methods", adjacent: ["data_analysis", "ml_engineering"] },
  { id: "data_warehousing", name: "Data Warehousing", description: "Working with data warehouses (Snowflake, BigQuery, Redshift)", adjacent: ["data_engineering", "database_querying"] },
  { id: "reporting", name: "Reporting", description: "Producing reports, KPI tracking and performance summaries", adjacent: ["data_analysis", "data_visualization"] },

  // --- AI / ML ---
  { id: "llm_integration", name: "LLM Integration", description: "Integrating large language models via APIs (OpenAI, Anthropic, Mistral)", adjacent: ["ai_workflows", "prompt_engineering", "api_integration"] },
  { id: "prompt_engineering", name: "Prompt Engineering", description: "Designing and iterating on prompts for LLMs", adjacent: ["llm_integration", "ai_evaluation"] },
  { id: "ai_workflows", name: "AI Workflows", description: "Building agentic and AI-powered automation workflows", adjacent: ["llm_integration", "workflow_automation"] },
  { id: "rag_systems", name: "RAG Systems", description: "Building retrieval-augmented generation and search-grounded AI systems", adjacent: ["llm_integration", "ai_workflows"] },
  { id: "ai_evaluation", name: "AI Evaluation", description: "Evaluating AI output quality, building evals and quality frameworks", adjacent: ["prompt_engineering", "testing_qa"] },
  { id: "ml_engineering", name: "ML Engineering", description: "Training, deploying and serving machine learning models", adjacent: ["ml_research", "data_engineering", "statistics"] },
  { id: "ml_research", name: "ML Research", description: "Machine learning research, novel architectures, publications", adjacent: ["ml_engineering", "statistics"] },
  { id: "ai_product_development", name: "AI Product Development", description: "Building AI-powered product features end to end", adjacent: ["ai_workflows", "product_building", "llm_integration"] },

  // --- Customer-facing / consulting ---
  { id: "customer_support", name: "Customer Support", description: "Supporting customers, resolving issues, handling tickets", adjacent: ["technical_troubleshooting", "customer_communication"] },
  { id: "technical_troubleshooting", name: "Technical Troubleshooting", description: "Diagnosing and resolving technical issues and incidents", adjacent: ["debugging", "customer_support", "investigation"] },
  { id: "customer_communication", name: "Customer Communication", description: "Communicating with customers and clients effectively", adjacent: ["stakeholder_communication", "customer_support"] },
  { id: "stakeholder_communication", name: "Stakeholder Communication", description: "Communicating with stakeholders, presenting to business and technical audiences", adjacent: ["customer_communication", "presentation_skills"] },
  { id: "presentation_skills", name: "Presentation Skills", description: "Delivering presentations, demos and workshops", adjacent: ["stakeholder_communication", "product_demos"] },
  { id: "product_demos", name: "Product Demos", description: "Delivering product demonstrations and proof-of-concepts to clients", adjacent: ["presentation_skills", "presales"] },
  { id: "presales", name: "Pre-sales", description: "Technical pre-sales activities supporting deals", adjacent: ["product_demos", "sales"] },
  { id: "consulting", name: "Consulting", description: "Advising clients, scoping engagements, delivering consulting work", adjacent: ["requirements_discovery", "stakeholder_communication", "solution_design"] },
  { id: "requirements_discovery", name: "Requirements Discovery", description: "Gathering and analyzing client or user requirements", adjacent: ["consulting", "business_analysis"] },
  { id: "solution_design", name: "Solution Design", description: "Designing solutions to client or business problems", adjacent: ["architecture_design", "consulting", "solution_implementation"] },
  { id: "solution_implementation", name: "Solution Implementation", description: "Implementing, configuring and deploying solutions for clients", adjacent: ["solution_design", "systems_integration", "onboarding_training"] },
  { id: "onboarding_training", name: "Onboarding & Training", description: "Training users and onboarding customers onto products", adjacent: ["solution_implementation", "documentation"] },
  { id: "account_management", name: "Account Management", description: "Managing customer accounts and relationships", adjacent: ["customer_communication", "sales"] },
  { id: "sales", name: "Sales", description: "Prospecting, negotiating and closing deals", adjacent: ["presales", "account_management"] },
  { id: "customer_empathy", name: "Customer Empathy", description: "Understanding user needs, patience and de-escalation", adjacent: ["customer_support", "customer_communication"] },

  // --- Product / project ---
  { id: "product_building", name: "Product Building", description: "Building and shipping product features with ownership", adjacent: ["fullstack_development", "product_management", "ai_product_development"] },
  { id: "product_management", name: "Product Management", description: "Roadmaps, prioritization, backlog management, product strategy", adjacent: ["product_building", "project_management", "user_research"] },
  { id: "project_management", name: "Project Management", description: "Planning, coordinating and delivering projects", adjacent: ["product_management", "agile_methods", "cross_functional_coordination"] },
  { id: "agile_methods", name: "Agile Methods", description: "Agile, Scrum, Kanban and sprint-based delivery", adjacent: ["project_management"] },
  { id: "user_research", name: "User Research", description: "User research, user stories and UX collaboration", adjacent: ["product_management", "ui_ux"] },
  { id: "ui_ux", name: "UI/UX", description: "User interface and experience design sensibility", adjacent: ["frontend_development", "user_research"] },
  { id: "cross_functional_coordination", name: "Cross-functional Coordination", description: "Coordinating across teams and functions", adjacent: ["project_management", "stakeholder_communication"] },
  { id: "metrics_tracking", name: "Metrics Tracking", description: "Defining and tracking KPIs and success metrics", adjacent: ["reporting", "data_analysis"] },

  // --- Operations / business ---
  { id: "workflow_automation", name: "Workflow Automation", description: "Automating business processes and workflows", adjacent: ["ai_workflows", "scripting", "process_improvement"] },
  { id: "process_improvement", name: "Process Improvement", description: "Designing and improving operational processes and SOPs", adjacent: ["workflow_automation", "operations_management"] },
  { id: "operations_management", name: "Operations Management", description: "Managing day-to-day business operations", adjacent: ["process_improvement", "project_management"] },
  { id: "business_analysis", name: "Business Analysis", description: "Analyzing business problems, processes and commercial context", adjacent: ["requirements_discovery", "data_analysis", "consulting"] },
  { id: "compliance", name: "Compliance", description: "Regulatory compliance, policy and audit work", adjacent: ["security_practices", "documentation"] },
  { id: "documentation", name: "Documentation", description: "Writing technical and process documentation, knowledge bases", adjacent: ["technical_writing", "onboarding_training"] },
  { id: "technical_writing", name: "Technical Writing", description: "Writing developer docs, guides and structured technical content", adjacent: ["documentation"] },
  { id: "investigation", name: "Investigation", description: "Investigating issues, analyzing root causes, structured problem solving", adjacent: ["technical_troubleshooting", "data_analysis"] },
  { id: "finance_accounting", name: "Finance & Accounting", description: "Accounting, budgeting, financial reporting", adjacent: ["reporting", "compliance"] },
  { id: "marketing", name: "Marketing", description: "Campaigns, SEO, content and growth marketing", adjacent: ["content_creation"] },
  { id: "content_creation", name: "Content Creation", description: "Creating written and multimedia content", adjacent: ["marketing", "technical_writing"] },
  { id: "recruiting", name: "Recruiting", description: "Sourcing, interviewing and hiring talent", adjacent: [] },

  // --- Leadership / experience / languages ---
  { id: "team_leadership", name: "Team Leadership", description: "Leading and mentoring teams of people", adjacent: ["people_management", "cross_functional_coordination"] },
  { id: "people_management", name: "People Management", description: "Managing direct reports: hiring, reviews, development", adjacent: ["team_leadership", "org_leadership"] },
  { id: "org_leadership", name: "Organizational Leadership", description: "Director/VP-level leadership: strategy, budget, org design", adjacent: ["people_management"] },
  { id: "mentoring", name: "Mentoring", description: "Mentoring and coaching colleagues", adjacent: ["team_leadership"] },
  { id: "senior_experience", name: "Senior Professional Experience", description: "5+ years of senior professional experience in a field", adjacent: [] },
  { id: "professional_experience", name: "Professional Experience", description: "Professional work experience in a relevant field", adjacent: [] },
  { id: "communication", name: "Communication", description: "Strong general written and verbal communication", adjacent: ["stakeholder_communication", "customer_communication"] },
  { id: "collaboration", name: "Collaboration", description: "Working effectively in teams", adjacent: ["cross_functional_coordination", "communication"] },
  { id: "learning_agility", name: "Learning Agility", description: "Learning quickly and adapting to new tools and domains", adjacent: [] },
  { id: "english_language", name: "English Language", description: "English language proficiency", adjacent: [] },
  { id: "spanish_language", name: "Spanish Language", description: "Spanish language proficiency", adjacent: [] },
  { id: "german_language", name: "German Language", description: "German language proficiency", adjacent: [] },
  { id: "french_language", name: "French Language", description: "French language proficiency", adjacent: [] },
];

export const CAPABILITY_INDEX: Map<string, Capability> = new Map(
  CAPABILITY_TAXONOMY.map(c => [c.id, c])
);

export function areAdjacent(capA: string, capB: string): boolean {
  if (capA === capB) return false;
  const a = CAPABILITY_INDEX.get(capA);
  const b = CAPABILITY_INDEX.get(capB);
  return !!(a?.adjacent.includes(capB) || b?.adjacent.includes(capA));
}

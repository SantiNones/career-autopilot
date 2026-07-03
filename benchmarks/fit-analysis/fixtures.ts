/**
 * Fit Analysis Benchmark Fixtures
 * Representative job descriptions covering diverse industries and levels.
 * Each fixture defines expected score ranges and verdicts for V4 analysis.
 */

export interface FitBenchmarkJob {
  id: string;
  title: string;
  company: string;
  description: string;
  category: string;
  expectedScoreRange: [number, number];
  expectedVerdict: string[];  // acceptable verdicts
  expectedStrongEvidence: string[];  // capabilities expected to match
  expectedMissingCapabilities: string[];  // capabilities expected to be gaps
}

// --- Fixtures ---

export const FIT_BENCHMARK_JOBS: FitBenchmarkJob[] = [
  {
    id: "ai-engineer-junior",
    title: "Junior AI Engineer",
    company: "TechCorp AI",
    description: `We are looking for a Junior AI Engineer to join our team.

Requirements:
- Experience with Python and OpenAI APIs
- Understanding of LLM workflows and prompt engineering
- Basic web development skills (React/Next.js)
- SQL and database knowledge
- Good communication skills
- English fluency required
- 1-2 years of experience in software development

Nice to have:
- Experience with vector databases
- Knowledge of RAG architectures
- Familiarity with evaluation frameworks`,
    category: "AI/ML",
    expectedScoreRange: [55, 85],
    expectedVerdict: ["APPLY", "APPLY_STRETCH"],
    expectedStrongEvidence: ["llm_integration", "prompt_engineering", "web_development"],
    expectedMissingCapabilities: ["ml_engineering"],
  },
  {
    id: "backend-python-mid",
    title: "Backend Python Developer",
    company: "DataFlow Systems",
    description: `Backend Python Developer — Mid Level

We need a Python developer to build and maintain our data processing pipeline.

Requirements:
- 3+ years Python development experience
- Experience with FastAPI or Django
- PostgreSQL and Redis
- REST API design and development
- Docker and basic CI/CD knowledge
- Unit testing and code review practices
- English required

Nice to have:
- Kubernetes experience
- Message queues (RabbitMQ, Kafka)
- Monitoring and observability tools`,
    category: "Backend",
    expectedScoreRange: [30, 60],
    expectedVerdict: ["MAYBE", "APPLY_STRETCH"],
    expectedStrongEvidence: ["backend_development", "api_development", "database_querying"],
    expectedMissingCapabilities: ["devops_practices"],
  },
  {
    id: "fullstack-senior",
    title: "Senior Full Stack Engineer",
    company: "ScaleUp Inc",
    description: `Senior Full Stack Engineer

Join our engineering team to build our next-generation SaaS platform.

Requirements:
- 5+ years of professional software development
- Strong experience with React and TypeScript
- Node.js / Express backend development
- PostgreSQL, Redis, and database design
- System design and architecture experience
- CI/CD and cloud deployment (AWS preferred)
- Leading code reviews and mentoring juniors
- English fluency

Nice to have:
- Experience with microservices
- Performance optimization experience
- Knowledge of AI/ML integration`,
    category: "Full Stack",
    expectedScoreRange: [35, 65],
    expectedVerdict: ["MAYBE", "APPLY_STRETCH"],
    expectedStrongEvidence: ["fullstack_development", "web_development"],
    expectedMissingCapabilities: ["scalable_systems", "cloud_operations"],
  },
  {
    id: "frontend-react",
    title: "Frontend Developer (React)",
    company: "DesignFirst Studio",
    description: `Frontend Developer — React/TypeScript

Build beautiful, responsive user interfaces for our design tools.

Requirements:
- React and TypeScript proficiency
- CSS/Tailwind and responsive design
- State management (Redux, Zustand, or similar)
- API integration with REST endpoints
- Accessibility standards (WCAG)
- Git and collaborative development
- English required

Nice to have:
- Design system experience
- Animation libraries (Framer Motion)
- Testing with React Testing Library`,
    category: "Frontend",
    expectedScoreRange: [40, 70],
    expectedVerdict: ["MAYBE", "APPLY_STRETCH", "APPLY"],
    expectedStrongEvidence: ["frontend_development", "web_development"],
    expectedMissingCapabilities: [],
  },
  {
    id: "data-engineer-mid",
    title: "Data Engineer",
    company: "Analytics Corp",
    description: `Data Engineer — Building our data platform

Requirements:
- Python and SQL proficiency
- Experience with data pipelines (Airflow, dbt, or similar)
- Cloud data warehouses (BigQuery, Snowflake, or Redshift)
- ETL process design and optimization
- 3+ years of data engineering experience
- Spark or other distributed processing frameworks
- English required

Nice to have:
- Streaming data (Kafka, Pub/Sub)
- Data governance and quality frameworks
- Infrastructure as code (Terraform)`,
    category: "Data Engineering",
    expectedScoreRange: [25, 55],
    expectedVerdict: ["SKIP", "MAYBE", "APPLY_STRETCH"],
    expectedStrongEvidence: ["database_querying"],
    expectedMissingCapabilities: ["data_engineering", "data_warehousing"],
  },
  {
    id: "product-engineer",
    title: "Product Engineer",
    company: "StartupLab",
    description: `Product Engineer

We're looking for a product-minded engineer who can own features end-to-end.

Requirements:
- Full stack development (React + Node.js or Python)
- Product thinking and user empathy
- Ability to ship independently
- Database design and API development
- Good communication with non-technical stakeholders
- English fluency

Nice to have:
- Experience in early-stage startups
- AI/LLM integration experience
- Analytics and data-driven decision making`,
    category: "Product Engineering",
    expectedScoreRange: [35, 70],
    expectedVerdict: ["MAYBE", "APPLY_STRETCH", "APPLY"],
    expectedStrongEvidence: ["fullstack_development", "product_building", "api_development"],
    expectedMissingCapabilities: [],
  },
  {
    id: "ml-engineer-senior",
    title: "Senior ML Engineer",
    company: "DeepTech AI",
    description: `Senior Machine Learning Engineer

Build and deploy production ML systems at scale.

Requirements:
- 5+ years ML/AI engineering experience
- PyTorch or TensorFlow proficiency
- MLOps pipelines (MLflow, Kubeflow, or similar)
- Feature engineering and model optimization
- Experience deploying models to production at scale
- Strong Python and software engineering fundamentals
- Research paper implementation experience
- PhD or equivalent experience preferred

Nice to have:
- NLP specialization
- Distributed training experience
- GPU optimization`,
    category: "ML Engineering",
    expectedScoreRange: [5, 35],
    expectedVerdict: ["SKIP"],
    expectedStrongEvidence: [],
    expectedMissingCapabilities: ["ml_engineering", "scalable_systems"],
  },
  {
    id: "devops-engineer",
    title: "DevOps Engineer",
    company: "CloudFirst",
    description: `DevOps Engineer

Manage our cloud infrastructure and CI/CD pipelines.

Requirements:
- AWS or GCP certification preferred
- Kubernetes and Docker expertise
- Terraform and infrastructure as code
- CI/CD pipeline design (GitHub Actions, Jenkins)
- Linux system administration
- Monitoring and alerting (Prometheus, Grafana, Datadog)
- 3+ years DevOps/SRE experience
- On-call rotation participation
- English required

Nice to have:
- Security hardening experience
- Cost optimization
- Multi-cloud experience`,
    category: "DevOps",
    expectedScoreRange: [15, 50],
    expectedVerdict: ["SKIP", "MAYBE"],
    expectedStrongEvidence: ["version_control"],
    expectedMissingCapabilities: ["cloud_operations", "devops_practices", "infrastructure_management"],
  },
  {
    id: "startup-generalist",
    title: "Founding Engineer",
    company: "AI Startup",
    description: `Founding Engineer — AI-first product

Join as one of the first 3 engineers. Build everything from scratch.

Requirements:
- Strong full-stack skills (any modern stack)
- AI/LLM experience (OpenAI, Claude, etc.)
- Ship fast, iterate quickly
- Product sense and customer empathy
- Comfortable with ambiguity
- English fluency

Nice to have:
- Previous startup experience
- Open source contributions
- Technical writing skills`,
    category: "Startup",
    expectedScoreRange: [15, 55],
    expectedVerdict: ["SKIP", "MAYBE", "APPLY_STRETCH"],
    expectedStrongEvidence: ["fullstack_development", "llm_integration", "product_building"],
    expectedMissingCapabilities: [],
  },
  {
    id: "enterprise-solutions",
    title: "Solutions Engineer",
    company: "Enterprise Corp",
    description: `Solutions Engineer — Enterprise SaaS

Be the technical bridge between our product and enterprise customers.

Requirements:
- Technical background in software development
- Customer-facing communication skills
- Ability to understand complex enterprise requirements
- Demo and presentation skills
- Integration design and API knowledge
- 3+ years in solutions engineering or technical consulting
- English and ideally another European language
- Travel up to 30%

Nice to have:
- Experience with CRM/ERP integrations
- Pre-sales experience
- Technical documentation skills`,
    category: "Solutions Engineering",
    expectedScoreRange: [30, 60],
    expectedVerdict: ["MAYBE", "APPLY_STRETCH"],
    expectedStrongEvidence: ["api_integration", "technical_communication"],
    expectedMissingCapabilities: ["presales"],
  },
];

export type VerdictV2 = "APPLY" | "APPLY_STRETCH" | "MAYBE" | "SKIP";

export interface ValidationJobV2 {
  title: string;
  company: string;
  description: string;
  expectedVerdict: VerdictV2;
  expectedScoreRange: [number, number];
  category: string;
  isRealBenchmark?: boolean;
}

// ---------------------------------------------------------------------------
// APPLY — 15 jobs | expected score 65-85
// ---------------------------------------------------------------------------
const applyJobs: ValidationJobV2[] = [
  {
    title: "Junior AI Engineer",
    company: "TechFlow",
    description: "Build AI-powered features using OpenAI APIs and Python. You will design prompts, integrate LLM workflows into our product, and ship full-stack features with React and TypeScript. Great for engineers early in their career with hands-on AI project experience. Strong communication skills required.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [65, 85],
    category: "AI/ML"
  },
  {
    title: "AI Automation Engineer",
    company: "Automation Labs",
    description: "Build AI-powered automation workflows using OpenAI APIs, Python, and modern web frameworks. Experience with API integration, agentic workflows, and prompt engineering essential. You will automate business processes end to end and communicate with stakeholders.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [65, 85],
    category: "AI/ML"
  },
  {
    title: "AI Product Engineer",
    company: "ProductAI",
    description: "Join a small team shipping AI product features. Stack: TypeScript, React, Next.js, Python, OpenAI API. You will own features end to end, from prompt design to UI. Junior to mid level welcome if you have shipped real AI projects. Communication and product sense valued over years of experience.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [65, 85],
    category: "AI/ML"
  },
  {
    title: "Python + React Engineer",
    company: "FullStack Solutions",
    description: "Seeking full-stack developer with Python backend (Flask or FastAPI) and React frontend experience. PostgreSQL databases, REST API design, and modern JavaScript. Junior candidates with strong portfolio projects encouraged to apply. English required.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [65, 85],
    category: "Full Stack"
  },
  {
    title: "Junior Full Stack Engineer",
    company: "StartupHub",
    description: "Early-stage startup seeks junior full stack engineer. React, TypeScript, Node.js, PostgreSQL. You will work directly with founders, talk to customers, and ship product weekly. Portfolio projects count as experience. No degree required.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [65, 85],
    category: "Full Stack"
  },
  {
    title: "Applied AI Engineer (Junior)",
    company: "DataScience Inc",
    description: "Develop practical AI solutions with LLMs, prompt engineering, and RAG pipelines. Python required, JavaScript a plus. Junior role with mentorship. You will evaluate AI output quality and iterate on prompts and workflows.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [65, 85],
    category: "AI/ML"
  },
  {
    title: "AI Consultant (Junior)",
    company: "ConsultAI",
    description: "Help clients adopt generative AI. You will run discovery sessions with stakeholders, prototype AI workflows using OpenAI APIs and Python, and present solutions. Customer-facing experience and communication skills are as important as technical skills. Junior level.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [65, 85],
    category: "AI Consulting"
  },
  {
    title: "Junior Software Engineer (Web)",
    company: "WebWorks",
    description: "Junior web developer role. React, TypeScript, Node.js. You will build user-facing features, fix bugs, and learn from senior engineers. Bootcamp graduates and career changers with strong projects welcome. English working environment.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [65, 85],
    category: "Full Stack"
  },
  {
    title: "Frontend Developer (React)",
    company: "UI First",
    description: "React and TypeScript frontend developer. Build modern, accessible interfaces with Next.js. Junior to mid level. Experience with REST APIs and component design. Portfolio of shipped projects valued.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [65, 85],
    category: "Frontend"
  },
  {
    title: "AI Workflow Developer",
    company: "FlowOps",
    description: "Design and build LLM-powered workflows for business automation. OpenAI API, Python, prompt engineering, and webhook integrations. You will own workflows from design to monitoring. Experience with WhatsApp or messaging integrations is a plus.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [65, 85],
    category: "AI/ML"
  },
  {
    title: "Junior Backend Developer (Python)",
    company: "PySolutions",
    description: "Python backend developer, junior level. Flask, PostgreSQL, REST APIs. You will build and maintain API endpoints, write database queries, and collaborate with frontend developers. Career changers with solid projects considered.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [65, 85],
    category: "Backend"
  },
  {
    title: "Full Stack Developer (TypeScript)",
    company: "TypeStack",
    description: "Full stack TypeScript developer. Next.js, React, Prisma, PostgreSQL. Ship features across the stack in a product-focused team. Junior to mid level, with emphasis on shipped side projects and learning velocity.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [65, 85],
    category: "Full Stack"
  },
  {
    title: "GenAI Application Developer",
    company: "GenApps",
    description: "Build generative AI applications for clients. Python, OpenAI API, LangChain a plus. Prompt engineering, RAG, and AI evaluation. You will demo prototypes to clients and gather requirements. Junior level with AI project portfolio.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [65, 85],
    category: "AI/ML"
  },
  {
    title: "Junior Web Engineer (AI Startup)",
    company: "AIStart",
    description: "Join an AI startup as a junior web engineer. React, TypeScript, Python services, OpenAI integration. Wear many hats: frontend, backend, prompts, and customer feedback. High ownership, fast shipping.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [65, 85],
    category: "AI/ML"
  },
  {
    title: "AI Integration Engineer",
    company: "Integrate.io",
    description: "Integrate LLM capabilities into existing business systems. OpenAI API, Python, REST APIs, webhooks. You will scope integrations with customers, build them, and document the solutions. Strong communication required. Junior to mid level.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [65, 85],
    category: "AI/ML"
  },
];

// ---------------------------------------------------------------------------
// APPLY_STRETCH — 10 jobs | expected score 55-70
// ---------------------------------------------------------------------------
const applyStretchJobs: ValidationJobV2[] = [
  {
    title: "Solutions Engineer",
    company: "SaaSCo",
    description: "Solutions engineer for a B2B SaaS platform. Run discovery with clients, build proof-of-concept integrations (JavaScript, Python, REST APIs), deliver demos, and support implementation. 2+ years in a technical or customer-facing role. Strong presentation skills.",
    expectedVerdict: "APPLY_STRETCH",
    expectedScoreRange: [55, 70],
    category: "Solutions"
  },
  {
    title: "Forward Deployed Engineer",
    company: "DeployTech",
    description: "Work on-site with enterprise customers to deploy and customize our platform. Python, SQL, API integrations. You will gather requirements, configure solutions, and train users. Travel required. 2-4 years experience preferred.",
    expectedVerdict: "APPLY_STRETCH",
    expectedScoreRange: [55, 70],
    category: "Solutions"
  },
  {
    title: "Customer Engineer",
    company: "CloudBase",
    description: "Customer engineer bridging product and clients. Troubleshoot technical issues, build integration scripts (Python, JavaScript), and guide onboarding. Customer empathy and communication essential. Some professional engineering experience expected.",
    expectedVerdict: "APPLY_STRETCH",
    expectedScoreRange: [55, 70],
    category: "Solutions"
  },
  {
    title: "Product Engineer",
    company: "BuildRight",
    description: "Product engineer with full stack skills. React, TypeScript, Node.js, PostgreSQL. Own product features from spec to ship. 2-3 years professional experience preferred but strong portfolios considered. Product thinking and user empathy required.",
    expectedVerdict: "APPLY_STRETCH",
    expectedScoreRange: [55, 70],
    category: "Product"
  },
  {
    title: "Technical Consultant",
    company: "ConsultTech",
    description: "Technical consultant for digital transformation projects. Scope client requirements, design solutions, build prototypes (Python, JavaScript), and present to stakeholders. Consulting or client-facing experience required. 2+ years preferred.",
    expectedVerdict: "APPLY_STRETCH",
    expectedScoreRange: [55, 70],
    category: "Consulting"
  },
  {
    title: "Applied AI Engineer (Mid-Level)",
    company: "MidAI",
    description: "Mid-level applied AI engineer. Production LLM systems, RAG pipelines, evaluation frameworks, Python, and cloud deployment. 3+ years software engineering experience required, with at least 1 year working on AI systems in production.",
    expectedVerdict: "APPLY_STRETCH",
    expectedScoreRange: [55, 70],
    category: "AI/ML"
  },
  {
    title: "Implementation Specialist (Technical)",
    company: "ImplementCo",
    description: "Lead software implementations for enterprise clients. Configure systems, write integration scripts (SQL, Python), run training sessions, and manage stakeholder expectations. Operations and customer-facing background valued. Technical aptitude required.",
    expectedVerdict: "APPLY_STRETCH",
    expectedScoreRange: [55, 70],
    category: "Solutions"
  },
  {
    title: "Sales Engineer (Technical)",
    company: "SellTech",
    description: "Pre-sales engineer supporting enterprise deals. Deliver technical demos, answer architecture questions, build small proofs of concept (JavaScript, Python, APIs). Communication and presentation skills critical. Engineering background preferred.",
    expectedVerdict: "APPLY_STRETCH",
    expectedScoreRange: [55, 70],
    category: "Solutions"
  },
  {
    title: "AI Solutions Architect (Junior)",
    company: "ArchAI",
    description: "Design AI solution architectures for clients. LLM workflows, OpenAI API, integration patterns, and data flows. Document designs, present to technical and business stakeholders. Some architecture or systems design experience expected.",
    expectedVerdict: "APPLY_STRETCH",
    expectedScoreRange: [55, 70],
    category: "AI/ML"
  },
  {
    title: "Developer Experience Engineer",
    company: "DevXP",
    description: "Improve developer experience for our API platform. Write documentation, build SDK examples (TypeScript, Python), gather developer feedback, and ship improvements. Strong writing and communication. 2+ years coding experience preferred.",
    expectedVerdict: "APPLY_STRETCH",
    expectedScoreRange: [55, 70],
    category: "Product"
  },
];

// ---------------------------------------------------------------------------
// MAYBE — 10 jobs | expected score 40-60
// ---------------------------------------------------------------------------
const maybeJobs: ValidationJobV2[] = [
  {
    title: "Data Engineer",
    company: "DataFlow",
    description: "Build data pipelines with Python, SQL, Airflow, and dbt. Design data warehouse models in Snowflake. 3+ years data engineering experience required. Spark and streaming experience a plus.",
    expectedVerdict: "MAYBE",
    expectedScoreRange: [40, 60],
    category: "Data"
  },
  {
    title: "Analytics Consultant",
    company: "InsightCo",
    description: "Analytics consultant for client projects. SQL, dashboards (Tableau, Power BI), statistical analysis, and stakeholder presentations. Consulting experience and 2+ years analytics work required.",
    expectedVerdict: "MAYBE",
    expectedScoreRange: [40, 60],
    category: "Data"
  },
  {
    title: "Cloud Engineer",
    company: "CloudNine",
    description: "Cloud engineer managing AWS infrastructure. Terraform, Docker, Kubernetes, CI/CD pipelines. 3+ years cloud infrastructure experience required. Certifications preferred.",
    expectedVerdict: "MAYBE",
    expectedScoreRange: [40, 60],
    category: "DevOps"
  },
  {
    title: "Backend Engineer (Mid-Level)",
    company: "ScaleAPI",
    description: "Mid-level backend engineer. Design scalable microservices in Python or Go, PostgreSQL, Redis, message queues. 4+ years backend experience required. High-traffic distributed systems experience preferred.",
    expectedVerdict: "MAYBE",
    expectedScoreRange: [40, 60],
    category: "Backend"
  },
  {
    title: "Product Manager (Technical)",
    company: "ProductLab",
    description: "Technical product manager for developer tools. Define roadmap, write specs, prioritize backlog, work with engineering. 3+ years product management experience required. Engineering background a plus.",
    expectedVerdict: "MAYBE",
    expectedScoreRange: [40, 60],
    category: "Product"
  },
  {
    title: "Platform Engineer",
    company: "PlatformOne",
    description: "Build internal developer platforms. Kubernetes, Terraform, Go, CI/CD tooling. 3+ years platform or infrastructure engineering required.",
    expectedVerdict: "MAYBE",
    expectedScoreRange: [40, 60],
    category: "DevOps"
  },
  {
    title: "Machine Learning Engineer",
    company: "MLWorks",
    description: "ML engineer building recommendation systems. PyTorch, model training, feature engineering, MLOps. 3+ years ML engineering experience and strong math background required.",
    expectedVerdict: "MAYBE",
    expectedScoreRange: [40, 60],
    category: "AI/ML"
  },
  {
    title: "QA Automation Engineer",
    company: "QualityFirst",
    description: "Build automated test suites. Selenium, Playwright, CI integration, API testing. 2+ years QA automation experience required. Python or JavaScript scripting.",
    expectedVerdict: "MAYBE",
    expectedScoreRange: [40, 60],
    category: "QA"
  },
  {
    title: "Mobile Developer (React Native)",
    company: "AppFactory",
    description: "React Native developer for consumer mobile apps. TypeScript, native modules, app store deployment. 2+ years mobile development experience required.",
    expectedVerdict: "MAYBE",
    expectedScoreRange: [40, 60],
    category: "Mobile"
  },
  {
    title: "Technical Account Manager",
    company: "AccountTech",
    description: "Manage strategic technical accounts. Understand customer architectures, coordinate escalations, drive renewals. 4+ years in technical account management or customer success required.",
    expectedVerdict: "MAYBE",
    expectedScoreRange: [40, 60],
    category: "Customer Success"
  },
];

// ---------------------------------------------------------------------------
// SKIP — 15 jobs | expected score 0-40
// ---------------------------------------------------------------------------
const skipJobs: ValidationJobV2[] = [
  {
    title: "Staff Engineer",
    company: "BigTech",
    description: "Staff engineer leading architecture across multiple teams. 8+ years experience, deep distributed systems expertise, technical leadership at scale. Mentor senior engineers and set technical direction.",
    expectedVerdict: "SKIP",
    expectedScoreRange: [0, 40],
    category: "Senior Engineering"
  },
  {
    title: "Principal Engineer",
    company: "Enterprise Systems",
    description: "Principal engineer for core platform. 10+ years experience, track record of designing systems serving millions of users. Define multi-year technical strategy.",
    expectedVerdict: "SKIP",
    expectedScoreRange: [0, 40],
    category: "Senior Engineering"
  },
  {
    title: "Senior Site Reliability Engineer",
    company: "UptimeCo",
    description: "Senior SRE for production infrastructure. Kubernetes at scale, incident management, SLOs, on-call leadership. 5+ years SRE or production operations experience required.",
    expectedVerdict: "SKIP",
    expectedScoreRange: [0, 40],
    category: "SRE"
  },
  {
    title: "Senior ML Engineer",
    company: "DeepStack",
    description: "Senior ML engineer training large models. PyTorch, distributed training, CUDA optimization, model serving at scale. 5+ years ML engineering with production model deployment required.",
    expectedVerdict: "SKIP",
    expectedScoreRange: [0, 40],
    category: "AI/ML Senior"
  },
  {
    title: "Research Scientist (NLP)",
    company: "AI Research Lab",
    description: "Research scientist in NLP. PhD in machine learning or related field required. Publication record at top venues (NeurIPS, ACL). Design novel architectures and run experiments.",
    expectedVerdict: "SKIP",
    expectedScoreRange: [0, 40],
    category: "Research"
  },
  {
    title: "Head of AI",
    company: "ScaleUp Inc",
    description: "Lead our AI organization. 10+ years experience, 5+ years leading ML teams. Define AI strategy, hire and manage researchers and engineers, report to CTO.",
    expectedVerdict: "SKIP",
    expectedScoreRange: [0, 40],
    category: "Leadership"
  },
  {
    title: "Director of Engineering",
    company: "GrowthCorp",
    description: "Director of engineering managing 30+ engineers across 4 teams. 10+ years engineering, 5+ years management. Own delivery, hiring, budget, and technical strategy.",
    expectedVerdict: "SKIP",
    expectedScoreRange: [0, 40],
    category: "Leadership"
  },
  {
    title: "DevOps Lead",
    company: "InfraOps",
    description: "Lead DevOps team of 6. Kubernetes, Terraform, AWS at scale, incident response leadership. 6+ years DevOps with team leadership experience required.",
    expectedVerdict: "SKIP",
    expectedScoreRange: [0, 40],
    category: "DevOps"
  },
  {
    title: "Senior Embedded Systems Engineer",
    company: "ChipWorks",
    description: "Senior embedded engineer for automotive systems. C/C++, RTOS, hardware debugging, CAN bus. 5+ years embedded systems experience required.",
    expectedVerdict: "SKIP",
    expectedScoreRange: [0, 40],
    category: "Embedded"
  },
  {
    title: "Senior Security Engineer",
    company: "SecureNet",
    description: "Senior security engineer. Penetration testing, threat modeling, security architecture, incident response. 5+ years security engineering and certifications (OSCP, CISSP) required.",
    expectedVerdict: "SKIP",
    expectedScoreRange: [0, 40],
    category: "Security"
  },
  {
    title: "Senior Data Scientist",
    company: "QuantCo",
    description: "Senior data scientist for financial modeling. Advanced statistics, causal inference, Python scientific stack. PhD or 5+ years quantitative research experience required.",
    expectedVerdict: "SKIP",
    expectedScoreRange: [0, 40],
    category: "Data Science"
  },
  {
    title: "Engineering Manager",
    company: "TeamLead Inc",
    description: "Engineering manager for two product teams. 7+ years engineering, 3+ years people management. Performance reviews, hiring, delivery management.",
    expectedVerdict: "SKIP",
    expectedScoreRange: [0, 40],
    category: "Leadership"
  },
  {
    title: "Senior iOS Engineer",
    company: "MobileFirst",
    description: "Senior iOS engineer. Swift, SwiftUI, Core Data, app architecture. 5+ years iOS development with shipped consumer apps required.",
    expectedVerdict: "SKIP",
    expectedScoreRange: [0, 40],
    category: "Mobile"
  },
  {
    title: "Database Administrator (Senior)",
    company: "DataKeep",
    description: "Senior DBA for mission-critical Oracle and PostgreSQL systems. Performance tuning, replication, backup strategy, 24/7 support rotation. 6+ years DBA experience required.",
    expectedVerdict: "SKIP",
    expectedScoreRange: [0, 40],
    category: "Database"
  },
  {
    title: "VP of Engineering",
    company: "UnicornCo",
    description: "VP of engineering for 100-person org. 12+ years experience, executive leadership, scaling organizations, board reporting.",
    expectedVerdict: "SKIP",
    expectedScoreRange: [0, 40],
    category: "Leadership"
  },
];

// ---------------------------------------------------------------------------
// Real job benchmarks — calibration references (Task 2)
// ---------------------------------------------------------------------------
export const realBenchmarkJobs: ValidationJobV2[] = [
  {
    title: "Junior Analytics / AI Consultant",
    company: "Deloitte",
    description: "Junior consultant in our Analytics & AI practice. Work with clients to implement data and AI solutions. SQL, Python, dashboarding, and generative AI tools. You will support discovery workshops, build prototypes, and present findings to stakeholders. Strong communication skills and willingness to learn required. Junior level, no consulting experience required. English essential.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [65, 80],
    category: "AI Consulting",
    isRealBenchmark: true
  },
  {
    title: "AI Automation Consultant",
    company: "Maisa",
    description: "Help enterprises automate processes with AI agents. Build agentic workflows with LLMs, integrate APIs, and prototype automation solutions in Python and JavaScript. Run client discovery and demos. Junior to mid level, AI project portfolio valued over formal experience. Customer-facing skills essential.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [70, 85],
    category: "AI/ML",
    isRealBenchmark: true
  },
  {
    title: "AI Product Engineer",
    company: "Factorial",
    description: "Ship AI features in our HR platform. TypeScript, React, Ruby on Rails backend, OpenAI integrations. Own features end to end: prompts, evaluation, UI. Product mindset and shipped AI side projects valued. Junior to mid level.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [65, 80],
    category: "AI/ML",
    isRealBenchmark: true
  },
  {
    title: "Full-stack AI Developer Tools Engineer",
    company: "Alan",
    description: "Build internal AI developer tools. TypeScript, React, Python services, LLM workflows, prompt tooling, and evaluation dashboards. Full stack ownership in a product-driven health tech company. Mid level preferred, exceptional juniors considered.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [60, 75],
    category: "AI/ML",
    isRealBenchmark: true
  },
  {
    title: "Python + React Engineer",
    company: "Aubay",
    description: "Full stack engineer for client projects. Python (Flask/Django) backend, React frontend, PostgreSQL, REST APIs. Work in agile teams delivering for enterprise clients. 1-3 years experience or equivalent project portfolio. English and Spanish working environment.",
    expectedVerdict: "APPLY",
    expectedScoreRange: [65, 80],
    category: "Full Stack",
    isRealBenchmark: true
  },
  {
    title: "Junior Application Support Engineer",
    company: "Corus",
    description: "Junior application support for enterprise software. Troubleshoot issues, analyze logs, write SQL queries, escalate bugs, and communicate with customers. Scripting in Python a plus. Great entry into software roles for technically minded people with customer-facing experience.",
    expectedVerdict: "APPLY_STRETCH",
    expectedScoreRange: [55, 70],
    category: "Support",
    isRealBenchmark: true
  },
  {
    title: "Solutions Engineer (Europe)",
    company: "Linear",
    description: "Solutions engineer for Linear's enterprise customers in Europe. Deep product expertise, technical discovery, API integrations (TypeScript), workflow consulting, and demos for engineering leaders. 3+ years in solutions engineering, sales engineering, or software engineering required. Strong written communication.",
    expectedVerdict: "MAYBE",
    expectedScoreRange: [40, 60],
    category: "Solutions",
    isRealBenchmark: true
  },
  {
    title: "Applied AI Forward Deployed Engineer",
    company: "Mistral",
    description: "Forward deployed engineer embedding with enterprise customers to build LLM solutions on Mistral models. Python, LLM fine-tuning, RAG architectures, production deployment, and on-site client work. 3+ years software or ML engineering experience required. Travel expected.",
    expectedVerdict: "MAYBE",
    expectedScoreRange: [45, 60],
    category: "AI/ML",
    isRealBenchmark: true
  },
  {
    title: "Applied AI Fullstack Engineer",
    company: "Mistral",
    description: "Fullstack engineer on the Applied AI team. Build customer-facing AI applications: TypeScript, React, Python, LLM APIs, RAG. Ship demos and production features with customers. 2+ years fullstack experience preferred, strong AI project portfolio considered.",
    expectedVerdict: "APPLY_STRETCH",
    expectedScoreRange: [55, 70],
    category: "AI/ML",
    isRealBenchmark: true
  },
  {
    title: "Applied AI Site Reliability Engineer",
    company: "Mistral",
    description: "SRE for AI inference infrastructure. Kubernetes, GPU clusters, observability, incident response, performance tuning at scale. 5+ years SRE/infrastructure experience required, LLM serving experience preferred.",
    expectedVerdict: "SKIP",
    expectedScoreRange: [0, 35],
    category: "SRE",
    isRealBenchmark: true
  },
];

export const validationDatasetV2: ValidationJobV2[] = [
  ...applyJobs,
  ...applyStretchJobs,
  ...maybeJobs,
  ...skipJobs,
  ...realBenchmarkJobs,
];

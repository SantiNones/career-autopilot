# Capability Mapping Layer — Benchmark Report (Phase 1, deterministic only)

## Setup
- Evidence inventory items: 56
- Distinct evidence capabilities generated: 34
- Benchmark jobs: 8
- Total requirements: 80
- Unmapped requirements (no capability found): 12 (15%)
- Deterministic mapping coverage: 85%

## Overall Coverage: V3 vs Capability Matching

| Metric | Current V3 | Capability-based |
|---|---|---|
| Requirements covered | 62/80 (78%) | 52/80 (65%) |
| Strong matches | 3 | 22 |
| Partial (medium) | 58 | 17 |
| Weak | 1 | 13 |
| Missing | 18 | 28 |

## Per-Job Comparison

| Job | Reqs | V3 Coverage | Cap Coverage | V3 s/m/w/n | Cap s/m/w/n | Unmapped Reqs |
|---|---|---|---|---|---|---|
| Junior Analytics / AI Consultant (Deloitte) | 12 | 67% | 83% | 1/7/0/4 | 3/5/2/2 | - |
| AI Automation Consultant (Maisa) | 9 | 89% | 78% | 0/8/0/1 | 2/4/1/2 | - |
| Junior Application Support Engineer (Corus) | 10 | 60% | 80% | 1/4/1/4 | 2/1/5/2 | Interest in software roles |
| Solutions Engineer (Europe) (Linear) | 8 | 88% | 75% | 1/6/0/1 | 3/0/3/2 | Demos for engineering leaders |
| Applied AI Forward Deployed Engineer (Mistral) | 9 | 100% | 44% | 0/9/0/0 | 3/1/0/5 | Experience with on-site client work; Ability to travel; Experience in AI/ML specific requirements |
| Applied AI Fullstack Engineer (Mistral) | 10 | 100% | 90% | 0/10/0/0 | 4/3/2/1 | Ability to ship demos and production features with customers |
| Applied AI Site Reliability Engineer (Mistral) | 8 | 63% | 13% | 0/5/0/3 | 1/0/0/7 | Performance tuning at scale |
| Junior AI Engineer (Zurich Insurance) | 14 | 64% | 50% | 0/9/0/5 | 4/3/0/7 | AI Engineering; Knowledge of insurance processes; No specific leadership or management expectations; Experience in product development not specified; AI/ML specific requirements not specified |

## Capability Match Detail (per job)

### Junior Analytics / AI Consultant (Deloitte)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| SQL | capability | medium | database_querying, data_modeling, backend_development, data_analysis | Career Autopilot; Whatsapp Agent MVP; Rise |
| Python | exact | strong | backend_development, fullstack_development, workflow_automation, scripting, scalable_systems, software_engineering_fundamentals, api_development | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Dashboarding | adjacent | weak | data_analysis, reporting | TELUS Digital — Digital Trust and Safety Analyst; Wesser — Partner Recruiter; Operations Experience |
| Generative AI tools | capability | medium | llm_integration, api_integration, prompt_engineering | Career Autopilot; Whatsapp Agent MVP; Rise |
| Support discovery workshops | capability | medium | presentation_skills, stakeholder_communication | Ethnicraft; Fundesplai — Educational Activities Coordinator |
| Build prototypes | capability | medium | fullstack_development, architecture_design, product_building | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Present findings to stakeholders | exact | strong | presentation_skills, communication, stakeholder_communication | Ethnicraft; Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator |
| Strong communication skills | exact | strong | communication | Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator; Communication |
| Willingness to learn | capability | medium | learning_agility | Wesser — Partner Recruiter |
| Junior level | none | none | - | - |
| No consulting experience required | adjacent | weak | stakeholder_communication | Fundesplai — Educational Activities Coordinator |
| English | none | none | - | - |

### AI Automation Consultant (Maisa)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| Automate processes with AI agents | capability | medium | ai_workflows, workflow_automation, scripting, api_integration, llm_integration | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Build agentic workflows with LLMs | capability | medium | ai_workflows, workflow_automation, llm_integration | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Integrate APIs | capability | medium | api_integration, systems_integration, workflow_automation, api_development, llm_integration | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Prototype automation solutions in Python and JavaScript | exact | strong | fullstack_development, web_development, backend_development, workflow_automation, scripting, software_engineering_fundamentals, api_integration, ai_workflows, frontend_development, api_development, architecture_design, product_building | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Run client discovery and demos | none | none | - | - |
| Junior to mid level | none | none | - | - |
| AI project portfolio valued over formal experience | capability | medium | fullstack_development, product_building | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Customer-facing skills | adjacent | weak | communication, stakeholder_communication | Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator; Communication |
| Python and JavaScript | exact | strong | fullstack_development, web_development, backend_development, scripting, software_engineering_fundamentals, frontend_development, api_development, workflow_automation, product_building | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |

### Junior Application Support Engineer (Corus)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| Application support for enterprise software | adjacent | weak | communication, stakeholder_communication, investigation | Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator; Communication |
| Troubleshooting issues | adjacent | weak | investigation | Fundesplai — Educational Activities Coordinator; Problem Solving |
| Analyzing logs | none | none | - | - |
| Writing SQL queries | capability | medium | database_querying, data_modeling, backend_development, data_analysis | Career Autopilot; Whatsapp Agent MVP; Rise |
| Escalating bugs | adjacent | weak | investigation | Fundesplai — Educational Activities Coordinator; Problem Solving |
| Communication with customers | exact | strong | communication | Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator; Communication |
| Scripting in Python | exact | strong | backend_development, fullstack_development, workflow_automation, scripting, scalable_systems, software_engineering_fundamentals, api_development | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Technically minded | adjacent | weak | frontend_development, backend_development, version_control, testing_qa | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Customer-facing experience | adjacent | weak | communication, stakeholder_communication | Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator; Communication |
| Interest in software roles | none | none | - | - |

### Solutions Engineer (Europe) (Linear)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| Deep product expertise | exact | strong | fullstack_development, product_building | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Technical discovery | none | none | - | - |
| API integrations (TypeScript) | exact | strong | fullstack_development, web_development, api_integration, systems_integration, backend_development, frontend_development, api_development, workflow_automation, product_building | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Workflow consulting | adjacent | weak | stakeholder_communication | Fundesplai — Educational Activities Coordinator |
| Demos for engineering leaders | none | none | - | - |
| 3+ years in solutions engineering, sales engineering, or software engineering | adjacent | weak | frontend_development, backend_development, systems_integration, version_control, testing_qa | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Strong written communication | exact | strong | communication | Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator; Communication |
| Work with Linear's enterprise customers in Europe | adjacent | weak | communication, stakeholder_communication | Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator; Communication |

### Applied AI Forward Deployed Engineer (Mistral)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| Python programming | exact | strong | backend_development, fullstack_development, workflow_automation, scripting, scalable_systems, software_engineering_fundamentals, api_development | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| LLM fine-tuning | exact | strong | llm_integration, api_integration, prompt_engineering | Career Autopilot; Whatsapp Agent MVP; Rise |
| RAG architectures | capability | medium | llm_integration, ai_workflows, architecture_design, scalable_systems | Career Autopilot; Whatsapp Agent MVP; Rise |
| Production deployment | none | none | - | - |
| 3+ years software or ML engineering experience | none | none | - | - |
| Experience with on-site client work | none | none | - | - |
| Ability to travel | none | none | - | - |
| Experience in building LLM solutions on Mistral models | exact | strong | llm_integration, api_integration, prompt_engineering | Career Autopilot; Whatsapp Agent MVP; Rise |
| Experience in AI/ML specific requirements | none | none | - | - |

### Applied AI Fullstack Engineer (Mistral)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| Fullstack engineering | capability | medium | fullstack_development, frontend_development, web_development, backend_development, product_building | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Experience with TypeScript | exact | strong | fullstack_development, web_development, backend_development, frontend_development, product_building | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Experience with React | exact | strong | web_development, frontend_development, software_engineering_fundamentals, ui_ux | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Experience with Python | exact | strong | backend_development, fullstack_development, workflow_automation, scripting, scalable_systems, software_engineering_fundamentals, api_development | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Experience with LLM APIs | exact | strong | llm_integration, api_integration, prompt_engineering | Career Autopilot; Whatsapp Agent MVP; Rise |
| Experience with RAG | adjacent | weak | llm_integration, ai_workflows | Career Autopilot; Whatsapp Agent MVP; Rise |
| 2+ years fullstack experience | capability | medium | fullstack_development, frontend_development, web_development, backend_development, product_building | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Strong AI project portfolio | capability | medium | fullstack_development, product_building | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Ability to build customer-facing AI applications | adjacent | weak | communication, stakeholder_communication | Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator; Communication |
| Ability to ship demos and production features with customers | none | none | - | - |

### Applied AI Site Reliability Engineer (Mistral)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| SRE for AI inference infrastructure | none | none | - | - |
| Kubernetes | none | none | - | - |
| GPU clusters | none | none | - | - |
| Observability | none | none | - | - |
| Incident response | none | none | - | - |
| Performance tuning at scale | none | none | - | - |
| 5+ years SRE/infrastructure experience | none | none | - | - |
| LLM serving experience | exact | strong | llm_integration, api_integration, prompt_engineering | Career Autopilot; Whatsapp Agent MVP; Rise |

### Junior AI Engineer (Zurich Insurance)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| AI Engineering | none | none | - | - |
| Python programming | exact | strong | backend_development, fullstack_development, workflow_automation, scripting, scalable_systems, software_engineering_fundamentals, api_development | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| OpenAI APIs | exact | strong | llm_integration, api_integration, prompt_engineering | Career Autopilot; Whatsapp Agent MVP; Rise |
| LLM workflows | exact | strong | llm_integration, api_integration, prompt_engineering | Career Autopilot; Whatsapp Agent MVP; Rise |
| SQL | capability | medium | database_querying, data_modeling, backend_development, data_analysis | Career Autopilot; Whatsapp Agent MVP; Rise |
| Data analysis skills | capability | medium | database_querying, data_analysis, reporting, metrics_tracking, investigation | Career Autopilot; Rise; Station |
| Junior level | none | none | - | - |
| Strong learning mindset | capability | medium | learning_agility | Wesser — Partner Recruiter |
| English language | none | none | - | - |
| Knowledge of insurance processes | none | none | - | - |
| Collaboration with business stakeholders | exact | strong | presentation_skills, communication, stakeholder_communication, collaboration | Ethnicraft; Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator |
| No specific leadership or management expectations | none | none | - | - |
| Experience in product development not specified | none | none | - | - |
| AI/ML specific requirements not specified | none | none | - | - |

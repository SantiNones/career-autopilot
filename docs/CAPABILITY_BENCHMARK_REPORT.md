# Capability Mapping Layer — Benchmark Report (Phase 1, deterministic only)

## Setup
- Evidence inventory items: 59
- Distinct evidence capabilities generated: 37
- Benchmark jobs: 8
- Total requirements: 80
- Unmapped requirements (no capability found): 7 (9%)
- Deterministic mapping coverage: 91%

## Production V4 Scores vs Expected

| Job | V4 Score | V4 Verdict | Expected Verdict | Expected Range | In Range | Gates |
|---|---|---|---|---|---|---|
| Junior Analytics / AI Consultant (Deloitte) | 74 | APPLY | APPLY | 65-80 | YES | - |
| AI Automation Consultant (Maisa) | 80 | APPLY | APPLY | 70-85 | YES | - |
| Junior Application Support Engineer (Corus) | 57 | APPLY_STRETCH | APPLY_STRETCH | 55-70 | YES | - |
| Solutions Engineer (Europe) (Linear) | 64 | APPLY_STRETCH | MAYBE | 40-60 | no | - |
| Applied AI Forward Deployed Engineer (Mistral) | 44 | MAYBE | MAYBE | 45-60 | no | - |
| Applied AI Fullstack Engineer (Mistral) | 88 | APPLY | APPLY_STRETCH | 55-70 | no | - |
| Applied AI Site Reliability Engineer (Mistral) | 5 | SKIP | SKIP | 0-35 | YES | Title signals seniority/infrastructure: "Site Reliability"; Description requires: "incident response"; High experience bar: "5+ years" |
| Junior AI Engineer (Zurich Insurance) | 76 | APPLY | APPLY | 65-80 | YES | - |

- Verdict accuracy: 6/8
- Score in expected range: 5/8

## Overall Coverage: V3 vs Capability Matching

| Metric | Current V3 | Capability-based |
|---|---|---|
| Requirements covered | 66/80 (83%) | 61/80 (76%) |
| Strong matches | 4 | 31 |
| Partial (medium) | 62 | 20 |
| Weak | 0 | 10 |
| Missing | 14 | 19 |

## Per-Job Comparison

| Job | Reqs | V3 Coverage | Cap Coverage | V3 s/m/w/n | Cap s/m/w/n | Unmapped Reqs |
|---|---|---|---|---|---|---|
| Junior Analytics / AI Consultant (Deloitte) | 13 | 77% | 92% | 1/9/0/3 | 5/5/2/1 | - |
| AI Automation Consultant (Maisa) | 9 | 89% | 89% | 1/7/0/1 | 4/4/0/1 | - |
| Junior Application Support Engineer (Corus) | 9 | 56% | 100% | 1/4/0/4 | 2/3/4/0 | - |
| Solutions Engineer (Europe) (Linear) | 10 | 90% | 80% | 1/8/0/1 | 3/2/3/2 | Knowledge of Linear's products |
| Applied AI Forward Deployed Engineer (Mistral) | 10 | 100% | 60% | 0/10/0/0 | 4/2/0/4 | Travel readiness; Experience in AI/ML |
| Applied AI Fullstack Engineer (Mistral) | 9 | 100% | 100% | 0/9/0/0 | 6/2/1/0 | - |
| Applied AI Site Reliability Engineer (Mistral) | 8 | 63% | 13% | 0/5/0/3 | 1/0/0/7 | Performance tuning at scale |
| Junior AI Engineer (Zurich Insurance) | 12 | 83% | 67% | 0/10/0/2 | 6/2/0/4 | Knowledge of insurance processes; No specific leadership or management expectations; Experience in product development not specified |

## Capability Match Detail (per job)

### Junior Analytics / AI Consultant (Deloitte)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| SQL | capability | medium | database_querying, data_modeling, backend_development, data_analysis | Career Autopilot; Whatsapp Agent MVP; Rise |
| Python | exact | strong | backend_development, fullstack_development, workflow_automation, scripting, scalable_systems, software_engineering_fundamentals, api_development | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Dashboarding | adjacent | weak | data_analysis, reporting | TELUS Digital — Digital Trust and Safety Analyst; Wesser — Partner Recruiter; Analytics |
| Generative AI tools | capability | medium | llm_integration, api_integration, prompt_engineering | Career Autopilot; Whatsapp Agent MVP; Rise |
| Junior level | none | none | - | - |
| No consulting experience required | adjacent | weak | stakeholder_communication | Fundesplai — Educational Activities Coordinator |
| English | exact | strong | english_language | English (fluent) |
| Analytics & AI practice | exact | strong | database_querying, data_analysis, reporting, metrics_tracking, investigation | Career Autopilot; Rise; Station |
| Strong communication skills | exact | strong | communication | Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator; English (fluent) |
| Willingness to learn | capability | medium | learning_agility | Wesser — Partner Recruiter |
| Support discovery workshops | capability | medium | product_demos, presentation_skills, stakeholder_communication | Projectflow AI; Ethnicraft; Fundesplai — Educational Activities Coordinator |
| Build prototypes | capability | medium | fullstack_development, architecture_design, product_building | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Present findings to stakeholders | exact | strong | product_demos, presentation_skills, customer_communication, communication, stakeholder_communication | Projectflow AI; Ethnicraft; Wesser — Partner Recruiter |

### AI Automation Consultant (Maisa)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| Automate processes with AI agents | capability | medium | ai_workflows, workflow_automation, scripting, api_integration, llm_integration | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Build agentic workflows with LLMs | capability | medium | ai_workflows, workflow_automation, llm_integration | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Integrate APIs | capability | medium | api_integration, systems_integration, workflow_automation, api_development, llm_integration | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Prototype automation solutions in Python and JavaScript | exact | strong | fullstack_development, web_development, backend_development, product_building, workflow_automation, scripting, software_engineering_fundamentals, api_integration, ai_workflows, frontend_development, api_development, architecture_design | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Run client discovery and demos | capability | medium | product_demos, presentation_skills | Projectflow AI; Ethnicraft |
| Junior to mid level | none | none | - | - |
| AI project portfolio valued over formal experience | exact | strong | fullstack_development, product_building | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Customer-facing skills | exact | strong | customer_communication, stakeholder_communication, communication | Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator; English (fluent) |
| Python and JavaScript | exact | strong | fullstack_development, web_development, backend_development, scripting, software_engineering_fundamentals, frontend_development, api_development, workflow_automation, product_building | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |

### Junior Application Support Engineer (Corus)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| Application support for enterprise software | capability | medium | customer_communication, stakeholder_communication, communication, investigation | Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator; English (fluent) |
| Troubleshooting issues | adjacent | weak | investigation | Fundesplai — Educational Activities Coordinator; Problem Solving |
| Analyzing logs | adjacent | weak | investigation | Fundesplai — Educational Activities Coordinator; Problem Solving |
| Writing SQL queries | capability | medium | database_querying, data_modeling, backend_development, data_analysis | Career Autopilot; Whatsapp Agent MVP; Rise |
| Escalating bugs | adjacent | weak | customer_communication, investigation | Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator; Problem Solving |
| Communicating with customers | capability | medium | customer_communication, stakeholder_communication, communication | Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator; English (fluent) |
| Scripting in Python | exact | strong | backend_development, fullstack_development, workflow_automation, scripting, scalable_systems, software_engineering_fundamentals, api_development | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Technically minded | adjacent | weak | frontend_development, backend_development, version_control, testing_qa | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Customer-facing experience | exact | strong | customer_communication, stakeholder_communication, communication | Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator; English (fluent) |

### Solutions Engineer (Europe) (Linear)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| Solutions engineering | adjacent | weak | systems_integration, product_demos | Career Autopilot; Projectflow AI; Rise |
| 3+ years in solutions engineering, sales engineering, or software engineering | adjacent | weak | frontend_development, backend_development, systems_integration, version_control, product_demos, testing_qa | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Deep product expertise | exact | strong | fullstack_development, product_building | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Technical discovery | none | none | - | - |
| API integrations (TypeScript) | exact | strong | fullstack_development, web_development, api_integration, systems_integration, backend_development, frontend_development, api_development, workflow_automation, product_building | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Workflow consulting | adjacent | weak | stakeholder_communication | Fundesplai — Educational Activities Coordinator |
| Demos for engineering leaders | capability | medium | product_demos, presentation_skills | Projectflow AI; Ethnicraft |
| Strong written communication | exact | strong | communication | Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator; English (fluent) |
| Working with enterprise customers | capability | medium | customer_communication, stakeholder_communication, communication | Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator; English (fluent) |
| Knowledge of Linear's products | none | none | - | - |

### Applied AI Forward Deployed Engineer (Mistral)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| Python programming | exact | strong | backend_development, fullstack_development, workflow_automation, scripting, scalable_systems, software_engineering_fundamentals, api_development | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| LLM fine-tuning | exact | strong | llm_integration, api_integration, prompt_engineering | Career Autopilot; Whatsapp Agent MVP; Rise |
| RAG architectures | capability | medium | llm_integration, ai_workflows, architecture_design, scalable_systems | Career Autopilot; Whatsapp Agent MVP; Rise |
| Production deployment | none | none | - | - |
| 3+ years software or ML engineering experience | none | none | - | - |
| Experience in building LLM solutions on Mistral models | exact | strong | llm_integration, api_integration, prompt_engineering | Career Autopilot; Whatsapp Agent MVP; Rise |
| Ability to work on-site with clients | capability | medium | customer_communication, stakeholder_communication, communication | Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator; English (fluent) |
| Travel readiness | none | none | - | - |
| Experience in AI/ML | none | none | - | - |
| Experience in enterprise customer embedding | exact | strong | customer_communication, stakeholder_communication, communication | Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator; English (fluent) |

### Applied AI Fullstack Engineer (Mistral)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| TypeScript programming | exact | strong | fullstack_development, web_development, backend_development, frontend_development, product_building | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| React programming | exact | strong | web_development, frontend_development, software_engineering_fundamentals, ui_ux | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Python programming | exact | strong | backend_development, fullstack_development, workflow_automation, scripting, scalable_systems, software_engineering_fundamentals, api_development | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Experience with LLM APIs | exact | strong | llm_integration, api_integration, prompt_engineering | Career Autopilot; Whatsapp Agent MVP; Rise |
| Experience with RAG | adjacent | weak | llm_integration, ai_workflows | Career Autopilot; Whatsapp Agent MVP; Rise |
| 2+ years fullstack experience | capability | medium | fullstack_development, frontend_development, web_development, backend_development, product_building | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Strong AI project portfolio | exact | strong | fullstack_development, product_building | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Ability to build customer-facing AI applications | exact | strong | customer_communication, stakeholder_communication, communication | Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator; English (fluent) |
| Ability to ship demos and production features with customers | capability | medium | fullstack_development, product_building, product_demos, presentation_skills, customer_communication, stakeholder_communication, communication | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |

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
| Python programming | exact | strong | backend_development, fullstack_development, workflow_automation, scripting, scalable_systems, software_engineering_fundamentals, api_development | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| Experience with OpenAI APIs | exact | strong | llm_integration, api_integration, prompt_engineering | Career Autopilot; Whatsapp Agent MVP; Rise |
| Integration of LLM workflows into insurance processes | exact | strong | api_integration, systems_integration, llm_integration, workflow_automation, api_development, prompt_engineering | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |
| SQL and data analysis skills | capability | medium | database_querying, data_modeling, backend_development, data_analysis, reporting, metrics_tracking, investigation | Career Autopilot; Whatsapp Agent MVP; Rise |
| Junior level experience | none | none | - | - |
| Strong learning mindset | capability | medium | learning_agility | Wesser — Partner Recruiter |
| English language proficiency | exact | strong | english_language | English (fluent) |
| Knowledge of insurance processes | none | none | - | - |
| Ability to collaborate with business stakeholders | exact | strong | presentation_skills, customer_communication, communication, stakeholder_communication, collaboration | Ethnicraft; Wesser — Partner Recruiter; Fundesplai — Educational Activities Coordinator |
| No specific leadership or management expectations | none | none | - | - |
| Experience in product development not specified | none | none | - | - |
| Experience in building AI-powered features | exact | strong | ai_workflows, workflow_automation, llm_integration | Career Autopilot; Whatsapp Agent MVP; Projectflow AI |

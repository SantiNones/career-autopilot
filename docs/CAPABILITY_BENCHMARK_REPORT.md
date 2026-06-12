# Capability Mapping Layer — Benchmark Report (Phase 1, deterministic only)

## Setup
- Evidence inventory items: 7
- Distinct evidence capabilities generated: 10
- Benchmark jobs: 8
- Total requirements: 81
- Unmapped requirements (no capability found): 7 (9%)
- Deterministic mapping coverage: 91%

## Overall Coverage: V3 vs Capability Matching

| Metric | Current V3 | Capability-based |
|---|---|---|
| Requirements covered | 41/81 (51%) | 35/81 (43%) |
| Strong matches | 0 | 12 |
| Partial (medium) | 40 | 13 |
| Weak | 1 | 10 |
| Missing | 40 | 46 |

## Per-Job Comparison

| Job | Reqs | V3 Coverage | Cap Coverage | V3 s/m/w/n | Cap s/m/w/n | Unmapped Reqs |
|---|---|---|---|---|---|---|
| Junior Analytics / AI Consultant (Deloitte) | 13 | 31% | 46% | 0/4/0/9 | 1/3/2/7 | - |
| AI Automation Consultant (Maisa) | 8 | 50% | 50% | 0/4/0/4 | 3/0/1/4 | - |
| Junior Application Support Engineer (Corus) | 10 | 30% | 60% | 0/3/0/7 | 1/2/3/4 | Communicate with customers |
| Solutions Engineer (Europe) (Linear) | 9 | 33% | 56% | 0/2/1/6 | 2/2/1/4 | - |
| Applied AI Forward Deployed Engineer (Mistral) | 10 | 70% | 10% | 0/7/0/3 | 0/1/0/9 | Experience with on-site client work; Ability to travel; Ability to work as a forward deployed engineer |
| Applied AI Fullstack Engineer (Mistral) | 10 | 70% | 70% | 0/7/0/3 | 4/3/0/3 | - |
| Applied AI Site Reliability Engineer (Mistral) | 8 | 38% | 13% | 0/3/0/5 | 0/1/0/7 | - |
| Junior AI Engineer (Zurich Insurance) | 13 | 77% | 38% | 0/10/0/3 | 1/1/3/8 | Knowledge of insurance processes; No specific leadership or management expectations; Experience in AI/ML |

## Capability Match Detail (per job)

### Junior Analytics / AI Consultant (Deloitte)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| SQL | adjacent | weak | backend_development | javascript Development; node.js Development |
| Python | capability | medium | backend_development, fullstack_development, software_engineering_fundamentals | javascript Development; typescript Development; node.js Development |
| Dashboarding | none | none | - | - |
| Generative AI tools | none | none | - | - |
| Junior level | none | none | - | - |
| No consulting experience required | none | none | - | - |
| English | none | none | - | - |
| Knowledge in Analytics & AI | none | none | - | - |
| Support discovery workshops | none | none | - | - |
| Present findings to stakeholders | adjacent | weak | customer_communication, communication | Communication ability |
| Build prototypes | capability | medium | fullstack_development, product_building | javascript Development; typescript Development; node.js Development |
| Strong communication skills | exact | strong | communication | Communication ability |
| Willingness to learn | capability | medium | learning_agility | Learning mindset |

### AI Automation Consultant (Maisa)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| Automate processes with AI agents | none | none | - | - |
| Build agentic workflows with LLMs | none | none | - | - |
| Integrate APIs | adjacent | weak | api_development | node.js Development |
| Prototype automation solutions in Python and JavaScript | exact | strong | fullstack_development, web_development, backend_development, product_building | javascript Development; typescript Development; react Development |
| Run client discovery and demos | none | none | - | - |
| Junior to mid level | none | none | - | - |
| AI project portfolio valued over formal experience | exact | strong | backend_development, fullstack_development, product_building | javascript Development; typescript Development; node.js Development |
| Customer-facing skills | exact | strong | customer_communication | Communication ability |

### Junior Application Support Engineer (Corus)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| Application support for enterprise software | capability | medium | customer_communication | Communication ability |
| Troubleshoot issues | none | none | - | - |
| Analyze logs | none | none | - | - |
| Write SQL queries | adjacent | weak | backend_development | javascript Development; node.js Development |
| Escalate bugs | adjacent | weak | customer_communication | Communication ability |
| Communicate with customers | none | none | - | - |
| Scripting in Python | capability | medium | backend_development, fullstack_development, software_engineering_fundamentals | javascript Development; typescript Development; node.js Development |
| Technically minded | adjacent | weak | backend_development, frontend_development | javascript Development; react Development; node.js Development |
| Customer-facing experience | exact | strong | customer_communication | Communication ability |
| Entry level position | none | none | - | - |

### Solutions Engineer (Europe) (Linear)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| Solutions engineering | none | none | - | - |
| 3+ years in solutions engineering, sales engineering, or software engineering | adjacent | weak | backend_development, frontend_development | javascript Development; react Development; node.js Development |
| Deep product expertise | capability | medium | fullstack_development, product_building | javascript Development; typescript Development; node.js Development |
| Technical discovery | none | none | - | - |
| API integrations (TypeScript) | exact | strong | fullstack_development, web_development, product_building | javascript Development; typescript Development; react Development |
| Workflow consulting | none | none | - | - |
| Demos for engineering leaders | none | none | - | - |
| Strong written communication | exact | strong | communication | Communication ability |
| Enterprise customers in Europe | capability | medium | customer_communication | Communication ability |

### Applied AI Forward Deployed Engineer (Mistral)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| Python programming | capability | medium | backend_development, fullstack_development, software_engineering_fundamentals | javascript Development; typescript Development; node.js Development |
| LLM fine-tuning | none | none | - | - |
| RAG architectures | none | none | - | - |
| Production deployment | none | none | - | - |
| 3+ years software or ML engineering experience | none | none | - | - |
| Experience with on-site client work | none | none | - | - |
| Ability to travel | none | none | - | - |
| Experience in building LLM solutions on Mistral models | none | none | - | - |
| Experience in AI/ML engineering | none | none | - | - |
| Ability to work as a forward deployed engineer | none | none | - | - |

### Applied AI Fullstack Engineer (Mistral)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| Fullstack engineering | capability | medium | fullstack_development, frontend_development, web_development, product_building | javascript Development; typescript Development; react Development |
| 2+ years fullstack experience | capability | medium | fullstack_development, frontend_development, web_development, product_building | javascript Development; typescript Development; react Development |
| TypeScript programming | exact | strong | fullstack_development, web_development, product_building | javascript Development; typescript Development; react Development |
| React programming | exact | strong | web_development, frontend_development, software_engineering_fundamentals | javascript Development; typescript Development; react Development |
| Python programming | capability | medium | backend_development, fullstack_development, software_engineering_fundamentals | javascript Development; typescript Development; node.js Development |
| LLM APIs knowledge | none | none | - | - |
| RAG knowledge | none | none | - | - |
| Ability to ship demos and production features with customers | none | none | - | - |
| AI project portfolio | exact | strong | fullstack_development, product_building | javascript Development; typescript Development; node.js Development |
| Experience in building customer-facing AI applications | exact | strong | customer_communication | Communication ability |

### Applied AI Site Reliability Engineer (Mistral)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| SRE for AI inference infrastructure | none | none | - | - |
| Kubernetes | none | none | - | - |
| GPU clusters | none | none | - | - |
| Observability | none | none | - | - |
| Incident response | none | none | - | - |
| Performance tuning at scale | capability | medium | backend_development, fullstack_development, software_engineering_fundamentals | javascript Development; typescript Development; node.js Development |
| 5+ years SRE/infrastructure experience | none | none | - | - |
| LLM serving experience | none | none | - | - |

### Junior AI Engineer (Zurich Insurance)

| Requirement | Tier | Strength | Shared Capabilities | Evidence |
|---|---|---|---|---|
| Python programming | capability | medium | backend_development, fullstack_development, software_engineering_fundamentals | javascript Development; typescript Development; node.js Development |
| Experience with OpenAI APIs | none | none | - | - |
| Integration of LLM workflows into processes | adjacent | weak | api_development | node.js Development |
| SQL skills | adjacent | weak | backend_development | javascript Development; node.js Development |
| Data analysis skills | none | none | - | - |
| Junior level experience | none | none | - | - |
| Strong learning mindset | exact | strong | learning_agility | Learning mindset |
| English language proficiency | none | none | - | - |
| Knowledge of insurance processes | none | none | - | - |
| Ability to collaborate with business stakeholders | adjacent | weak | customer_communication, communication | Communication ability |
| No specific leadership or management expectations | none | none | - | - |
| Experience in building AI-powered features | none | none | - | - |
| Experience in AI/ML | none | none | - | - |

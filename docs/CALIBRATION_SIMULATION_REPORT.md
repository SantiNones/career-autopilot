# Calibration Simulation Report — 3-Model Comparison (60 jobs)

Models:
- **A** Current V3 (additive raw points, -10 per missing)
- **B** Normalized importance-weighted (critical=3/important=2/nice=1; strong=1.0/medium=0.75/weak=0.4; missing critical caps at 45)
- **C** Model B + seniority gate (senior/staff/principal/lead/manager/director title with no senior evidence caps at 35)

## Overall Accuracy

| Model | Overall | APPLY | APPLY_STRETCH | MAYBE | SKIP | Scores In Expected Range |
|---|---|---|---|---|---|---|
| A (current) | 26.7% | 0% | 0% | 0% | 100% | 27% |
| B (normalized) | 16.7% | 20% | 17% | 25% | 6% | 20% |
| C (B + gate) | 40.0% | 20% | 17% | 25% | 94% | 43% |

## Average Score by Expected Verdict

| Expected | Target Range | Model A | Model B | Model C |
|---|---|---|---|---|
| APPLY | 65-85 | 7.8 | 53.6 | 53.6 |
| APPLY_STRETCH | 55-70 | 10.0 | 55.3 | 55.3 |
| MAYBE | 40-60 | 5.8 | 47.9 | 47.9 |
| SKIP | 0-40 | 7.2 | 62.6 | 35.3 |

## Confusion Matrix — Model A (Current)

| Expected \ Actual | APPLY | APPLY_STRETCH | MAYBE | SKIP |
|---|---|---|---|---|
| **APPLY** | 0 | 0 | 0 | 20 |
| **APPLY_STRETCH** | 0 | 0 | 0 | 12 |
| **MAYBE** | 0 | 0 | 0 | 12 |
| **SKIP** | 0 | 0 | 0 | 16 |

## Confusion Matrix — Model B (Normalized)

| Expected \ Actual | APPLY | APPLY_STRETCH | MAYBE | SKIP |
|---|---|---|---|---|
| **APPLY** | 4 | 6 | 7 | 3 |
| **APPLY_STRETCH** | 4 | 2 | 5 | 1 |
| **MAYBE** | 4 | 0 | 3 | 5 |
| **SKIP** | 9 | 4 | 2 | 1 |

## Confusion Matrix — Model C (Normalized + Seniority Gate)

| Expected \ Actual | APPLY | APPLY_STRETCH | MAYBE | SKIP |
|---|---|---|---|---|
| **APPLY** | 4 | 6 | 7 | 3 |
| **APPLY_STRETCH** | 4 | 2 | 5 | 1 |
| **MAYBE** | 4 | 0 | 3 | 5 |
| **SKIP** | 1 | 0 | 0 | 15 |

## Real Benchmark Jobs

| Role | Expected | A | B | C | Expected Range |
|---|---|---|---|---|---|
| Junior Analytics / AI Consultant (Deloitte) | APPLY | 0 (SKIP) | 27 (SKIP) | 27 (SKIP) | 65-80 |
| AI Automation Consultant (Maisa) | APPLY | 10 (SKIP) | 61 (APPLY_STRETCH) | 61 (APPLY_STRETCH) | 70-85 |
| AI Product Engineer (Factorial) | APPLY | 0 (SKIP) | 48 (MAYBE) | 48 (MAYBE) | 65-80 |
| Full-stack AI Developer Tools Engineer (Alan) | APPLY | 25 (SKIP) | 75 (APPLY) | 75 (APPLY) | 60-75 |
| Python + React Engineer (Aubay) | APPLY | 0 (SKIP) | 53 (MAYBE) | 53 (MAYBE) | 65-80 |
| Junior Application Support Engineer (Corus) | APPLY_STRETCH | 0 (SKIP) | 33 (SKIP) | 33 (SKIP) | 55-70 |
| Solutions Engineer (Europe) (Linear) | MAYBE | 15 (SKIP) | 45 (MAYBE) | 45 (MAYBE) | 40-60 |
| Applied AI Forward Deployed Engineer (Mistral) | MAYBE | 5 (SKIP) | 66 (APPLY) | 66 (APPLY) | 45-60 |
| Applied AI Fullstack Engineer (Mistral) | APPLY_STRETCH | 20 (SKIP) | 70 (APPLY) | 70 (APPLY) | 55-70 |
| Applied AI Site Reliability Engineer (Mistral) | SKIP | 15 (SKIP) | 75 (APPLY) | 75 (APPLY) | 0-35 |

## Per-Job Scores

| Job | Expected | A | B | C |
|---|---|---|---|---|
| Junior AI Engineer (TechFlow) | APPLY | 10 SKIP | 58 APPLY_STRETCH | 58 APPLY_STRETCH |
| AI Automation Engineer (Automation Labs) | APPLY | 0 SKIP | 45 MAYBE | 45 MAYBE |
| AI Product Engineer (ProductAI) | APPLY | 20 SKIP | 65 APPLY | 65 APPLY |
| Python + React Engineer (FullStack Solutions) | APPLY | 10 SKIP | 45 MAYBE | 45 MAYBE |
| Junior Full Stack Engineer (StartupHub) | APPLY | 15 SKIP | 63 APPLY_STRETCH | 63 APPLY_STRETCH |
| Applied AI Engineer (Junior) (DataScience Inc) | APPLY | 0 SKIP | 38 SKIP | 38 SKIP |
| AI Consultant (Junior) (ConsultAI) | APPLY | 0 SKIP | 40 MAYBE | 40 MAYBE |
| Junior Software Engineer (Web) (WebWorks) | APPLY | 10 SKIP | 60 APPLY_STRETCH | 60 APPLY_STRETCH |
| Frontend Developer (React) (UI First) | APPLY | 20 SKIP | 75 APPLY | 75 APPLY |
| AI Workflow Developer (FlowOps) | APPLY | 0 SKIP | 50 MAYBE | 50 MAYBE |
| Junior Backend Developer (Python) (PySolutions) | APPLY | 0 SKIP | 45 MAYBE | 45 MAYBE |
| Full Stack Developer (TypeScript) (TypeStack) | APPLY | 5 SKIP | 56 APPLY_STRETCH | 56 APPLY_STRETCH |
| GenAI Application Developer (GenApps) | APPLY | 0 SKIP | 32 SKIP | 32 SKIP |
| Junior Web Engineer (AI Startup) (AIStart) | APPLY | 10 SKIP | 61 APPLY_STRETCH | 61 APPLY_STRETCH |
| AI Integration Engineer (Integrate.io) | APPLY | 20 SKIP | 75 APPLY | 75 APPLY |
| Solutions Engineer (SaaSCo) | APPLY_STRETCH | 0 SKIP | 49 MAYBE | 49 MAYBE |
| Forward Deployed Engineer (DeployTech) | APPLY_STRETCH | 10 SKIP | 61 APPLY_STRETCH | 61 APPLY_STRETCH |
| Customer Engineer (CloudBase) | APPLY_STRETCH | 15 SKIP | 45 MAYBE | 45 MAYBE |
| Product Engineer (BuildRight) | APPLY_STRETCH | 20 SKIP | 65 APPLY | 65 APPLY |
| Technical Consultant (ConsultTech) | APPLY_STRETCH | 0 SKIP | 41 MAYBE | 41 MAYBE |
| Applied AI Engineer (Mid-Level) (MidAI) | APPLY_STRETCH | 0 SKIP | 55 APPLY_STRETCH | 55 APPLY_STRETCH |
| Implementation Specialist (Technical) (ImplementCo) | APPLY_STRETCH | 0 SKIP | 40 MAYBE | 40 MAYBE |
| Sales Engineer (Technical) (SellTech) | APPLY_STRETCH | 25 SKIP | 75 APPLY | 75 APPLY |
| AI Solutions Architect (Junior) (ArchAI) | APPLY_STRETCH | 0 SKIP | 54 MAYBE | 54 MAYBE |
| Developer Experience Engineer (DevXP) | APPLY_STRETCH | 30 SKIP | 75 APPLY | 75 APPLY |
| Data Engineer (DataFlow) | MAYBE | 0 SKIP | 21 SKIP | 21 SKIP |
| Analytics Consultant (InsightCo) | MAYBE | 0 SKIP | 25 SKIP | 25 SKIP |
| Cloud Engineer (CloudNine) | MAYBE | 0 SKIP | 38 SKIP | 38 SKIP |
| Backend Engineer (Mid-Level) (ScaleAPI) | MAYBE | 0 SKIP | 45 MAYBE | 45 MAYBE |
| Product Manager (Technical) (ProductLab) | MAYBE | 0 SKIP | 30 SKIP | 30 SKIP |
| Platform Engineer (PlatformOne) | MAYBE | 0 SKIP | 50 MAYBE | 50 MAYBE |
| Machine Learning Engineer (MLWorks) | MAYBE | 10 SKIP | 75 APPLY | 75 APPLY |
| QA Automation Engineer (QualityFirst) | MAYBE | 20 SKIP | 75 APPLY | 75 APPLY |
| Mobile Developer (React Native) (AppFactory) | MAYBE | 20 SKIP | 75 APPLY | 75 APPLY |
| Technical Account Manager (AccountTech) | MAYBE | 0 SKIP | 30 SKIP | 30 SKIP |
| Staff Engineer (BigTech) | SKIP | 0 SKIP | 56 APPLY_STRETCH | 35 SKIP |
| Principal Engineer (Enterprise Systems) | SKIP | 10 SKIP | 75 APPLY | 35 SKIP |
| Senior Site Reliability Engineer (UptimeCo) | SKIP | 5 SKIP | 61 APPLY_STRETCH | 35 SKIP |
| Senior ML Engineer (DeepStack) | SKIP | 15 SKIP | 75 APPLY | 35 SKIP |
| Research Scientist (NLP) (AI Research Lab) | SKIP | 0 SKIP | 0 SKIP | 0 SKIP |
| Head of AI (ScaleUp Inc) | SKIP | 10 SKIP | 75 APPLY | 35 SKIP |
| Director of Engineering (GrowthCorp) | SKIP | 10 SKIP | 75 APPLY | 35 SKIP |
| DevOps Lead (InfraOps) | SKIP | 0 SKIP | 52 MAYBE | 35 SKIP |
| Senior Embedded Systems Engineer (ChipWorks) | SKIP | 15 SKIP | 75 APPLY | 35 SKIP |
| Senior Security Engineer (SecureNet) | SKIP | 0 SKIP | 56 APPLY_STRETCH | 35 SKIP |
| Senior Data Scientist (QuantCo) | SKIP | 5 SKIP | 61 APPLY_STRETCH | 35 SKIP |
| Engineering Manager (TeamLead Inc) | SKIP | 5 SKIP | 75 APPLY | 35 SKIP |
| Senior iOS Engineer (MobileFirst) | SKIP | 15 SKIP | 75 APPLY | 35 SKIP |
| Database Administrator (Senior) (DataKeep) | SKIP | 0 SKIP | 41 MAYBE | 35 SKIP |
| VP of Engineering (UnicornCo) | SKIP | 10 SKIP | 75 APPLY | 35 SKIP |
| Junior Analytics / AI Consultant (Deloitte) | APPLY | 0 SKIP | 27 SKIP | 27 SKIP |
| AI Automation Consultant (Maisa) | APPLY | 10 SKIP | 61 APPLY_STRETCH | 61 APPLY_STRETCH |
| AI Product Engineer (Factorial) | APPLY | 0 SKIP | 48 MAYBE | 48 MAYBE |
| Full-stack AI Developer Tools Engineer (Alan) | APPLY | 25 SKIP | 75 APPLY | 75 APPLY |
| Python + React Engineer (Aubay) | APPLY | 0 SKIP | 53 MAYBE | 53 MAYBE |
| Junior Application Support Engineer (Corus) | APPLY_STRETCH | 0 SKIP | 33 SKIP | 33 SKIP |
| Solutions Engineer (Europe) (Linear) | MAYBE | 15 SKIP | 45 MAYBE | 45 MAYBE |
| Applied AI Forward Deployed Engineer (Mistral) | MAYBE | 5 SKIP | 66 APPLY | 66 APPLY |
| Applied AI Fullstack Engineer (Mistral) | APPLY_STRETCH | 20 SKIP | 70 APPLY | 70 APPLY |
| Applied AI Site Reliability Engineer (Mistral) | SKIP | 15 SKIP | 75 APPLY | 75 APPLY |

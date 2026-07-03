# Career Autopilot — Dependency Maps

Last updated: 2026-07-01  
Owner: Santiago Nones

Every major subsystem documented with responsibilities, inputs, outputs, dependencies, and side effects.

---

## 1. Discovery

**Files:** `src/server/jobDiscovery/`

| Field | Details |
|-------|---------|
| **Responsibility** | Discover public job listings from external providers, score them against candidate preferences, and save the top recommendations |
| **Inputs** | CandidatePreferences (from DB), CompanySource registry, optional search query |
| **Outputs** | RecommendedJob records (top 50), DiscoverySummary (stats) |
| **Dependencies** | Greenhouse API, Lever API, Ashby API, jobScoring.ts (heuristic), classifiers (location, seniority, role intent), fitAnalysisV2 |
| **Side Effects** | Creates/updates RecommendedJob table, creates CompanySource records |
| **Uses OpenAI** | NO |
| **Cached** | NO |
| **Trigger** | User clicks "Run Discovery" |
| **Estimated Cost** | $0 (no LLM). Network calls to 3 APIs. |

**Internal Components:**
- `discoveryService.ts` — Orchestrator: fetches from providers, scores, dedupes, saves
- `discoveryScoring.ts` — Composite scoring combining classifiers + heuristic
- `providers/greenhouse.ts` — Greenhouse public API adapter
- `providers/lever.ts` — Lever public API adapter
- `providers/ashby.ts` — Ashby public API adapter
- `classifiers/locationEligibility.ts` — Barcelona/Spain/Europe/Remote classification
- `classifiers/seniorityClassification.ts` — Junior/Mid/Senior/Staff detection
- `classifiers/roleIntentClassification.ts` — Target role family matching

---

## 2. Candidate Intelligence

**Files:** `src/server/candidateIntelligence/candidateIntelligenceGenerator.ts`

| Field | Details |
|-------|---------|
| **Responsibility** | Build a structured candidate model for career matching, fit analysis, and positioning |
| **Inputs** | UserProfile + CandidatePreferences, ResumeMaster, ExperienceInsight |
| **Outputs** | CandidateIntelligence record (career stage, role families, technical stack, strengths, evidence inventory, risk areas, constraints, summary) |
| **Dependencies** | OpenAI GPT-4o, Evidence Engine (generateEvidenceInventory) |
| **Side Effects** | Creates/updates CandidateIntelligence in DB |
| **Uses OpenAI** | YES |
| **Cached** | NO |
| **Trigger** | User clicks "Analyze" on Candidate Intelligence panel |
| **Estimated Cost** | ~$0.05-0.15 per generation |

**Critical Note:** CandidateIntelligence is a prerequisite for Fit Analysis V4. Without it, fit analysis is skipped.

---

## 3. Resume Parsing

**Files:** `src/server/resumeParsing.ts`, `src/server/resumeUploadParsing.ts`

| Field | Details |
|-------|---------|
| **Responsibility** | Extract text content from uploaded resume files (PDF, DOCX) and parse into structured sections |
| **Inputs** | File upload (PDF or DOCX binary) |
| **Outputs** | ResumeMaster record (rawText, summary, experience, projects, skills, education, languages, links) |
| **Dependencies** | pdf-parse (PDF extraction), mammoth (DOCX extraction) |
| **Side Effects** | Creates/updates ResumeMaster in DB |
| **Uses OpenAI** | NO (text extraction is deterministic) |
| **Cached** | N/A (stored in DB) |
| **Trigger** | User uploads resume file or pastes resume text |
| **Estimated Cost** | $0 |

---

## 4. Fit Analysis

**Files:** `src/server/fitAnalysis.ts`, `src/server/fitAnalysis/`

| Field | Details |
|-------|---------|
| **Responsibility** | Determine how well a candidate matches a specific job posting using evidence-based capability matching |
| **Inputs** | JobPosting (title + rawText), CandidateIntelligence (evidence inventory) |
| **Outputs** | FitAnalysis record (strengths, gaps, matching skills/projects, angle, score, breakdown), JobEvaluation (V4 scores + verdict) |
| **Dependencies** | OpenAI (for requirement extraction in V3), capabilityMatcher (deterministic matching), capabilityMapper (evidence mapping) |
| **Side Effects** | Creates/updates FitAnalysis + creates JobEvaluation in DB |
| **Uses OpenAI** | YES (requirement extraction step only) |
| **Cached** | NO |
| **Trigger** | Automatically after job ingestion (async), or user triggers rescore |
| **Estimated Cost** | ~$0.02-0.05 per job (requirement extraction LLM call) |

**Pipeline:**
```
extractRequirements(job) [LLM]
  → mapEvidenceInventory(CI) [deterministic]
  → matchRequirementToEvidence() per req [deterministic]
  → Model D scoring [deterministic]
  → Gate application [deterministic]
  → Verdict [deterministic]
```

**Key Insight:** Only requirement extraction is non-deterministic. All scoring after that point is fully deterministic.

---

## 5. Evidence Engine

**Files:** `src/server/evidence/evidenceEngine.ts`, `src/server/evidence/evidenceEnrichment.ts`

| Field | Details |
|-------|---------|
| **Responsibility** | Generate and enrich a structured evidence inventory from candidate's experience, projects, and skills |
| **Inputs** | Resume sections (experience, projects, skills), ExperienceInsight |
| **Outputs** | Evidence inventory (structured list of provable claims with capability tags) |
| **Dependencies** | Capability Taxonomy (static), ExperienceInsight data |
| **Side Effects** | Evidence is stored within CandidateIntelligence (evidenceInventory field) |
| **Uses OpenAI** | Partially (called within CI generation flow) |
| **Cached** | Stored in CandidateIntelligence record |
| **Trigger** | Called as part of Candidate Intelligence generation |
| **Estimated Cost** | Included in CI generation cost |

---

## 6. Materials Generation

**Files:** `src/server/materialGeneration.ts`, `src/server/openaiMaterials.ts`

| Field | Details |
|-------|---------|
| **Responsibility** | Generate tailored application materials (CV, cover letter, recruiter message, screening answers) for a specific job |
| **Inputs** | JobPosting, UserProfile + Preferences, ResumeMaster, latest JobEvaluation, FitAnalysis, PositioningProfile (optional) |
| **Outputs** | 4 JobMaterial records (TAILORED_CV, COVER_LETTER, RECRUITER_MESSAGE, SCREENING_ANSWERS) |
| **Dependencies** | OpenAI GPT-4o |
| **Side Effects** | Creates JobMaterial records in DB |
| **Uses OpenAI** | YES |
| **Cached** | NO (generates fresh each time) |
| **Trigger** | User clicks "Generate Materials" on job detail page |
| **Estimated Cost** | ~$0.10-0.30 per job (large prompt with full context) |

**Critical Dependencies (all required):**
- UserProfile must exist
- ResumeMaster must exist
- JobPosting must have rawText
- FitAnalysis should exist (degrades gracefully without it)

---

## 7. Export

**Files:** `src/server/export/pdfExport.ts`, `src/server/export/docxExport.ts`, `src/server/export/parseMaterialForExport.ts`

| Field | Details |
|-------|---------|
| **Responsibility** | Convert generated material text into downloadable PDF or DOCX documents |
| **Inputs** | Material content string, filename |
| **Outputs** | Binary file (PDF or DOCX) as HTTP response |
| **Dependencies** | pdf-lib (PDF generation), docx (DOCX generation), parseMaterialForExport (text → structured sections) |
| **Side Effects** | None (pure transformation) |
| **Uses OpenAI** | NO |
| **Cached** | NO (generated on demand) |
| **Trigger** | User clicks "Export PDF" or "Export DOCX" button |
| **Estimated Cost** | $0 |

**Supported Exports:**
- CV → PDF, DOCX
- Cover Letter → PDF, DOCX
- Recruiter Message → NOT EXPORTED (copy only)
- Screening Answers → NOT EXPORTED (copy only)

---

## 8. Application Tracking

**Files:** `src/app/api/jobs/[id]/status/route.ts`, `src/app/applications/page.tsx`, `src/components/StatusControls.tsx`

| Field | Details |
|-------|---------|
| **Responsibility** | Track job applications through pipeline stages and display progress |
| **Inputs** | User status change action (new ApplicationStatus) |
| **Outputs** | Updated JobPosting.applicationStatus, Pipeline Kanban view |
| **Dependencies** | Prisma (DB update), StatusControls component |
| **Side Effects** | Updates applicationStatus field on JobPosting |
| **Uses OpenAI** | NO |
| **Cached** | N/A |
| **Trigger** | User clicks status button on job detail page |
| **Estimated Cost** | $0 |

**Status Flow:**
```
DISCOVERED → APPLY / MAYBE / SKIP
APPLY → APPLIED
APPLIED → INTERVIEW / REJECTED
INTERVIEW → OFFER / REJECTED
```

---

## 9. Job Parsing

**Files:** `src/server/jobParsing.ts`

| Field | Details |
|-------|---------|
| **Responsibility** | Parse HTML from job board pages into structured job data (title, company, description, metadata) |
| **Inputs** | URL + HTML string |
| **Outputs** | Parsed job object (title, companyName, rawText, location, parsedJson) |
| **Dependencies** | None (pure HTML parsing) |
| **Side Effects** | None (pure function) |
| **Uses OpenAI** | NO |
| **Cached** | NO |
| **Trigger** | Called during URL-based job ingestion |
| **Estimated Cost** | $0 |

---

## 10. Heuristic Job Scoring

**Files:** `src/server/jobScoring.ts`

| Field | Details |
|-------|---------|
| **Responsibility** | Quickly score a job against candidate preferences using keyword matching and rules (no LLM) |
| **Inputs** | Job rawText, CandidatePreferences |
| **Outputs** | JobScore (label, totalScore, 10 dimension scores, reasons, risks, gaps, narrative) |
| **Dependencies** | CandidatePreferences (from DB) |
| **Side Effects** | None (pure function) |
| **Uses OpenAI** | NO |
| **Cached** | NO |
| **Trigger** | Called during job ingestion (sync) and discovery scoring |
| **Estimated Cost** | $0 |

---

## 11. Capability Mapping

**Files:** `src/server/capability/capabilityMapper.ts`, `capabilityMatcher.ts`, `capabilityTaxonomy.ts`

| Field | Details |
|-------|---------|
| **Responsibility** | Map evidence items to capabilities, and match job requirements to candidate evidence through capability-based tiered matching |
| **Inputs** | Evidence inventory (from CI), job requirements (from V3 extraction) |
| **Outputs** | Capability matches with tiers (exact/capability/adjacent/none) and strength ratings |
| **Dependencies** | Capability Taxonomy (static), Evidence inventory |
| **Side Effects** | None (pure functions) |
| **Uses OpenAI** | NO |
| **Cached** | NO |
| **Trigger** | Called during Fit Analysis V4 |
| **Estimated Cost** | $0 |

---

## 12. Positioning Strategy

**Files:** `src/components/PositioningStrategyCard.tsx`, API route at `jobs/[id]/positioning/analyze`

| Field | Details |
|-------|---------|
| **Responsibility** | Generate a strategic positioning narrative for how to present the candidate for a specific role |
| **Inputs** | JobPosting, FitAnalysis, CandidateIntelligence |
| **Outputs** | PositioningProfile (strategic narrative, talking points, angle) |
| **Dependencies** | OpenAI GPT-4o |
| **Side Effects** | Creates PositioningProfile in DB |
| **Uses OpenAI** | YES |
| **Cached** | Stored in DB (one per job) |
| **Trigger** | User triggers from job detail page |
| **Estimated Cost** | ~$0.05-0.15 per job |

---

## See Also

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — System architecture overview
- **[SYSTEM_CONTRACTS.md](SYSTEM_CONTRACTS.md)** — Guarantees, invariants, failure modes
- **[../engineering/BENCHMARK_GUIDE.md](../engineering/BENCHMARK_GUIDE.md)** — Benchmark coverage per subsystem

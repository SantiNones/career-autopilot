# Career Autopilot — System Architecture

Last updated: 2026-07-01  
Owner: Santiago Nones

---

## High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js App Router)                 │
│                                                                         │
│  │Dashboard │   │ Pipeline │   │ Profile  │     │Job Detail│            │
│  │  page.tsx│   │  /apps   │   │  /profile│     │/jobs/[id]│            │
│  └────┬─────┘   └────┬─────┘   └────┬─────┘     └────┬─────┘            │
│       │              │              │                │                  │
│       └──────────────┴──────────────┴────────────────┘                  │
│                              │                                          │
└──────────────────────────────┼──────────────────────────────────────────┘
                               │ Server Components + API Routes
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           API LAYER (Next.js Route Handlers)            │
│                                                                         │
│  /api/jobs/ingest          /api/jobs/bulk-ingest                        │
│  /api/jobs/[id]/status     /api/jobs/[id]/generate-materials            │
│  /api/jobs/[id]/positioning/analyze                                     │
│  /api/jobs/rescore         /api/jobs/clear                              │
│  /api/discovery/run        /api/discovery/recommended                   │
│  /api/profile              /api/profile/resume/*                        │
│  /api/profile/experience-intelligence/analyze                           │
│  /api/profile/candidate-intelligence/analyze                            │
│  /api/export/cv/{pdf,docx} /api/export/cover-letter/{pdf,docx}          │
│  /api/validation/*                                                      │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BUSINESS LOGIC LAYER (src/server/)               │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐.  ┌─────────────────┐         │
│  │  Job Discovery  │  │  Fit Analysis   │   │   Materials     │         │
│  │  discoveryServ. │  │  V3 + V4        │   │   Generation    │         │
│  │  providers/     │  │  deterministicEx│.  │   openaiMat.    │         │
│  │  classifiers/   │  │  capabilityMatch│   │   materialGen.  │         │
│  │  scoring        │  │                 │   │                 │         │
│  └────────┬────────┘  └────────┬────────┘   └────────┬────────┘         │
│           │                    │                     │                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │  Job Scoring    │  │  Evidence       │  │   Export        │          │
│  │  (heuristic)    │  │  Engine         │  │   PDF + DOCX    │          │
│  │  jobScoring.ts  │  │  evidenceEng.   │  │   pdfExport.ts  │          │
│  └─────────────────┘  │  enrichment     │  │   docxExport.ts │          │
│                       └─────────────────┘  └─────────────────┘          │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │  Candidate      │  │  Capability     │  │  Relevance      │          │
│  │  Intelligence   │  │  Mapping        │  │  Engine         │          │
│  │  generator      │  │  mapper/matcher │  │  capFamilies    │          │
│  └─────────────────┘  │  taxonomy       │  └─────────────────┘          │
│                       └─────────────────┘                               │
│  ┌─────────────────┐  ┌─────────────────┐                               │
│  │  Job Parsing    │  │  Resume Parsing │                               │
│  │  jobParsing.ts  │  │  resumeParsing  │                               │
│  │                 │  │  uploadParsing  │                               │
│  └─────────────────┘  └─────────────────┘                               │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                     │
│                                                                         │
│  ┌─────────────────────────────┐    ┌──────────────────────────┐       │
│  │  PostgreSQL 16 (Docker)     │    │  External Services       │       │
│  │                             │    │                          │       │
│  │  UserProfile                │    │  OpenAI GPT-4o           │       │
│  │  CandidatePreferences       │    │  Greenhouse API          │       │
│  │  CandidateIntelligence      │    │  Lever API               │       │
│  │  JobPosting                 │    │  Ashby API               │       │
│  │  JobEvaluation              │    │  Target job board URLs   │       │
│  │  FitAnalysis                │    │                          │       │
│  │  JobMaterial                │    └──────────────────────────┘       │
│  │  Application                │                                       │
│  │  ResumeMaster               │    ┌──────────────────────────┐       │
│  │  ExperienceInsight          │    │  Deployment              │       │
│  │  CompanySource              │    │                          │       │
│  │  RecommendedJob             │    │  Vercel (production)     │       │
│  │  PositioningProfile         │    │  localhost:3000 (dev)    │       │
│  │  AutomationRun/Log          │    │                          │       │
│  └─────────────────────────────┘    └──────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | Next.js (App Router) | 16.2.2 |
| UI Library | React (Server + Client Components) | 19.2.4 |
| Styling | TailwindCSS | 4.x |
| Language | TypeScript | 5.x |
| ORM | Prisma | 6.19.3 |
| Database | PostgreSQL | 16 |
| AI | OpenAI SDK | 6.41.0 |
| PDF Generation | pdf-lib | 1.17.1 |
| PDF Parsing | pdf-parse | 2.4.5 |
| DOCX Generation | docx | 9.7.1 |
| DOCX Parsing | mammoth | 1.12.0 |
| Containerization | Docker Compose | - |
| Deployment | Vercel | - |

---

## Module Classification

### Deterministic Modules (no LLM, fully reproducible)

| Module | File(s) | Description |
|--------|---------|-------------|
| Heuristic Job Scoring | `server/jobScoring.ts` | Keyword/rule-based scoring against preferences |
| Location Classifier | `server/jobDiscovery/classifiers/locationEligibility.ts` | Geo classification (Barcelona/Spain/Europe/Remote) |
| Seniority Classifier | `server/jobDiscovery/classifiers/seniorityClassification.ts` | Junior/Mid/Senior/Staff detection |
| Role Intent Classifier | `server/jobDiscovery/classifiers/roleIntentClassification.ts` | Target role family matching |
| Deterministic Extractor | `server/fitAnalysis/deterministicExtractor.ts` | Rule-based requirement extraction |
| Capability Taxonomy | `server/capability/capabilityTaxonomy.ts` | Static capability definitions |
| Capability Matcher | `server/capability/capabilityMatcher.ts` | Evidence-to-requirement matching |
| Evidence Inventory Mapping | `server/capability/capabilityMapper.ts` | Maps evidence to capabilities |
| V4 Scoring Logic | `server/fitAnalysis/fitAnalysisV4.ts` | Model D weighted coverage scoring |
| Metrics Calculation | `lib/metrics.ts` | Pipeline counts and rates |
| Job Parsing | `server/jobParsing.ts` | HTML → structured job data |
| Resume Text Parsing | `server/resumeParsing.ts` | Document → text extraction |
| Discovery Scoring | `server/jobDiscovery/discoveryScoring.ts` | Composite discovery score |
| Export (PDF/DOCX) | `server/export/*.ts` | Document generation from content |

### LLM-Dependent Modules (require OpenAI)

| Module | File(s) | When Called | Approximate Cost |
|--------|---------|-------------|------------------|
| Candidate Intelligence | `server/candidateIntelligence/candidateIntelligenceGenerator.ts` | User triggers "Analyze" | ~$0.05-0.15/call |
| Experience Intelligence | API route: `profile/experience-intelligence/analyze` | User triggers "Analyze" | ~$0.03-0.10/call |
| Requirement Extraction (V3) | `server/fitAnalysis/fitAnalysisV3.ts` → `extractRequirements()` | Every fit analysis | ~$0.02-0.05/job |
| Material Generation | `server/openaiMaterials.ts` | User triggers "Generate" | ~$0.10-0.30/job |
| Positioning Strategy | API route: `jobs/[id]/positioning/analyze` | User triggers "Analyze" | ~$0.05-0.15/job |
| Relevance Engine | `server/relevanceEngine.ts` | Scoring context | ~$0.01-0.03/call |

### Cached Modules

**Currently: NONE.**

No caching layer exists. Every LLM call is made fresh. This is a known gap.

---

## Main Data Flows

### Flow 1: Profile Setup

```
User fills ProfileForm
  → POST /api/profile
  → prisma.userProfile.upsert()
  → prisma.candidatePreferences.upsert()
  
User uploads resume
  → POST /api/profile/resume/upload
  → Parse PDF/DOCX → extract text
  → prisma.resumeMaster.upsert()
  
User triggers Experience Intelligence
  → POST /api/profile/experience-intelligence/analyze
  → OpenAI: extract structured insights from resume
  → prisma.experienceInsight.upsert()
  
User triggers Candidate Intelligence
  → POST /api/profile/candidate-intelligence/analyze
  → Requires: UserProfile + Preferences + ResumeMaster + ExperienceInsight
  → OpenAI: build structured candidate model + evidence inventory
  → prisma.candidateIntelligence.upsert()
```

### Flow 2: Job Discovery

```
User clicks "Run Discovery"
  → POST /api/discovery/run { query? }
  → ensureCompanySources(): load/create CompanySource records
  → For each provider (Greenhouse, Lever, Ashby):
    → Fetch public job listings via provider API
    → Parse job metadata (title, company, location, description, applyUrl)
  → For each discovered job:
    → discoveryScoreJob():
      → classifyLocationEligibility()  [deterministic]
      → classifySeniority()            [deterministic]
      → classifyRoleIntent()           [deterministic]
      → scoreJob() (heuristic)         [deterministic]
      → analyzeFitV2() (lightweight)   [deterministic]
      → Composite scoring              [deterministic]
  → Deduplicate by provider+externalId
  → Rank by matchScore
  → Save top 50 to RecommendedJob table
  → Return DiscoverySummary
```

### Flow 3: Job Ingestion (Manual)

```
User pastes URL or job description
  → POST /api/jobs/ingest { url?, pastedText? }
  → Dedupe check (sourceUrl unique constraint)
  → If substantial pasted text (≥200 chars): use directly
  → If URL: 
    → validateIngestInput() → reject blocked domains
    → fetch(url) with browser UA
    → If blocked: create "Needs manual description" record
    → If OK: parseJobFromHtml() → validateJobPage()
  → scoreJob() [deterministic heuristic]
  → prisma.jobPosting.create + evaluation
  → async: saveFitAnalysis(jobId)
```

### Flow 4: Fit Analysis (V4)

```
saveFitAnalysis(jobId)
  → Load JobPosting + CandidateIntelligence
  → If no CI exists: skip (no-op)
  → analyzeFitV4(job, CI):
    → extractRequirements(job) [LLM — V3 OpenAI call]
    → Filter out non-requirements
    → mapEvidenceInventory(CI.evidenceInventory) [deterministic]
    → For each requirement:
      → matchRequirementToEvidence() [deterministic capability matching]
      → Assign tier: exact > capability > adjacent > none
      → Assign strength: strong > medium > weak > none
    → Model D Scoring:
      → Weight by importance (critical=3, important=2, nice_to_have=1)
      → Credit by strength (strong=1.0, medium=0.75, weak=0.4, none=0)
      → rawCoverageScore = (earned / total) * 100
    → Apply gates:
      → Critical gap cap → max 45
      → Seniority gate cap → max 35
    → Determine verdict: ≥65=APPLY, ≥55=APPLY_STRETCH, ≥40=MAYBE, <40=SKIP
  → prisma.fitAnalysis.upsert()
  → prisma.jobEvaluation.create() with V4 scores
```

### Flow 5: Material Generation

```
User clicks "Generate Materials"
  → POST /api/jobs/[id]/generate-materials
  → Load: JobPosting + UserProfile + Preferences + ResumeMaster + latest Evaluation + FitAnalysis
  → openaiMaterials.ts:
    → Build comprehensive prompt with:
      → Job description + requirements
      → Candidate profile + experience + skills
      → Fit analysis strengths + gaps + angle
      → Positioning strategy (if available)
    → OpenAI call → structured output
    → Parse into 4 materials: CV, Cover Letter, Recruiter Message, Screening Answers
  → Save 4 JobMaterial records (type, content, version=1, status=DRAFT)
```

### Flow 6: Export

```
User clicks "Export PDF" or "Export DOCX"
  → POST /api/export/cv/{pdf|docx} or /api/export/cover-letter/{pdf|docx}
  → Body: { content: string, filename: string }
  → parseMaterialForExport(content) → structured sections
  → pdfExport.ts or docxExport.ts → generate binary
  → Return binary blob with Content-Disposition header
  → Browser triggers download
```

### Flow 7: Application Tracking

```
User changes job status (from job detail page)
  → POST /api/jobs/[id]/status { status: ApplicationStatus }
  → prisma.jobPosting.update({ applicationStatus })
  → Server Component re-renders with new state

Pipeline view (/applications):
  → Server Component loads all jobs
  → Groups by applicationStatus into Kanban columns
  → Renders cards with score, label, company, date
```

---

## Database Schema Overview

**12 models, 4 enums**

### Core Models

| Model | Purpose | Key Relations |
|-------|---------|--------------|
| `UserProfile` | User identity and contact info | → Preferences, → CandidateIntelligence |
| `CandidatePreferences` | Career goals, location, role targets | ← UserProfile |
| `CandidateIntelligence` | LLM-generated candidate model | ← UserProfile |
| `JobPosting` | Central job record | → Evaluations, → Materials, → FitAnalysis, → Applications |
| `JobEvaluation` | Score + breakdown for a job | ← JobPosting |
| `FitAnalysis` | Evidence-based fit assessment | ← JobPosting |
| `JobMaterial` | Generated application materials | ← JobPosting |
| `Application` | Application tracking record | ← JobPosting, → ApplicationMaterial |
| `ResumeMaster` | User's master resume text | → ExperienceInsight |
| `ExperienceInsight` | Structured resume insights | ← ResumeMaster |
| `CompanySource` | Provider-company registry for discovery | standalone |
| `RecommendedJob` | Discovered jobs from providers | standalone |
| `PositioningProfile` | Positioning strategy for a job | ← JobPosting |
| `AutomationRun` / `AutomationLog` | Audit trail for automated operations | standalone |

### Enums

| Enum | Values |
|------|--------|
| `JobLabel` | APPLY, APPLY_STRETCH, MAYBE, SKIP |
| `ApplicationStatus` | DISCOVERED, APPLY, MAYBE, SKIP, APPLIED, INTERVIEW, REJECTED, OFFER |
| `JobStatus` | SOURCED, PARSED, SCORED, SHORTLISTED, MATERIALS_READY, APPLIED, INTERVIEW, REJECTED |
| `MaterialType` | TAILORED_CV, COVER_LETTER, RECRUITER_MESSAGE, SCREENING_ANSWERS |
| `MaterialStatus` | DRAFT, REVIEWED |
| `DiscoveryProvider` | GREENHOUSE, LEVER, ASHBY |

---

## Frontend Architecture

### Pages (Server Components by default)

| Route | Component | Data Loading |
|-------|-----------|--------------|
| `/` | Dashboard | Jobs + Evaluations + RecommendedJobs |
| `/applications` | Pipeline Kanban | Jobs grouped by applicationStatus |
| `/profile` | Profile + Resume + Intelligence | UserProfile + ResumeMaster |
| `/jobs/[id]` | Job Detail | Full job + evaluations + materials + fit + positioning |

### Client Components (interactive)

| Component | Purpose |
|-----------|---------|
| `IngestJobForm` | URL/text input for single job |
| `BulkIngestForm` | Multi-item ingest |
| `RecommendedJobsSection` | Discovery results with Run button |
| `ProfileForm` | All profile + preferences fields |
| `MasterResumeForm` | Resume text editing |
| `MaterialsSection` | Material display + export + copy |
| `StatusControls` | Application status management |
| `CandidateIntelligencePanel` | CI display + trigger |
| `ExperienceIntelligencePanel` | EI display + trigger |
| `PositioningStrategyCard` | Strategy display |
| `EditJobDetailsForm` | Edit job title/company/etc |
| `UpdateDescriptionForm` | Update job description |

---

## Key Architectural Decisions

1. **Server Components First** — All pages are Server Components. Only interactive elements are Client Components. This minimizes client JS and enables direct DB access in pages.

2. **Single-User Architecture** — No auth system. `findFirst()` is used to load the single user profile. Multi-user would require auth + user scoping.

3. **Deterministic-First Scoring** — Heuristic scoring (`jobScoring.ts`) runs synchronously on ingest. LLM-based fit analysis (`V4`) runs async after job creation.

4. **Provider-Based Discovery** — Discovery is pull-based: user triggers a run, system fetches from all providers, scores, and saves top 50.

5. **Async Fit Analysis** — `void saveFitAnalysis(jobId)` is fire-and-forget after ingest. The page may show the job before fit analysis completes.

6. **No Caching** — All LLM calls are made fresh. No result caching exists. This is a known technical debt.

7. **No Auth / No Multi-Tenancy** — The system assumes a single user. All queries use `findFirst()` without user ID filtering.

8. **PostgreSQL via Docker** — Local development uses `docker-compose.yml`. Production uses Vercel's managed Postgres (via DATABASE_URL env var).

---

## See Also

- **[DEPENDENCY_MAPS.md](DEPENDENCY_MAPS.md)** — Subsystem responsibilities, inputs, outputs
- **[SYSTEM_CONTRACTS.md](SYSTEM_CONTRACTS.md)** — Guarantees, failure modes, invariants
- **[../product/SPEC.md](../product/SPEC.md)** — Full product specification
- **[../reports/SPRINT_1_ARCHITECTURE_AUDIT.md](../reports/SPRINT_1_ARCHITECTURE_AUDIT.md)** — Detailed architecture audit
- **[../decisions/](../decisions/)** — Architecture Decision Records

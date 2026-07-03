# Sprint 1 — Architecture, Scalability & Future Growth Audit

Last updated: 2026-07-01  
Owner: Santiago Nones  
OpenAI cost: **$0**  
Codebase snapshot: 19,532 lines of TypeScript/TSX across 68 files

---

## Deliverable 1 — Architecture Audit

### Subsystem Scores

| Subsystem | Score | Responsibilities | Coupling | Cohesion | Notes |
|-----------|-------|-----------------|----------|----------|-------|
| **Capability Taxonomy** | 9/10 | Single | Low | High | Clean static data. Adjacency lists are well-designed. Embedding-ready. |
| **Capability Matcher** | 9/10 | Single | Low | High | Pure function. Deterministic. Tiered matching is elegant. |
| **Evidence Engine** | 8/10 | Single | Low | High | Clean inputs/outputs. Well-scoped. |
| **Export (PDF/DOCX)** | 8/10 | Single | None | High | Pure transformation. Zero side effects. Zero dependencies on business logic. |
| **Resume Parsing** | 7/10 | Single | Low | High | Deterministic. Good section detection. Hardcoded project links are a smell (user-specific data in production code). |
| **Heuristic Job Scoring** | 7/10 | Single | Low | Medium | Pure function. But 458 lines in `fitAnalysis.ts` mixes heuristic analysis + DB persistence + V4 orchestration. |
| **Fit Analysis V4** | 7/10 | Single | Medium | High | Clean algorithm. Depends on V3 `extractRequirements` (LLM). The V4 file itself is only 180 lines and focused. |
| **Application Tracking** | 7/10 | Single | Low | High | Simple CRUD. Well-isolated. |
| **Candidate Intelligence** | 6/10 | Dual | Medium | Medium | Generates CI + calls Evidence Engine. Output type uses `any` everywhere. Heavy LLM prompt. |
| **Relevance Engine** | 6/10 | Single | Low | Medium | 389 lines. Capability family scoring is solid but overlaps with capabilityMapper conceptually. |
| **Material Generation (template)** | 6/10 | Single | Low | Medium | 674 lines. Duplicated type definitions with `openaiMaterials.ts`. |
| **Discovery Service** | 5/10 | Dual | Medium | Medium | Orchestration + DB persistence mixed. `any` types in scored job. |
| **Discovery Scoring** | 4/10 | Multiple | High | Low | 351 lines. Stacks V1.3 + V2 scoring. Hardcoded fake candidate profile. Double bonus bug. Imports from two separate scoring modules. |
| **Job Parsing** | 6/10 | Single | Low | Medium | Pure function. But 287 lines mixing parsing + validation + URL normalization. |
| **OpenAI Materials** | 3/10 | Multiple | Medium | Low | **1,368 lines.** Largest file by far. Contains: type defs, JSON extraction, narrative analysis, company context detection, project metadata, project scoring, CV layout logic, experience ranking, gap analysis, skill categorization, prompt construction, and OpenAI call. This is a god module. |
| **Fit Analysis V3** | 5/10 | Dual | Medium | Medium | 567 lines. Contains LLM-based requirement extraction + evidence matching + scoring. Mixed concerns. Heavy debug logging. |

### Key Architectural Problems

#### 1. `openaiMaterials.ts` is a god module (1,368 lines)

This file contains at least 8 distinct responsibilities:
- Type definitions (duplicated from `materialGeneration.ts`)
- JSON extraction utility
- Narrative analysis engine (company context, project scoring, gap analysis)
- CV layout decisions
- Skill categorization
- Experience ranking
- Prompt construction
- OpenAI API call

**Impact:** Any change to material generation requires understanding 1,368 lines. Adding a new material type, changing project scoring, or adjusting the prompt all touch the same file.

#### 2. Duplicated type definitions

`Profile`, `Prefs`, `Resume`, `Evaluation`, `FitAnalysisInput`, `Job`, `GeneratedMaterials` are all defined independently in both `materialGeneration.ts` and `openaiMaterials.ts`. They are structurally identical but not shared.

**Impact:** Type drift. If a field is added to one, the other silently diverges.

#### 3. `fitAnalysis.ts` has mixed responsibilities (458 lines)

This file contains:
- Heuristic keyword-based analysis (`analyzeJobFit`)
- Tech skills dictionary (static data)
- Company type detection
- Job focus detection
- Seniority detection
- **Database persistence** (`saveFitAnalysis`)
- **V4 orchestration** (calling `analyzeFitV4` and converting results)

The DB runner function `saveFitAnalysis` mixes orchestration, data loading, format conversion, and persistence in one 80-line function.

#### 4. Discovery scoring imports from two separate scoring modules

`discoveryScoring.ts` imports:
- `scoreJob` from `@/server/jobScoring` (V1 heuristic)
- `analyzeFitV2` from `@/server/jobScoring/fitAnalysisV2` (V2 fit analysis)

It then stacks both scores with bonuses and caps, creating a scoring pipeline that is impossible to trace without reading 3 files.

#### 5. Hardcoded candidate data in discovery scoring

```@/Users/santi/CascadeProjects/CareerAutopilot/src/server/jobDiscovery/discoveryScoring.ts:282-302
  const candidateTechnologies = toStringArray(prefs?.positiveKeywords).length > 0 
    ? toStringArray(prefs?.positiveKeywords)
    : ['javascript', 'typescript', 'python', 'react', 'node.js'];
  
  const candidateLanguages = ['English'];
  
  const candidateProfile = {
    yearsExperience: 3,
    technologies: candidateTechnologies,
    domains: ['software engineering'],
    credentials: [],
    languages: candidateLanguages,
    location: 'Spain',
    openToRelocation: prefs?.openToRelocation || false,
    ...
  };
```

This constructs a **fake candidate profile** with hardcoded values instead of using real Candidate Intelligence data. This violates the "understand once, reuse forever" principle.

#### 6. Business logic in API routes

`src/app/api/jobs/ingest/route.ts` (183 lines) contains:
- Input validation
- URL fetching with browser UA spoofing
- HTML parsing orchestration
- Deduplication logic
- Scoring logic
- Label mapping (`APPLY_STRETCH` → `APPLY`)
- Database creation with nested evaluation
- Async fit analysis trigger

This is an orchestration layer disguised as an API route. The route should delegate to a service.

`src/app/api/jobs/[id]/generate-materials/route.ts` (166 lines) similarly contains:
- Data loading (5 parallel queries)
- FitAnalysis format conversion
- Positioning profile parsing
- OpenAI vs template decision
- Material persistence with versioning

#### 7. Hardcoded user-specific data in production code

`resumeParsing.ts` lines 51-75: `PROJECT_LINK_MAP` contains Santiago's specific project URLs:
```
{ namePatterns: ["projectflow", "project flow"], liveDemo: "https://projectflow-ai-chi.vercel.app/", github: "https://github.com/SantiNones/projectflow-ai" }
```

`openaiMaterials.ts` lines 230-281: `PROJECT_METADATA` contains Santiago's specific projects with maturity scores and URLs.

This user-specific data is baked into the scoring and generation logic. Multi-user support requires extracting this to the database.

#### 8. `any` types in critical paths

- `candidateIntelligenceGenerator.ts`: Output interface uses `any` for 13 of 17 fields
- `discoveryService.ts` line 39: `fitBreakdown?: any; positionabilityBreakdown?: any`
- `fitAnalysis.ts` line 392: `await analyzeFitV4(job as any, candidateIntelligence)`
- `fitAnalysis.ts` lines 425-435: multiple `as any` casts for JSON columns

---

## Deliverable 2 — Folder Structure Audit

### Current Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/                # 32 API routes
│   │   ├── debug/          # 2 debug endpoints
│   │   ├── discovery/      # 3 routes
│   │   ├── export/         # 4 routes (cv/cover-letter × pdf/docx)
│   │   ├── jobs/           # 12 routes
│   │   ├── profile/        # 7 routes
│   │   └── validation/     # 4 routes
│   ├── applications/       # Pipeline page
│   ├── jobs/               # Job detail page
│   └── profile/            # Profile page
├── components/             # 20 React components (flat)
├── lib/                    # 2 files (db.ts, metrics.ts)
├── server/                 # 34 files (business logic)
│   ├── candidateIntelligence/  # 1 file
│   ├── capability/             # 3 files
│   ├── evidence/               # 2 files
│   ├── export/                 # 3 files
│   ├── fitAnalysis/            # 3 files
│   ├── jobDiscovery/           # 10 files
│   │   ├── classifiers/        # 3 files
│   │   └── providers/          # 4 files (index + 3 providers)
│   ├── jobScoring/             # 2 files
│   └── relevance/              # 1 file
└── validation/             # 6 files (benchmarks)
```

### Evaluation Per Folder

#### `src/app/api/` — API Routes
- **Purpose:** HTTP endpoints. Request parsing, response formatting, error handling.
- **What belongs:** Route handlers that delegate to services. Input validation. Auth middleware (future).
- **What should NOT belong:** Business logic, data transformation, scoring decisions, format conversion.
- **Current problems:** `ingest/route.ts` and `generate-materials/route.ts` contain 150+ lines of business logic each. The routes are services in disguise.
- **Future risk:** As features grow, routes become 300+ line orchestrators. Adding auth requires touching every route.

#### `src/server/` — Business Logic
- **Purpose:** Core business logic. Scoring, analysis, generation, parsing.
- **What belongs:** Pure functions, service modules, LLM interactions.
- **What should NOT belong:** Database queries (most files correctly avoid this, except `fitAnalysis.ts` and `discoveryService.ts`).
- **Current problems:** Flat files at the root (`fitAnalysis.ts`, `jobScoring.ts`, `materialGeneration.ts`, `openaiMaterials.ts`, `relevanceEngine.ts`, `resumeParsing.ts`, `cvGenerator.ts`) mix with organized subdirectories. No consistent pattern.
- **Future risk:** Adding new subsystems (career planning, interview prep, learning recommendations) will create more flat files or inconsistent subdirectories.

#### `src/components/` — React Components (flat)
- **Purpose:** UI components.
- **What belongs:** Presentational and interactive components.
- **What should NOT belong:** Business logic, API calls (but most client components correctly use `fetch` to API routes).
- **Current problems:** 20 files, all flat. No grouping by feature. `RecommendedJobsSection.tsx` (639 lines) and `ProfileForm.tsx` (458 lines) are large.
- **Future risk:** Adding 20 more components makes the folder unnavigable. No shared UI primitives (buttons, cards, modals).

#### `src/lib/` — Shared Utilities
- **Purpose:** Shared infrastructure.
- **What belongs:** Database client, shared types, utility functions.
- **What should NOT belong:** Business logic.
- **Current state:** Only 2 files — `db.ts` (10 lines) and `metrics.ts` (46 lines). Correct and clean.
- **Future risk:** Becomes a dumping ground for "shared" code that should be in `server/`.

#### `src/validation/` — Benchmarks
- **Purpose:** Benchmark fixtures and runners.
- **What belongs:** Test datasets, validation runners, calibration simulations.
- **Current state:** 6 files, well-organized. Includes V1 and V2 datasets and runners.
- **Future risk:** Minimal. Could be renamed to `benchmarks/` for clarity.

### Proposed Long-Term Structure (minimal changes)

Only justified changes. No theoretical purity.

```
src/
├── app/                    # (unchanged — Next.js convention)
├── components/
│   ├── ui/                 # Shared UI primitives (Button, Card, Modal)
│   ├── dashboard/          # Dashboard-specific components
│   ├── job/                # Job detail components
│   └── profile/            # Profile components
├── lib/                    # (unchanged)
├── server/
│   ├── candidateIntelligence/
│   ├── capability/
│   ├── discovery/          # (rename from jobDiscovery)
│   ├── evidence/
│   ├── export/
│   ├── fitAnalysis/
│   ├── materials/          # (consolidate materialGeneration + openaiMaterials)
│   ├── parsing/            # (consolidate jobParsing + resumeParsing)
│   ├── scoring/            # (consolidate jobScoring + relevanceEngine)
│   └── types/              # Shared type definitions
└── validation/             # (unchanged)
```

**This is a recommendation, not a requirement.** The current structure works for Stage 1. The reorganization becomes justified when the component count exceeds ~30 or when multi-user support arrives.

---

## Deliverable 3 — Dependency Audit

### Dependency Map

```
API Routes
  ├── ingest/route.ts ──→ jobParsing.ts
  │                   ──→ jobScoring.ts
  │                   ──→ fitAnalysis.ts ──→ fitAnalysisV4.ts ──→ fitAnalysisV3.ts (LLM)
  │                                                           ──→ capabilityMatcher.ts
  │                                     ──→ prisma (DB)
  │
  ├── generate-materials/route.ts ──→ materialGeneration.ts
  │                               ──→ openaiMaterials.ts ──→ OpenAI
  │
  ├── discovery/run/route.ts ──→ discoveryService.ts ──→ discoveryScoring.ts ──→ jobScoring.ts
  │                                                                          ──→ fitAnalysisV2.ts ──→ requirementExtraction.ts
  │                                                  ──→ providers/ (greenhouse, lever, ashby)
  │                                                  ──→ classifiers/ (location, seniority, roleIntent)
  │                                                  ──→ prisma (DB)
  │
  ├── candidate-intelligence/analyze/route.ts ──→ candidateIntelligenceGenerator.ts ──→ evidenceEngine.ts
  │                                                                                ──→ OpenAI
  │
  └── positioning/analyze/route.ts ──→ relevanceEngine.ts ──→ capabilityFamilies.ts
                                   ──→ OpenAI
```

### Modules With Excessive Dependencies

| Module | Imports | Problem |
|--------|---------|---------|
| `discoveryScoring.ts` | 6 imports (jobScoring, fitAnalysisV2, 3 classifiers, Prisma types) | Combines two scoring systems + three classifiers into one function |
| `openaiMaterials.ts` | 1 import (OpenAI) but **reimplements** logic from fitAnalysis.ts, resumeParsing.ts | Self-contained god module — copies logic instead of importing |
| `generate-materials/route.ts` | 4 imports + 5 DB queries | API route that does too much |
| `ingest/route.ts` | 4 imports + complex orchestration | API route that does too much |

### Circular Dependencies

**None found.** The dependency graph is acyclic. This is a strong positive.

### Hidden Coupling

| From | To | Coupling Type |
|------|----|---------------|
| `openaiMaterials.ts` | Resume data | Hardcoded `PROJECT_METADATA` with Santiago's project URLs and scores |
| `resumeParsing.ts` | Resume data | Hardcoded `PROJECT_LINK_MAP` with Santiago's project URLs |
| `discoveryScoring.ts` | Candidate profile | Hardcoded fake profile with `yearsExperience: 3`, `location: 'Spain'` |
| `fitAnalysis.ts` | V4 result format | `saveFitAnalysis` converts V4 results to legacy format for DB compatibility |
| `discoveryService.ts` | `RecommendedJob` schema | Directly creates DB records with 30+ fields |

### God Modules

1. **`openaiMaterials.ts` (1,368 lines)** — Narrative analysis + company detection + project scoring + CV layout + prompt construction + OpenAI call
2. **`fitAnalysis.ts` (458 lines)** — Heuristic analysis + company detection + seniority detection + job focus detection + DB persistence + V4 orchestration
3. **`discoveryScoring.ts` (351 lines)** — V1.3 scoring + V2 scoring + query matching + bonus stacking + label determination

### Duplicate Logic

| Logic | Location A | Location B |
|-------|-----------|-----------|
| Type definitions (Profile, Resume, Job, etc.) | `materialGeneration.ts` lines 1-57 | `openaiMaterials.ts` lines 2-73 |
| Company type detection | `fitAnalysis.ts` lines 217-230 | `openaiMaterials.ts` lines 175-213 |
| Seniority detection | `fitAnalysis.ts` lines 263-298 | `openaiMaterials.ts` lines 142-168 |
| Job focus detection | `fitAnalysis.ts` lines 234-258 | `openaiMaterials.ts` (implicit in narrative analysis) |
| `toStringArray()` helper | `discoveryScoring.ts` line 35-37 | `RecommendedJobsSection.tsx` line 39-41 |
| `str()` helper | `materialGeneration.ts` line 59-64 | `openaiMaterials.ts` line 91-96 |
| Project link data | `resumeParsing.ts` lines 51-75 | `openaiMaterials.ts` lines 230-281 |

### Missing Abstractions

1. **No service layer.** API routes call business logic directly. There's no intermediate orchestration layer for complex workflows (ingest → score → save → trigger fit analysis).
2. **No shared types.** Each module defines its own types independently. No `src/server/types/` or `src/lib/types.ts`.
3. **No caching layer.** Every LLM call is fresh. No hash-based caching abstraction.
4. **No cost tracking.** OpenAI calls have no token logging or cost estimation.

### Unnecessary Abstractions

1. **`cvGenerator.ts` (3,405 bytes)** — Appears unused or superseded by `openaiMaterials.ts`. Verify before removing.

---

## Deliverable 4 — Scalability Audit

### Scenario A — 1 User (Current State)

Everything works. No scaling concerns. Single Prisma client. No auth. No data isolation.

- **What breaks:** Nothing
- **Cost:** ~$0.20-0.50 per fit analysis cycle. ~$0.10-0.30 per material generation.
- **Performance:** Acceptable. Pages load in <2s.

### Scenario B — 100 Users

| Concern | Impact | Breaks First |
|---------|--------|-------------|
| **Auth** | No auth exists. All users see the same data. | **Critical — blocks everything** |
| **Multi-tenancy** | Every `findFirst()` query returns ANY user's data. `prisma.userProfile.findFirst()` appears in 8+ routes. | **Critical** |
| **Database** | PostgreSQL handles 100 users easily. But all `findFirst()` queries need `where: { userId }`. | Medium |
| **OpenAI costs** | 100 users × ~$2/month = $200/month. Manageable but needs monitoring. | Low |
| **Provider rate limits** | 100 users running discovery simultaneously could trigger Greenhouse/Lever/Ashby rate limits. | Medium |
| **Background jobs** | Fit analysis runs inline after ingest. 100 concurrent ingests = 100 concurrent OpenAI calls. | Medium |
| **Caching** | None. Same job scored 100 times by 100 users = 100 LLM calls. | Medium |
| **Storage** | Each user's resume, materials, and CI stored in PostgreSQL. 100 users ≈ 50MB. Fine. | None |

**Solve now:** Nothing. But **design** auth and multi-tenancy architecture now.
**Solve at Scenario B:** Auth, user scoping, basic rate limiting.

### Scenario C — 1,000 Users

| Concern | Impact |
|---------|--------|
| **OpenAI costs** | 1,000 × $2/month = $2,000/month. Requires caching and cost controls. |
| **Database connections** | Prisma connection pool may need tuning. Vercel serverless = many short-lived connections. |
| **Provider rate limits** | Shared discovery against same companies. Need request queuing or per-user scheduling. |
| **Background jobs** | Must move fit analysis to a job queue (Bull, Inngest, or similar). |
| **Caching** | Redis required. Cache requirement extraction by job description hash. |
| **Monitoring** | Need structured logging, error tracking (Sentry), and cost dashboards. |
| **Storage** | 1,000 users × ~50 jobs each × materials = ~5GB. PostgreSQL handles this. |

**Solve at Scenario C:** Caching layer, job queue, connection pooling, basic monitoring.

### Scenario D — 10,000 Users

| Concern | Impact |
|---------|--------|
| **OpenAI costs** | 10,000 × $2/month = $20,000/month without caching. With caching: ~$5,000/month. **Revenue required.** |
| **Database** | Need read replicas. Index optimization. Query optimization. |
| **Multi-tenancy** | Row-level security or tenant ID on every table. |
| **Background jobs** | Dedicated worker infrastructure. Not serverless functions. |
| **Provider rate limits** | Cannot have 10,000 users hitting the same provider APIs. Need centralized discovery with shared results. |
| **Memory** | `openaiMaterials.ts` builds large prompts in memory. 100 concurrent generations = memory pressure. |
| **CPU** | Deterministic scoring is fast (<10ms per job). Not a bottleneck. |
| **Observability** | Full APM required. Distributed tracing for multi-service. |
| **Billing** | Must have payment system. Freemium model. |
| **Search** | Job table filtering at 10K users × 100 jobs = 1M rows. Need database indexes and pagination. |

**Solve at Scenario D:** Revenue model, dedicated workers, read replicas, centralized discovery.

### Scenario E — 100,000 Users

| Concern | Impact |
|---------|--------|
| **Architecture** | Monolith is no longer viable. Need microservices or hybrid architecture (see Sprint 0.75 evaluation). |
| **Database** | Sharding or multi-database. Possibly separate databases per region. |
| **OpenAI costs** | $200K/month without aggressive caching. Need self-hosted models for some tasks. |
| **Discovery** | Centralized discovery service. Jobs are a shared resource. Users subscribe to job feeds. |
| **Compliance** | GDPR, data residency, data portability. |
| **Team** | Single developer is impossible. Need 5-10 engineers minimum. |

**Solve at Scenario E:** This is a different product. Hybrid architecture. Microservices. Dedicated teams.

### What to Solve Now vs. Later

| Solve Now | Solve at 100 Users | Solve at 1,000 Users | Solve Later |
|-----------|-------------------|---------------------|-------------|
| Document auth strategy | Implement auth | Caching layer (Redis) | Microservices |
| Remove hardcoded user data | User scoping on all queries | Job queue | Sharding |
| Design shared types | Basic rate limiting | Structured logging | Self-hosted models |
| Nothing else | Connection pooling | Cost dashboard | Multi-region |

---

## Deliverable 5 — Future Growth Audit

### Feature Difficulty Ratings

| Feature | Difficulty | Reason |
|---------|-----------|--------|
| **Authentication** | Medium | NextAuth.js or Clerk integration. ~2 days. But requires updating EVERY `findFirst()` query to include user context. |
| **Multiple users** | Hard | Every table except `CompanySource` and `RecommendedJob` needs a `userId` column. Every query needs scoping. Migration is large. |
| **Teams** | Hard | Requires team model, membership, shared data vs. private data decisions, permission model. |
| **Organizations** | Very Hard | Multi-tenant architecture. Organization-scoped data. Admin roles. Billing per org. |
| **Shared workspaces** | Very Hard | Which data is shared? Who can see whose materials? Permission complexity is high. |
| **Role permissions** | Medium | Standard RBAC. Well-understood pattern. But requires auth first. |
| **Python services** | Medium | Clean server-side module boundaries already exist. Each module has well-defined inputs/outputs per SYSTEM_CONTRACTS.md. Extraction is straightforward. |
| **FastAPI backend** | Medium | API gateway pattern. Next.js calls FastAPI instead of local `src/server/`. Requires API contract definition. |
| **Agent framework** | Medium | Python ecosystem has good agent frameworks (LangGraph, CrewAI). But requires clear task definitions and guardrails. |
| **Career Planning** | Hard | New intelligence layer. Requires trajectory modeling, market data, gap analysis. No existing infrastructure. |
| **Interview Preparation** | Medium | Extends existing fit analysis + positioning strategy. Evidence inventory already exists. |
| **Career Intelligence** | Hard | Market data pipeline. Skill demand tracking. Salary benchmarking. New data sources required. |
| **Learning recommendations** | Hard | Requires mapping capability gaps to learning resources. No existing resource database. |
| **Notifications** | Easy | Email or in-app. Well-understood pattern. Small scope. |
| **Scheduled jobs** | Medium | Cron or job queue (Inngest, Bull). Requires background worker infrastructure on Vercel. |
| **Background workers** | Medium | Vercel has limited background job support. May need separate worker deployment. |
| **Observability** | Easy | Structured logging + Sentry. Small scope. Clear implementation path. |
| **Billing / Stripe** | Medium | Well-documented. Standard integration. But requires pricing model decisions. |
| **Public API** | Medium | API routes already exist. Need versioning, rate limiting, API keys, documentation. |
| **Mobile app** | Hard | React Native possible but requires API-first architecture. Current server-side rendering won't work. |
| **Rate limiting** | Easy | Middleware in API routes. Libraries exist (upstash/ratelimit). |

---

## Deliverable 6 — Python Architecture Review

### Modules That Naturally Belong in Python

| Module | Reason | Migration Priority |
|--------|--------|-------------------|
| **Candidate Intelligence** | LLM orchestration, prompt engineering, structured output parsing. Python's LangChain/LlamaIndex ecosystem is stronger. | Stage 2 |
| **Discovery Service** | Could benefit from async job fetching, data pipeline patterns. Python's `asyncio` + `httpx` are mature. | Stage 2 (first migration candidate) |
| **Career Planning** (future) | Trajectory modeling, market data analysis. Python's data science ecosystem is unmatched. | Stage 3 (build natively) |
| **Recommendation Engine** (future) | Embedding-based similarity, collaborative filtering. Python's scikit-learn, sentence-transformers. | Stage 3 (build natively) |
| **LLM Orchestration** | Multi-model routing, structured output, guardrails. Python's ecosystem leads here. | Stage 3 |
| **Evaluation Pipeline** | Benchmark runners, statistical analysis, calibration. Python's numpy/pandas. | Stage 2 |

### Modules That Should Remain in Next.js Permanently

| Module | Reason |
|--------|--------|
| **Export (PDF/DOCX)** | Pure transformation. No AI. No data science. JavaScript libraries work fine. |
| **Application Tracking** | Simple CRUD. No benefit from Python. Stay close to the UI. |
| **Heuristic Job Scoring** | Deterministic. Fast. No Python advantage. Keep near the ingest pipeline. |
| **Resume Parsing** | Text extraction. JavaScript libraries (pdf-parse, mammoth) work well. |
| **Metrics / Dashboard** | Server-side rendering. Stays in Next.js by definition. |
| **Job Parsing** | HTML parsing. JavaScript's DOM/regex handling is natural. |
| **Capability Taxonomy + Mapper + Matcher** | Static data + pure functions. No Python advantage. But could move with Fit Analysis if needed. |

### Recommendation

Migrate **CI generation + Discovery + Fit Analysis** to Python at Stage 2. Build **Career Planning + Recommendation Engine** natively in Python at Stage 3. Everything else stays in Next.js.

---

## Deliverable 7 — Technical Debt Forecast

### 6 Months (Without Architectural Changes)

| File | Current Lines | Predicted Lines | Problem |
|------|--------------|----------------|---------|
| `openaiMaterials.ts` | 1,368 | **2,200+** | Every new material type, prompt improvement, or project adds to this file. It becomes the file nobody wants to touch. |
| `discoveryScoring.ts` | 351 | **500+** | More bonus rules, more provider-specific logic, more hardcoded candidate data. Technical debt compounds. |
| `fitAnalysis.ts` | 458 | **600+** | More scoring versions (V5, V6). More legacy format conversions. DB runner grows. |
| `RecommendedJobsSection.tsx` | 639 | **800+** | Filters, search, sort, pagination, hide/show toggle. All in one component. |
| `ProfileForm.tsx` | 458 | **600+** | More profile fields. Career goals expansion. Multi-step wizard. |
| `ingest/route.ts` | 183 | **250+** | More ingestion sources. More validation. More error handling. |

**Prediction:** The codebase grows from 19,500 to ~28,000 lines. The top 5 files contain 30% of all code. Debugging requires reading 3-4 files to trace any scoring path.

### 12 Months

- `openaiMaterials.ts` becomes **3,000+ lines** if interview prep, LinkedIn content, and career planning materials are added here
- Discovery scoring has **3 scoring versions** stacked, none removed
- Auth has been added, but every route was individually patched with `getUserId()` calls
- Database has **5+ JSON columns** used as untyped catch-alls
- The `src/server/` flat files have grown to 10+ files with no organization pattern
- Test coverage exists but tests are brittle because they depend on internal types that keep changing

### 24 Months

- The monolith is 40,000+ lines
- New engineers need 2+ weeks to understand the scoring pipeline
- `openaiMaterials.ts` has been split into 3 files but they still share state
- Discovery is still using the fake candidate profile because "it works and we're scared to change it"
- The Prisma schema has 25+ models with 10+ JSON columns
- Multi-user support was bolted on, creating subtle data isolation bugs
- Cost per user is higher than expected because caching was never added systematically

---

## Deliverable 8 — Interview Review

### What a Senior Engineer Would Praise

1. **Documentation quality.** The `/docs/` folder is exceptional. SPEC.md, ARCHITECTURE.md, SYSTEM_CONTRACTS.md, PRODUCT_PRINCIPLES.md — this level of documentation is rare in any codebase, let alone a solo project. It demonstrates engineering maturity.

2. **Capability-based matching (V4).** The tiered matching system (exact → capability → adjacent → none) with weighted importance scoring is a well-designed, extensible approach. The capability taxonomy is embedding-ready for future ML integration.

3. **Deterministic-first architecture.** The explicit separation of deterministic operations ($0 cost) from LLM operations is a strong architectural decision. Most AI products don't think about cost this carefully.

4. **Evidence grounding principle.** The hard rule that materials never invent experience is a trust-critical design decision that most AI products get wrong.

5. **Graceful degradation.** Template-based material generation as a fallback when OpenAI is unavailable shows mature error handling thinking.

6. **Clean pure functions.** `capabilityMatcher.ts`, `capabilityTaxonomy.ts`, `evidenceEngine.ts`, export modules — these are well-isolated, testable, and maintainable.

7. **Explicit system contracts.** Documented inputs, outputs, guarantees, failure modes, and "must never" lists for every subsystem. This is Staff+ level thinking.

8. **Sprint discipline.** The sprint rules, command budgets, and OpenAI budgets show real project management rigor.

### What a Senior Engineer Would Criticize

1. **`openaiMaterials.ts` is a 1,368-line god module.** "This file does everything. It's not a module — it's a program. Break it up."

2. **Types are `any` in critical paths.** "The Candidate Intelligence output uses `any` for 13 fields. This is the most important data structure in the system and it's untyped. Why?"

3. **Three scoring systems stacked without cleaning up.** "You have V1 heuristic + V2 fit analysis + V4 capability-based, all running simultaneously in different contexts. Pick one and commit."

4. **Hardcoded user data in production code.** "Why are your personal project URLs hardcoded in `resumeParsing.ts` and `openaiMaterials.ts`? This should be in the database."

5. **No tests.** "Zero unit tests. The validation/ folder has calibration datasets but no actual test runner integrated into `npm test`. For a portfolio project claiming 'benchmark-driven development,' this is a gap."

6. **Business logic in API routes.** "Your `ingest/route.ts` is doing URL fetching, parsing, scoring, database creation, and async fit analysis. That's a service, not a route."

7. **No caching anywhere.** "You've documented caching as a principle in 4 separate documents but implemented it nowhere. The same job description analyzed twice makes two separate LLM calls."

8. **JSON columns as untyped catch-alls.** "`evidenceInventory Json?`, `projectEvidence Json?`, `riskAreas Json?` — these are critical data and they have no type safety at the database level or the application level."

### Questions They Would Ask

1. "Walk me through the scoring pipeline for a discovered job. How many files do I need to read?"
2. "If I change how evidence matching works, what else breaks?"
3. "How do you know if a score change is a regression or an improvement?"
4. "What happens when two users ingest the same job?"
5. "How much does it cost to onboard a new user? What LLM calls are required?"
6. "Why are there two separate material generation systems?"
7. "How do you prevent prompt injection in the CI generator?"
8. "What's your plan for removing the hardcoded user data?"

### Particularly Strong Decisions

- **Capability taxonomy as a static data structure** — extensible, testable, embedding-ready
- **Separation of requirement extraction (LLM) from evidence matching (deterministic)** — clear boundary
- **Evidence-based materials** — grounding prevents hallucination
- **Export as pure transformation** — zero dependencies on business logic

### Decisions That Look Junior

- **1,368-line file with no decomposition** — a senior engineer would have split this months ago
- **`any` types in the most important data structures** — suggests rushing past type safety
- **Hardcoded personal data in production code** — suggests the codebase wasn't designed for multi-user from the start
- **No test suite** — the biggest gap for a portfolio project claiming engineering rigor

---

## Deliverable 9 — Refactor Recommendation

### Recommendation: **B — Small cleanup before Sprint 2**

### Justification

The architecture is fundamentally sound. The module boundaries are mostly correct. The capability system is well-designed. The documentation is exceptional. The problems are:

1. One god module (`openaiMaterials.ts`)
2. Duplicated types
3. Hardcoded user data
4. Missing shared types

These are targeted, low-risk fixes — not an architectural redesign. They don't change behavior. They don't change data flows. They prepare the codebase for the next 6 months without slowing down feature work.

### NOT Recommended

- **Option A (leave as-is):** `openaiMaterials.ts` will grow to 2,000+ lines. Technical debt compounds.
- **Option C (medium refactor):** Would include service layer extraction, scoring pipeline unification. Too much risk/effort before core features are stable.
- **Option D (large redesign):** Premature. The monolith works for Stage 1. Redesign at Stage 2.

### Recommended Cleanup Scope

| Change | Effort | Risk | Benefit |
|--------|--------|------|---------|
| Create `src/server/types/` with shared type definitions | 2 hours | Zero | Eliminates type duplication. Single source of truth. |
| Extract `PROJECT_METADATA` and `PROJECT_LINK_MAP` to a JSON file or DB seed | 1 hour | Low | Removes hardcoded user data. Prepares for multi-user. |
| Split `openaiMaterials.ts` into 3 files: `narrativeAnalysis.ts`, `promptBuilder.ts`, `openaiMaterialsGenerator.ts` | 3 hours | Low | Largest module becomes 3 focused modules. No behavior change. |
| Add `any` → proper types to `CandidateIntelligenceOutput` | 1 hour | Low | Type safety for the most important data structure. |
| Extract ingest orchestration from `ingest/route.ts` to `src/server/ingestService.ts` | 2 hours | Low | Route becomes a thin handler. Business logic is testable. |

**Total estimated effort: 9 hours (1 focused day)**  
**Risk: Low** — no behavior changes, no data model changes, no UI changes  
**Expected impact: High** — removes the top 5 criticisms a Senior Engineer would raise

---

## Deliverable 10 — Executive Summary

### Top 10 Strengths (ranked by impact)

1. **Exceptional documentation** — 18 documents covering architecture, contracts, principles, health, roadmap, and known issues
2. **Capability-based matching system** — well-designed, extensible, embedding-ready taxonomy with tiered matching
3. **Deterministic-first architecture** — clear separation of $0 deterministic operations from expensive LLM calls
4. **Evidence grounding** — hard principle that materials never fabricate experience
5. **System contracts** — documented inputs, outputs, guarantees, failure modes for every subsystem
6. **Acyclic dependency graph** — no circular dependencies anywhere in the codebase
7. **Graceful degradation** — template fallback for materials, heuristic fallback for scoring
8. **Clean pure functions** — capability mapper, taxonomy, evidence engine, export are all well-isolated
9. **Product vision clarity** — VISION.md + PRODUCT_EVOLUTION.md provide clear long-term direction
10. **Sprint discipline** — command budgets, OpenAI budgets, quality gates, sprint rules

### Top 10 Weaknesses (ranked by impact)

1. **`openaiMaterials.ts` god module** — 1,368 lines, 8+ responsibilities, hardest file to maintain
2. **No tests** — zero unit tests, no `npm test` script, validation/ exists but isn't integrated
3. **Hardcoded user data** — Santiago's project URLs and metadata baked into production scoring logic
4. **Three stacked scoring systems** — V1 heuristic + V2 fit analysis + V4 capability-based, no cleanup
5. **`any` types in critical paths** — CandidateIntelligence output, discovery scores, fit analysis conversion
6. **No caching** — every LLM call is fresh, score instability (KI-001), wasted cost
7. **Business logic in API routes** — ingest and generate-materials routes contain 150+ lines of orchestration
8. **Discovery scoring fake candidate profile** — hardcoded `yearsExperience: 3, location: 'Spain'` instead of real CI data
9. **Duplicated type definitions** — Profile, Resume, Job types defined independently in 2+ files
10. **No auth** — every query returns any user's data, blocks multi-user entirely

### Top 10 Highest ROI Improvements (ranked by effort/impact ratio)

1. **Create shared types** — 2 hours, eliminates duplication across 5+ files
2. **Extract hardcoded user data to config/DB** — 1 hour, removes the #1 multi-user blocker in code
3. **Split `openaiMaterials.ts`** — 3 hours, makes the largest file maintainable
4. **Type `CandidateIntelligenceOutput` properly** — 1 hour, type safety for the most important data structure
5. **Extract ingest service from route** — 2 hours, enables testing of the most complex workflow
6. **Add `npm test` with 5 basic scoring tests** — 3 hours, establishes testing culture
7. **Cache requirement extraction by job hash** — 4 hours, fixes KI-001 (score instability)
8. **Remove V2 fit analysis from discovery** — 2 hours, simplifies discovery scoring
9. **Wire discovery scoring to real CI data** — 4 hours, fixes DA-1 (fake candidate profile)
10. **Add structured error logging** — 2 hours, replaces console.log with traceable errors

### Top 10 Things That Should NOT Be Changed (ranked by importance)

1. **Capability taxonomy structure** — well-designed, embedding-ready, tested
2. **Evidence-based matching paradigm** — extract requirements → match evidence → score coverage
3. **Deterministic-first scoring principle** — scoring, classification, matching must stay deterministic
4. **Export as pure transformation** — zero dependencies on business logic
5. **Prisma + PostgreSQL** — mature, reliable, well-documented
6. **Next.js App Router structure** — follows conventions, works with Vercel
7. **System contracts documentation** — invaluable for maintaining correctness
8. **Sprint rules and operating philosophy** — prevents feature creep and cost overruns
9. **Provider adapter pattern** — Greenhouse/Lever/Ashby adapters are clean and extensible
10. **Fit Analysis V4 algorithm** — Model D scoring with gates is calibrated and working

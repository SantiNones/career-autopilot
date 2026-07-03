# Career Autopilot — Roadmap

Last updated: 2026-07-01  
Owner: Santiago Nones

---

## Sprint Status

| Sprint | Name | Status | Goal |
|--------|------|--------|------|
| 0 | Documentation & Engineering Foundation | ✅ In Progress | Single source of truth for all future development |
| 1 | Discovery Audit + Recommended Jobs Control | ⏳ Next | Stop bad recommendations; diagnose discovery |
| 2 | Pipeline UX + Ingest Reliability | 🔜 Planned | Make the application tracker usable |
| 3 | Materials V2 | 🔜 Planned | Make materials application-ready |
| 4 | Fit Stability + Evals | 🔜 Planned | Make scoring reliable and debuggable |
| 5 | Guided Onboarding | 🔜 Planned | Make product usable by someone other than Santiago |
| 6 | Polish / Launch | 🔜 Planned | Public demo and portfolio-ready |

---

## Sprint 0 — Documentation & Engineering Foundation

**Goal:** Give future engineers and AI agents a single source of truth.

**Deliverables:**

- [x] `/docs/product/SPEC.md` — Full product spec and engineering roadmap
- [x] `/docs/architecture/ARCHITECTURE.md` — System architecture, data flows, module classification
- [x] `/docs/architecture/DEPENDENCY_MAPS.md` — Subsystem responsibilities and dependencies
- [x] `/docs/architecture/SYSTEM_CONTRACTS.md` — Inputs, outputs, guarantees, invariants
- [x] `/docs/product/PRODUCT_HEALTH.md` — Subsystem health scores
- [x] `/docs/engineering/BENCHMARK_STRATEGY.md` — Benchmark philosophy and folder structure
- [x] `/docs/engineering/CI_PLAN.md` — Lightweight CI pipeline proposal
- [x] `/docs/engineering/ROADMAP.md` — This file
- [x] `/docs/engineering/KNOWN_ISSUES.md` — Confirmed bugs and technical debt
- [x] `/docs/engineering/SPRINT_RULES.md` — Operating rules for development

**OpenAI Cost:** $0  
**Behavior Changes:** None

---

## Sprint 1 — Discovery Audit + Recommended Jobs Control

**Goal:** Stop bad recommendations from damaging trust and diagnose discovery quality.

**Deliverables:**

- [ ] Discovery audit script
- [ ] Provider distribution report
- [ ] Company distribution report
- [ ] Geography distribution report
- [ ] Seniority distribution report
- [ ] Recommendation quality assessment
- [ ] Persistent toggle: hide/show Recommended Jobs
- [ ] User setting: `showRecommendedJobs: boolean`
- [ ] Optional: hide by default if quality threshold fails

**OpenAI Cost:** $0  
**Behavior Changes:** Toggle to hide recommended jobs section

---

## Sprint 2 — Pipeline UX + Ingest Reliability

**Goal:** Make the application tracker usable for daily job searching.

**Deliverables:**

- [ ] Status filters on job table
- [ ] Text search on job table
- [ ] Column sorting on job table
- [ ] Fix or reframe manual ingest (Option B: manual-first)
- [ ] Fix bulk ingest per-entry UI feedback
- [ ] Per-entry ingest validation
- [ ] Clear failure states
- [ ] Job quality validation (minimum text length, title confidence)

**OpenAI Cost:** $0  
**Behavior Changes:** Improved job table + ingest UX

---

## Sprint 3 — Materials V2

**Goal:** Make generated materials actually application-ready.

**Deliverables:**

- [ ] Editable CV (inline editor)
- [ ] Editable cover letter
- [ ] Editable recruiter message
- [ ] Editable screening answers
- [ ] Save edited material
- [ ] Export edited version (DOCX/PDF)
- [ ] Project Selection Engine
- [ ] Evidence-first generation constraints
- [ ] No-invention enforcement
- [ ] Material quality eval set
- [ ] Material versioning (generated → edited → exported → submitted)

**OpenAI Cost:** Low/medium (budgeted)  
**Behavior Changes:** Full material editing workflow

---

## Sprint 4 — Fit Stability + Evals

**Goal:** Make scoring reliable and debuggable.

**Deliverables:**

- [ ] Scoring version field in schema
- [ ] Input hash (jobDescriptionHash + candidateProfileHash)
- [ ] Candidate profile snapshot at analysis time
- [ ] Reanalysis diff (show previous vs new score)
- [ ] Benchmark jobs with expected score ranges
- [ ] Automated eval runner in CI
- [ ] Regression tests for known jobs
- [ ] Score consistency tests
- [ ] Cache requirement extraction results

**OpenAI Cost:** Low (deterministic-first)  
**Behavior Changes:** Score stability + reanalysis explanation

---

## Sprint 5 — Guided Onboarding

**Goal:** Make product usable by someone other than Santiago.

**Deliverables:**

- [ ] Profile setup wizard (multi-step)
- [ ] CV upload step
- [ ] Career goals collection
- [ ] Role family selection
- [ ] Location preferences
- [ ] Roles to avoid
- [ ] Candidate Intelligence generation (one-time)
- [ ] Usage/cost display
- [ ] Progressive disclosure

**OpenAI Cost:** Medium (one-time per user)  
**Behavior Changes:** New user onboarding flow

---

## Sprint 6 — Polish / Launch

**Goal:** Make it portfolio-ready and impressive for demos.

**Deliverables:**

- [ ] README rewrite
- [ ] Loom demo video
- [ ] Case study document
- [ ] GitHub cleanup
- [ ] Landing page
- [ ] LinkedIn post
- [ ] Public demo data (safe/anonymized)
- [ ] Error state polish
- [ ] Responsive UX
- [ ] Dark/night mode
- [ ] Performance optimization

**OpenAI Cost:** Minimal  
**Behavior Changes:** Visual polish + public presentation

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-07-01 | Start with Sprint 0 (docs) not Sprint 1 (features) | Need architectural clarity before implementing changes |
| 2026-07-01 | Manual-first ingestion (Option B) over URL fixing | Job boards block scraping; paste is more reliable |
| 2026-07-01 | No deployment automation in CI plan | Vercel handles deploys; CI focuses on quality gates |
| 2026-07-01 | Benchmark-driven development as permanent principle | Calibration simulation proved the value |

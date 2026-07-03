# Career Autopilot — Product Health Dashboard

Last updated: 2026-07-01  
Owner: Santiago Nones

Evaluation of every major subsystem's production readiness, quality, and technical debt.

---

## Health Summary

| System | Score | Trend | Notes |
|--------|-------|-------|-------|
| Discovery | 5/10 | → | Quality is weak; architecture is solid; classifiers work but sources are limited |
| Fit Analysis | 7.5/10 | ↑ | V4 architecture is strong; LLM requirement extraction introduces instability |
| Candidate Intelligence | 8/10 | → | Good foundation; evidence inventory is well-structured; needs caching |
| Materials Generation | 6/10 | → | Good generation quality; missing editing, versioning, and caching |
| Application Tracking | 8/10 | → | Solid Kanban + status controls; needs filters and search |
| Export | 7/10 | → | PDF + DOCX work well for CV/Cover Letter; missing Recruiter/Screening export |
| Job Ingestion | 6.5/10 | → | Works for pasted text; URL parsing unreliable; bulk ingest needs UI feedback |
| Profile / Resume | 8/10 | → | Complete form; resume upload works; career goals well-modeled |
| Evidence Engine | 8/10 | → | Strong capability taxonomy; tiered matching is well-designed |
| UX / UI | 4/10 | → | Functional but rough; no dark mode; no search/filter on tables; not responsive |
| Testing / Benchmarks | 5/10 | → | Validation datasets exist but no CI integration; no automated regression |
| Documentation | 3/10 | ↑ | Sprint 0 is addressing this; was nearly zero before |
| Cost Control | 3/10 | → | No caching, no budget enforcement, no per-user tracking |
| Observability | 4/10 | → | Console logs exist; no structured logging; no error tracking |

---

## Detailed Assessments

### Discovery (5/10)

**Strengths:**
- Three providers (Greenhouse, Lever, Ashby) working
- Deterministic scoring pipeline (no LLM)
- Location/seniority/role classifiers are well-built
- Composite scoring with V2 fit analysis

**Weaknesses:**
- Recommended job quality is poor (too many irrelevant results)
- Over-concentration on certain companies (Mistral AI)
- No geographic diversity (Barcelona/Spain underrepresented)
- No quality threshold gate
- No user toggle to hide recommendations
- No discovery audit has been run to diagnose root cause

**Priority Fix:** Run Discovery Audit (Sprint 1) to determine if the problem is sources, ranking, or search strategy.

---

### Fit Analysis (7.5/10)

**Strengths:**
- V4 capability-based architecture is production-quality
- Model D scoring validated via calibration simulation
- Seniority gates and critical gap caps prevent over-scoring
- Evidence-based matching is transparent and explainable
- Deterministic extractor exists as fallback

**Weaknesses:**
- Requirement extraction uses LLM → non-deterministic → score instability
- No input hashing → can't detect when inputs actually changed
- No scoring version tracking
- No reanalysis diff (user can't see why score changed)
- No caching of LLM requirement extraction results

**Priority Fix:** Make requirement extraction cacheable by input hash; add scoring version field.

---

### Candidate Intelligence (8/10)

**Strengths:**
- Structured output model is comprehensive
- Evidence inventory feeds directly into V4 fit analysis
- Career goals properly influence the model
- Seniority calibration instructions prevent over-estimation

**Weaknesses:**
- No caching (regeneration always costs money)
- No version tracking
- No diff between regenerations
- User can't see what changed

**Priority Fix:** Cache CI results; add version field; track generation cost.

---

### Materials Generation (6/10)

**Strengths:**
- Generates all 4 material types in one call
- Uses full context (fit analysis + positioning + resume + preferences)
- Export to PDF/DOCX works for CV and Cover Letter

**Weaknesses:**
- No inline editing
- No versioning beyond DRAFT/REVIEWED
- No caching (re-generates from scratch each time)
- Project selection can be weak
- Recruiter Message and Screening Answers can't be exported
- No "no-invention" enforcement beyond prompt instructions

**Priority Fix:** Add material editor; add version tracking; implement project selection engine.

---

### Application Tracking (8/10)

**Strengths:**
- Clear status taxonomy (7 statuses)
- Kanban board provides good visual overview
- Status changes are instant (single DB update)
- Metrics calculation is clean and tested

**Weaknesses:**
- No filters on dashboard job table
- No search
- No sorting
- No bulk actions
- SKIP status exists in JobLabel but not in ApplicationStatus (inconsistency)

**Priority Fix:** Add filters/search/sort to job table (Sprint 2).

---

### Export (7/10)

**Strengths:**
- PDF generation with proper formatting (headers, bullets, links)
- DOCX generation with real hyperlinks and professional layout
- Smart content parsing (sections, bullets, link bars)
- Clean filename builder

**Weaknesses:**
- Only supports CV and Cover Letter
- No export for Recruiter Message or Screening Answers
- No "export edited version" (exports generated content only)

**Priority Fix:** Add export for all material types; support edited content export.

---

### Job Ingestion (6.5/10)

**Strengths:**
- URL + pasted text both supported
- Smart threshold (≥200 chars → treat as description)
- Deduplication by sourceUrl
- "Needs description" fallback for blocked URLs
- Validation against non-job domains

**Weaknesses:**
- URL fetching is frequently blocked by job boards
- Bulk ingest provides no per-item UI feedback
- "Needs manual description" title persists after updating description
- No minimum quality validation before creating records

**Priority Fix:** Reframe as manual-first (Option B from SPEC); fix bulk ingest UI.

---

### Profile / Resume (8/10)

**Strengths:**
- Complete profile form with all career goal fields
- Resume upload supports PDF + DOCX
- Experience Intelligence panel with structured insights
- Career goals properly modeled in schema

**Weaknesses:**
- No guided onboarding wizard
- Form is large and manual
- No progressive disclosure
- Candidate Intelligence panel missing from existing-user profile page (bug)

**Priority Fix:** Fix CI panel rendering bug; add onboarding flow (Sprint 5).

---

### Evidence Engine (8/10)

**Strengths:**
- Capability taxonomy is comprehensive (16,986 bytes of definitions)
- Tiered matching (exact > capability > adjacent > none)
- Evidence mapper properly links resume content to capabilities
- Enrichment layer adds depth

**Weaknesses:**
- Tightly coupled to CI generation (can't be run independently)
- No way to manually add evidence
- No evidence quality metrics

**Priority Fix:** Minor — system works well. Could benefit from independent testing.

---

### UX / UI (4/10)

**Strengths:**
- Clean, minimal design with TailwindCSS
- Consistent color scheme and spacing
- Score badges are informative
- Kanban board is intuitive

**Weaknesses:**
- No dark/night mode
- No responsive design for mobile
- Job table has no filters, search, or sort
- Recommended jobs section can't be hidden
- Material display is read-only
- No loading states for some async operations
- Navigation is minimal (3 pages only)

**Priority Fix:** Add table filters/search (Sprint 2); dark mode (Sprint 6).

---

### Testing / Benchmarks (5/10)

**Strengths:**
- Validation datasets exist (V1 and V2)
- Calibration simulation was run and documented
- Capability benchmark exists
- Validation runners exist

**Weaknesses:**
- No CI integration (tests don't run automatically)
- No regression test suite
- `scripts/` directory is empty
- No deterministic test fixtures
- Benchmarks require manual execution

**Priority Fix:** Define benchmark folder structure; add lightweight CI (this sprint).

---

### Documentation (3/10 → improving)

**Before Sprint 0:**
- Only `docs/product/PROJECT_CONTEXT.md` and two benchmark reports
- No architecture documentation
- No contracts or dependency maps
- No known issues tracking

**After Sprint 0:**
- SPEC.md ✓
- ARCHITECTURE.md ✓
- DEPENDENCY_MAPS.md ✓
- SYSTEM_CONTRACTS.md ✓
- PRODUCT_HEALTH.md ✓ (this file)
- + remaining Sprint 0 docs

**Priority:** Complete Sprint 0 documentation.

---

### Cost Control (3/10)

**Strengths:**
- Operating principles call for caching and limits
- Most scoring is deterministic (no LLM cost)
- LLM calls are user-triggered (not automatic)

**Weaknesses:**
- No caching for any LLM results
- No token/cost logging to database
- No per-user budget enforcement
- No cost visibility in UI
- Regeneration has no safeguards

**Priority Fix:** Add cost logging; cache CI and fit analysis results.

---

### Observability (4/10)

**Strengths:**
- Console logs exist throughout server code
- Error messages are usually propagated to the user
- AutomationRun/Log models exist in schema (for future use)

**Weaknesses:**
- No structured logging
- No error tracking (Sentry, etc.)
- No performance monitoring
- No API request logging
- AutomationRun/Log models are unused

**Priority Fix:** Low priority for MVP. Address in Sprint 6.

---

## Where Future Work Creates Most Value

Ranked by impact-to-effort ratio:

1. **Pipeline UX (filters/search/sort)** — High impact, low effort, $0 cost
2. **Hide/Show Recommended Jobs** — Quick trust fix, $0 cost
3. **Discovery Audit** — Diagnoses the #1 quality problem, $0 cost
4. **Material Editor** — Unlocks the export-and-apply workflow
5. **Fit Analysis Caching** — Reduces cost and improves stability
6. **Cost Logging** — Enables budget decisions
7. **CI Pipeline** — Prevents regressions permanently
8. **Dark Mode** — High perceived quality improvement, moderate effort

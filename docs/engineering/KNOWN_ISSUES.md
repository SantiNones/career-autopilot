# Career Autopilot — Known Issues

Last updated: 2026-07-01  
Owner: Santiago Nones

---

## Critical (affects core functionality)

### KI-001: Fit score instability due to LLM requirement extraction

**Location:** `src/server/fitAnalysis/fitAnalysisV3.ts` → `extractRequirements()`  
**Symptom:** Same job description can produce different scores on re-analysis.  
**Root Cause:** Requirement extraction uses OpenAI (non-deterministic). Different requirements → different V4 scores.  
**Impact:** Users lose trust when scores change without obvious reason.  
**Fix:** Cache requirement extraction by job description hash. Add scoring version tracking.  
**Sprint:** 4

---

### KI-002: No input hashing or scoring version

**Location:** `src/server/fitAnalysis/fitAnalysisV4.ts`, `prisma/schema.prisma`  
**Symptom:** Can't determine why a score changed or which inputs differed.  
**Root Cause:** No `scoringVersion`, `jobDescriptionHash`, or `candidateProfileHash` fields exist.  
**Impact:** Score changes are unexplainable. Debugging requires manual comparison.  
**Fix:** Add hash fields + scoring version to FitAnalysis and JobEvaluation models.  
**Sprint:** 4

---

## High (affects user experience significantly)

### KI-003: Recommended jobs quality is poor

**Location:** `src/server/jobDiscovery/discoveryService.ts`  
**Symptom:** Too many irrelevant jobs; Mistral AI over-represented; many jobs score 100 inappropriately.  
**Root Cause:** Unknown until Discovery Audit is run. Likely: limited company sources + scoring calibration issues.  
**Impact:** Recommended Jobs section damages product trust.  
**Fix:** Run Discovery Audit (Sprint 1); add hide/show toggle immediately.  
**Sprint:** 1

---

### KI-004: CandidateIntelligencePanel missing from existing-user profile page

**Location:** `src/app/profile/page.tsx` lines 154-226  
**Symptom:** Existing users don't see the Candidate Intelligence panel on their profile page.  
**Root Cause:** The component is rendered in the fresh-user branch (lines 140-148) but not in the existing-user branch.  
**Impact:** Users can't regenerate Candidate Intelligence after initial setup.  
**Fix:** Add `<CandidateIntelligencePanel />` to the existing-user branch.  
**Sprint:** 1 or 2

---

### KI-005: URL ingestion frequently fails

**Location:** `src/app/api/jobs/ingest/route.ts` lines 70-114  
**Symptom:** Most job board URLs are blocked (LinkedIn, Indeed, Glassdoor all block scraping).  
**Root Cause:** `fetch()` with browser UA is blocked by most job boards. No JavaScript rendering.  
**Impact:** Users expect URL paste to work but it creates "Needs manual description" records.  
**Fix:** Reframe as manual-first (SPEC Option B). URL becomes optional metadata.  
**Sprint:** 2

---

### KI-006: "Needs manual job description" title persists

**Location:** `src/app/api/jobs/ingest/route.ts` line 83  
**Symptom:** After user updates the job description via UpdateDescriptionForm, the title may still say "Needs manual job description".  
**Root Cause:** Title is set during ingest. UpdateDescriptionForm updates rawText but may not update title.  
**Impact:** Job table shows unhelpful titles for URL-ingested jobs.  
**Fix:** When description is updated, re-extract title from first line if title is still the default.  
**Sprint:** 2

---

### KI-007: No hide/show toggle for Recommended Jobs

**Location:** `src/app/page.tsx`, `src/components/RecommendedJobsSection.tsx`  
**Symptom:** Users cannot hide the Recommended Jobs section even when recommendations are poor.  
**Root Cause:** No `showRecommendedJobs` setting exists in the schema or UI.  
**Impact:** Poor recommendations are always visible, damaging trust.  
**Fix:** Add persistent setting + UI toggle.  
**Sprint:** 1

---

## Medium (affects usability)

### KI-008: Job table has no filters, search, or sort

**Location:** `src/app/page.tsx` lines 148-183  
**Symptom:** Users can't filter by status, search by title/company, or sort columns.  
**Root Cause:** Table is a simple static render of all jobs ordered by createdAt desc.  
**Impact:** Finding specific jobs becomes difficult as the list grows.  
**Fix:** Add filter bar, search input, and sortable column headers.  
**Sprint:** 2

---

### KI-009: Bulk ingest has no per-item UI feedback

**Location:** `src/components/BulkIngestForm.tsx`  
**Symptom:** User submits multiple items but only sees overall success/failure.  
**Root Cause:** API returns per-item results but the component doesn't display them.  
**Impact:** Users don't know which items succeeded or failed.  
**Fix:** Parse API response and show per-item result (success/deduped/failed/needs-review).  
**Sprint:** 2

---

### KI-010: Materials are read-only (no editing)

**Location:** `src/components/MaterialsSection.tsx`  
**Symptom:** Users can view and copy/export materials but cannot edit them in the UI.  
**Root Cause:** No editor component exists. Materials are displayed as formatted text.  
**Impact:** Users must edit externally, losing the integrated workflow.  
**Fix:** Add inline material editor with save functionality.  
**Sprint:** 3

---

### KI-011: MaterialStatus enum too limited

**Location:** `prisma/schema.prisma` line 352-354  
**Symptom:** Only DRAFT and REVIEWED states exist.  
**Root Cause:** Schema was designed before versioning requirements were defined.  
**Impact:** Can't track material lifecycle (generated → edited → exported → submitted).  
**Fix:** Expand enum: GENERATED, EDITED, EXPORTED, SUBMITTED.  
**Sprint:** 3

---

### KI-012: Export only supports CV and Cover Letter

**Location:** `src/app/api/export/`  
**Symptom:** Recruiter Message and Screening Answers have no export endpoints.  
**Root Cause:** Export routes were only built for the two longest document types.  
**Impact:** Users can only export 2 of 4 material types.  
**Fix:** Add export endpoints for all material types.  
**Sprint:** 3

---

### KI-013: SKIP not in ApplicationStatus enum

**Location:** `prisma/schema.prisma` line 322-331  
**Symptom:** Discovery scoring can produce `finalVerdict: "SKIP"` but ApplicationStatus doesn't include SKIP.  
**Root Cause:** ApplicationStatus was defined separately from JobLabel.  
**Impact:** Potential inconsistency if SKIP verdict is used to set application status.  
**Fix:** Verify SKIP is properly handled in status mapping. The ingest route maps APPLY_STRETCH→APPLY but doesn't explicitly handle SKIP mapping.  
**Sprint:** 2

---

## Low (cosmetic or deferred)

### KI-014: No dark/night mode

**Location:** `src/app/globals.css`  
**Symptom:** App is always light theme.  
**Root Cause:** No theme system implemented.  
**Impact:** Cosmetic; affects evening usage.  
**Fix:** Add theme toggle + dark variant classes.  
**Sprint:** 6

---

### KI-015: No LLM cost tracking or caching

**Location:** Throughout `src/server/`  
**Symptom:** Every LLM call is made fresh. No cost visibility.  
**Root Cause:** No caching layer or cost logging was implemented.  
**Impact:** Unnecessary API spend; no way to budget or audit costs.  
**Fix:** Add token/cost logging to DB; cache CI and fit analysis results by input hash.  
**Sprint:** 4

---

### KI-016: Empty scripts/ and analyze/ directories

**Location:** `/scripts/`, `/analyze/`  
**Symptom:** Directories exist but contain no files.  
**Root Cause:** Created for future use, never populated.  
**Impact:** Confusing for new contributors.  
**Fix:** Either populate with discovery audit script or remove.  
**Sprint:** 1

---

### KI-017: No structured logging

**Location:** Throughout codebase  
**Symptom:** Only `console.log()` statements exist for observability.  
**Root Cause:** No logging framework integrated.  
**Impact:** Difficult to debug production issues; no log aggregation.  
**Fix:** Low priority for MVP. Consider structured logging in Sprint 6.  
**Sprint:** 6

---

### KI-018: AutomationRun/AutomationLog models unused

**Location:** `prisma/schema.prisma` lines 227-245  
**Symptom:** Models exist in schema but are never written to by application code.  
**Root Cause:** Defined for future automation tracking but never integrated.  
**Impact:** Schema bloat; potential confusion.  
**Fix:** Either integrate into discovery/CI flows or document as "reserved for future use".  
**Sprint:** Deferred

---

## Issue Template

When adding new issues, use this format:

```markdown
### KI-XXX: [Short description]

**Location:** [File path and line numbers]  
**Symptom:** [What the user sees]  
**Root Cause:** [Why it happens]  
**Impact:** [How bad is it]  
**Fix:** [Proposed solution]  
**Sprint:** [When to fix]
```

---

## See Also

- **[ROADMAP.md](ROADMAP.md)** — Sprint priorities for fixes
- **[../product/PRODUCT_HEALTH.md](../product/PRODUCT_HEALTH.md)** — Subsystem health scores
- **[../reports/SPRINT_1_ARCHITECTURE_AUDIT.md](../reports/SPRINT_1_ARCHITECTURE_AUDIT.md)** — Technical debt analysis

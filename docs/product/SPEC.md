# Career Autopilot — Product Spec & Engineering Roadmap

Last updated: 2026-07-01  
Owner: Santiago Nones  
Primary goal: make Career Autopilot a serious product for job discovery, ranking, application material generation, and application tracking.

---

## 0. Operating Principles

Career Autopilot should follow these principles permanently:

```text
Cheap deterministic systems for scale
+
AI only for high-value moments
+
strict usage limits
+
cache everywhere
```

This means:

- Do not use LLM calls for every discovered job unless explicitly approved.
- Prefer deterministic parsing, scoring, filtering, caching, and validation.
- Use AI mainly for high-value moments: candidate intelligence, material generation, positioning strategy, and selected job analysis.
- Every expensive operation should have caching, logs, and visible failure states.
- Avoid feature creep until the core loop works reliably.

---

## 1. Product Vision

Career Autopilot should be a candidate-centric career operating system.

Its essential V1 purpose is:

1. Find relevant jobs.
2. Rank and explain job fit.
3. Generate high-quality application materials.
4. Track applications and outcomes.

Future expansion:

5. Recommend career next steps.
6. Suggest projects, skills, and learning paths.
7. Improve long-term career direction.

Non-essential future features should not distract from V1.

---

## 2. Current Live Product Snapshot

Public URL: https://career-autopilot-drab.vercel.app/

Observed current live behavior:

- Dashboard exists.
- Pipeline exists.
- Profile exists.
- Recommended Jobs exist.
- Manual job ingestion exists.
- Bulk ingest exists.
- Job postings table exists.
- Current dashboard tracks total jobs, to apply, maybe, applied, interviews, offers, interview rate, and offer rate.
- Recommended jobs are currently public jobs discovered from Greenhouse, Lever, and Ashby.
- The live app currently shows 50 recommended jobs.
- The current recommended jobs are low quality and overly concentrated around Mistral AI.
- Many recommended jobs show score 100, despite not being strong practical opportunities.
- Manual job table contains more useful real applications than recommended jobs.

Current live issue examples:

- Recommended jobs show Mistral AI repeatedly.
- Some jobs outside target geographies appear as high-scoring.
- Recommended jobs sometimes show senior, SRE, or specialized roles that should not be prioritized.
- Job postings table lacks enough filtering by status.
- Normal and bulk link ingestion are unreliable.
- Fit scores can be inconsistent after reanalysis or simple title changes.
- The UI/UX is functional but still rough.
- There is no dark/night mode.
- There is no way to hide or lock the Recommended Jobs display.

---

## 3. Current Core Features

### 3.1 Dashboard

Current capabilities:

- Shows metrics:
  - Total Jobs
  - To Apply
  - Maybe
  - Applied
  - Interviews
  - Offers
  - Interview rate
  - Offer rate

Needs improvement:

- Better metric definitions.
- Better visual hierarchy.
- Better status filtering.
- Better dashboard segmentation:
  - Pipeline
  - Recommended Jobs
  - Application performance
  - Materials status
  - Next actions

---

### 3.2 Recommended Jobs

Current capabilities:

- Discover jobs from provider-based public job sources.
- Show recommended jobs with score, label, location, seniority, source, and create-job action.

Current providers observed:

- Greenhouse
- Lever
- Ashby

Known problems:

- Recommended jobs quality is currently poor.
- Too many recommendations are irrelevant.
- Too many recommendations come from the same companies.
- Too many jobs are shown as high-score.
- Barcelona / Spain / junior / early-career roles are underrepresented.
- There is no user-facing way to hide or lock the Recommended Jobs section.
- Discovery score and fit score separation may still not be clear enough.
- Recommended job display can damage product trust when recommendations are bad.

Requirements:

- Add ability to hide Recommended Jobs from dashboard.
- Add persistent setting: `showRecommendedJobs: boolean`.
- Add user-facing toggle: Show Recommended Jobs / Hide Recommended Jobs.
- Default may remain visible for now, but user should be able to hide it.
- Long-term: recommended jobs should only show when quality threshold is met.

---

### 3.3 Manual Job Ingestion

Current capabilities:

- Add one job using URL.
- Paste job description manually.
- If automated parsing fails, a job record is still created.

Known problems:

- URL ingestion often does not work.
- Bulk ingest and normal ingest may not parse links reliably.
- Some job titles become "About the job" or raw description fragments.
- Link parsing should be either fixed or removed/reframed.

Decision needed:

Option A — Fix URL ingestion:
- Use a deterministic fetch strategy.
- Fail visibly when blocked.
- Store source URL.
- Ask user to paste job description manually if blocked.

Option B — Reframe as manual-first:
- Primary input becomes job description paste.
- URL field becomes optional metadata.
- Copy text: "Most job boards block automated reading. Paste the full job description for best results."

Recommended:
- Do Option B first.
- Do not spend too much engineering time scraping LinkedIn or blocked boards right now.

---

### 3.4 Bulk Ingest

Current capabilities:

- Paste multiple URLs or descriptions separated by blank line.

Known problems:

- Unreliable.
- Ambiguous whether user pasted URLs or descriptions.
- Failure states are unclear.

Requirements:

- Split each entry deterministically.
- For each entry detect:
  - URL
  - raw job description
  - invalid/too short
- Show per-entry result:
  - success
  - needs manual review
  - failed
- Do not silently create low-quality job records.
- Add validation:
  - minimum text length
  - title extraction confidence
  - company extraction confidence

---

### 3.5 Job Postings Table / Pipeline

Current capabilities:

- Shows jobs with score, AI label, status, role, source, added date, delete action.
- User can track jobs through statuses.

Known problems:

- Needs filters by status.
- Needs sorting.
- Needs search.
- Needs clearer status taxonomy.
- Needs better next action visibility.

Required filters:

- All
- To Apply
- Maybe
- Applied
- Interview
- Rejected
- Skipped
- Materials Ready
- No Materials
- High Fit
- Needs Review

Required sorting:

- Added date
- Fit score
- Status
- Company
- Role
- Materials ready

---

### 3.6 Fit Analysis

Current capabilities:

- Has gone through several generations:
  - V2/V3 scoring
  - Candidate Intelligence
  - Evidence Engine
  - Capability Mapping
  - V4 capability-based fit analysis

Known problems:

- Fit inconsistency remains.
- Score can change after reanalysis.
- Score can change after editing title, even when core job description is the same.
- Some positions appear over-scored or under-scored.
- Reanalysis behavior needs determinism and traceability.

Requirements:

- Fit score should primarily depend on:
  - job description
  - candidate intelligence snapshot
  - evidence inventory snapshot
  - scoring version
- Fit score should not materially change because of tiny title edits unless title is the only available data.
- Store scoring version.
- Store input hash:
  - jobDescriptionHash
  - candidateProfileHash
  - scoringVersion
- Add explanation for why score changed and which inputs changed.
- Reanalysis should show previous score, new score, changed requirements, and changed evidence matches.
- Add deterministic tests for known benchmark jobs.

---

### 3.7 Materials Generation

Current capabilities:

- Generates CVs, cover letters, recruiter messages, screening answers.
- Some materials are useful.
- Current quality is inconsistent.
- Project selection can be weak.
- CVs can miss key projects like OpsGuard or WhatsApp Agent for relevant roles.
- Project bullets can be too generic.

Requirements for Materials V2:

- Evidence-first generation.
- Project Selection Engine.
- Role-specific project ranking.
- Strong constraints against inventing experience.
- Editable materials.
- Export to DOCX and PDF after editing.
- Versioning:
  - generated draft
  - edited draft
  - exported version
- Store per-material status:
  - generated
  - edited
  - exported
  - submitted

Required material editor:

- Editable CV text.
- Editable cover letter.
- Editable recruiter message.
- Editable screening answers.
- Save changes.
- Export edited version.

---

### 3.8 Profile / Candidate Intelligence

Current capabilities:

- Profile fields exist.
- Experience Intelligence exists.
- Candidate Intelligence exists.
- Career goals exist.
- Target role families exist.
- Stepping stone roles exist.
- Roles to avoid exist.

Known requirements:

- New users need guided onboarding.
- Current profile form is too manual.
- Candidate Intelligence must be easy to regenerate but not expensive.
- Career goals should strongly affect discovery and ranking.

Important current profile targets for Santiago:

Primary Career Goal:
- Become an AI-focused Engineer

Secondary Career Goals:
- Become a Forward Deployed Engineer
- Build AI products used in production
- Develop expertise in AI agents and LLM systems
- Become a Technical Product Builder
- Launch a successful SaaS product
- Work in a high-growth startup environment

Target Role Families:
- ai_engineering
- forward_deployed_engineering
- solutions_engineering
- fullstack_engineering
- ai_automation
- agent_engineering
- platform_engineering
- developer_tools
- technical_consulting
- applied_ai

Acceptable Stepping Stone Roles:
- software_engineer
- fullstack_developer
- ai_deployment_strategist
- implementation_engineer
- technical_consultant
- solutions_consultant
- customer_engineer
- integration_engineer
- platform_engineer
- internal_tools_engineer

Roles to Avoid:
- technical_support
- helpdesk
- it_support
- customer_support
- content_moderation
- qa_tester
- manual_tester
- sales_development_representative
- recruiter
- data_entry

---

## 4. Desired V1 Product Loop

The core loop should work like this:

```text
User uploads profile / CV
↓
Career Autopilot builds Candidate Intelligence
↓
User adds or discovers jobs
↓
System ranks jobs by fit and strategy
↓
User chooses jobs to pursue
↓
System generates tailored materials
↓
User edits materials
↓
User exports / applies
↓
User tracks status
↓
System learns from outcomes
```

Everything outside this loop is secondary.

---

## 5. Main Product Problems To Solve Next

### Problem 1 — Discovery Quality

Current discovery quality is poor.

Symptoms:
- Too many irrelevant recommended jobs.
- Too many repeated companies.
- Too few Barcelona / Spain / junior / early-career opportunities.
- Too many Mistral-heavy results.
- Recommended Jobs can damage trust.

What to do first:
- Run Discovery Audit before building new discovery features.

Discovery Audit should answer:
1. Which providers currently exist?
2. Which providers are active?
3. How many companies are registered?
4. How many jobs exist in RecommendedJob?
5. How many jobs come from each provider?
6. How many jobs come from each company?
7. How many jobs are Spain / Barcelona / Remote Europe?
8. How many jobs are Junior / Mid / Senior / Staff / Principal / Leadership?
9. How many top 50 recommended jobs are APPLY / APPLY_STRETCH / MAYBE / SKIP?
10. Is the problem sources, ranking, search strategy, or all three?

No implementation before this audit.

---

### Problem 2 — Application Pipeline Usability

Need:
- Status filters.
- Search.
- Sort.
- Better table UX.
- Bulk actions.
- Clear next actions.
- Hide/show recommended jobs.

---

### Problem 3 — Material Generation Quality

Need:
- Evidence-first generation.
- Editable materials.
- Project ranking.
- Better role-specific output.
- Export from edited version.
- No hallucination.

---

### Problem 4 — Fit Analysis Stability

Need:
- Deterministic input hashing.
- Versioned scoring.
- Reanalysis diff.
- Regression tests.
- Benchmark suite.

---

### Problem 5 — Onboarding

Need:
- Guided user setup.
- Smart defaults.
- Clear career goal collection.
- One-time candidate intelligence generation.
- Cost-controlled regeneration.

---

### Problem 6 — Cost / Scalability

Need:
- LLM usage tracking.
- Token/cost logging.
- Cache all AI results.
- Manual regeneration only for expensive workflows.
- Never use AI per job at scale unless explicitly approved.

---

## 6. Recommended Sprint Order

### Sprint 0 — Documentation & Stabilization

Goal:
Give Devin and future agents a single source of truth.

Deliverables:
- Create `/docs/product/SPEC.md` 
- Create `/docs/architecture/ARCHITECTURE.md` 
- Create `/docs/engineering/ROADMAP.md` 
- Create `/docs/engineering/KNOWN_ISSUES.md` 
- Add current feature map.
- Add current data flow.
- Add known bugs.
- Add sprint operating rules.

No major feature work.

---

### Sprint 1 — Discovery Audit + Recommended Jobs Control

Goal:
Stop bad recommendations from damaging trust and diagnose discovery.

Deliverables:
- Discovery audit script/report.
- Provider distribution.
- Company distribution.
- Geography distribution.
- Seniority distribution.
- Recommendation quality report.
- Persistent toggle to hide/show Recommended Jobs.
- Optional: hide Recommended Jobs by default if quality threshold fails.

Expected OpenAI cost: $0

---

### Sprint 2 — Pipeline UX + Ingest Reliability

Goal:
Make the application tracker usable.

Deliverables:
- Status filters.
- Search.
- Sorting.
- Fix or reframe manual ingest.
- Fix bulk ingest.
- Per-entry ingest validation.
- Clear failure states.
- Job quality validation.

Expected OpenAI cost: $0

---

### Sprint 3 — Materials V2

Goal:
Make generated materials actually application-ready.

Deliverables:
- Editable CV.
- Editable cover letter.
- Editable recruiter message.
- Editable screening answers.
- Save edited material.
- Export edited DOCX/PDF.
- Project Selection Engine.
- Evidence-first generation.
- No-invention constraints.
- Material quality eval set.

Expected OpenAI cost: low/medium, but must be budgeted.

---

### Sprint 4 — Fit Stability + Evals

Goal:
Make scoring reliable and debuggable.

Deliverables:
- Scoring version.
- Input hash.
- Candidate profile snapshot.
- Reanalysis diff.
- Benchmark jobs.
- Eval runner.
- Regression tests.
- Score consistency tests.

Expected OpenAI cost: low if deterministic-first.

---

### Sprint 5 — Guided Onboarding

Goal:
Make product usable by someone other than Santiago.

Deliverables:
- Profile setup wizard.
- CV upload.
- Career goals.
- Role family selection.
- Location preferences.
- Roles to avoid.
- Candidate Intelligence generation.
- Usage/cost display.

Expected OpenAI cost: medium but one-time per user.

---

### Sprint 6 — Polish / Launch

Goal:
Make it impressive for recruiters and usable as a public demo.

Deliverables:
- README.
- Loom demo.
- Case study.
- GitHub cleanup.
- Landing page.
- LinkedIn post.
- Public demo data.
- Error state polish.
- Responsive UX.
- Dark/night mode.

---

## 7. Immediate Next Sprint Recommendation

Do not start with redesign.  
Do not start with more AI.  
Do not start with new job providers.

Start with:

```text
Sprint 0 + Sprint 1
```

Specifically:

1. Create docs/product/SPEC.md and docs/architecture/ files.
2. Add hide/show Recommended Jobs toggle.
3. Run Discovery Audit.
4. Decide whether Discovery V2 should focus on:
   - search strategy
   - ranking
   - new sources
   - all of the above

This keeps the system understandable and avoids adding more code to an already complex application.

---

## 8. Sprint Operating Rules For Devin

Use these rules for every future sprint.

### Command Budget

Default:
- Max 40 commands per sprint.

If more commands are needed:
- Stop.
- Explain why.
- Ask for approval.

### OpenAI Budget

Default:
- Max $0.25 for audit / deterministic sprints.
- Max $1.00 for materials / candidate intelligence sprints.

If more spend is needed:
- Stop.
- Explain expected usage.
- Ask for approval.

### Development Rules

- Inspect data before changing logic.
- No silent catches around LLM/API calls.
- Pure functions must have cheap offline tests.
- Do not rerun expensive benchmarks for one-line changes.
- Batch fixes before validation.
- No user-specific hardcoded logic in production paths.
- Prefer deterministic systems first.
- Cache all AI outputs.
- Track costs.
- Add known issues to docs before moving on.

---

## 9. Required Files To Add

Create these files if they do not exist:

```text
/docs/product/SPEC.md
/docs/architecture/ARCHITECTURE.md
/docs/engineering/ROADMAP.md
/docs/engineering/KNOWN_ISSUES.md
/docs/engineering/SPRINT_RULES.md
/docs/engineering/DISCOVERY_AUDIT.md
```

This file can become `/docs/product/SPEC.md`.

---

## 10. Definition of Done For Product V1

Career Autopilot V1 is good enough when:

1. A new user can complete profile setup in under 10 minutes.
2. The system can ingest or manually add jobs reliably.
3. The system can rank jobs with stable fit scores.
4. The user can filter and track applications.
5. The system can generate high-quality materials.
6. The user can edit and export those materials.
7. Discovery does not show obviously bad recommendations by default.
8. LLM usage is tracked and controlled.
9. Main workflows have tests or evals.
10. The repo has enough documentation for another engineer or AI agent to debug it.

---

## 11. Product Principle

When deciding whether to add a feature, ask:

```text
Does this help the user get better jobs or spend less time applying?
```

If the answer is no, it does not belong in V1.

Every major subsystem must satisfy:

- Single responsibility.
- Easy to debug.
- Cheap to test.
- Cheap to run.
- Deterministic whenever possible.
- Cached whenever possible.
- Replaceable without rewriting the rest of the system.

Every feature must answer:

1. Does it improve getting interviews?
2. Does it reduce application time?
3. Can another engineer understand it in 30 minutes?
4. Is there a deterministic solution before using AI?
5. What is the per-user operating cost?

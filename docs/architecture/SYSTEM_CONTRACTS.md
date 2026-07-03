# Career Autopilot — System Contracts

Last updated: 2026-07-01  
Owner: Santiago Nones

Every major subsystem defines its inputs, outputs, guarantees, failure modes, and invariants.

---

## 1. Heuristic Job Scoring

### Input
- `rawText: string` — Job description text (may be empty)
- `prefs: CandidatePreferences | null` — User preferences (may be null)

### Output
- `label: JobLabel` — APPLY | APPLY_STRETCH | MAYBE | SKIP
- `totalScore: number` — 0-100
- `10 dimension scores: number` — Each 0-100
- `reasons: string[]` — Why this score
- `risks: string[]` — Potential concerns
- `gaps: string[]` — Missing qualifications
- `narrativeSuggestion: string` — Positioning hint

### Guarantees
- Pure function: same inputs → same outputs (deterministic)
- Returns in <10ms
- Never makes network calls
- Never throws (returns safe defaults on invalid input)
- totalScore is always 0-100

### Failure Modes
- Empty rawText → low/default scores, label likely SKIP
- Null preferences → scoring uses defaults only

### Must Never
- Return totalScore > 100 or < 0
- Return NaN for any numeric field
- Make any network or LLM call
- Throw an unhandled exception
- Produce different output for identical input

---

## 2. Fit Analysis (V4)

### Input
- `jobPosting: JobPosting` — Must have title or rawText
- `candidateIntelligence: CandidateIntelligence` — Must have evidenceInventory

### Output
- `requirements: JobRequirement[]` — Extracted from job (1+)
- `evidenceMatches: EvidenceMatchV4[]` — One per requirement
- `gapAnalysis: { strongEvidence, partialEvidence, missingEvidence }`
- `score: number` — 0-100
- `verdict: FitVerdict` — APPLY | APPLY_STRETCH | MAYBE | SKIP
- `gates: string[]` — Applied caps
- `scoreBreakdown: { earned, total, rawCoverageScore, criticalGapCap, seniorityGateCap }`

### Guarantees
- Score is always 0-100 (clamped)
- Verdict thresholds: ≥65=APPLY, ≥55=APPLY_STRETCH, ≥40=MAYBE, <40=SKIP
- At least 1 requirement is extracted (or throws)
- Evidence matching is deterministic given fixed requirements
- Gates are applied consistently: seniority cap=35, critical gap cap=45

### Failure Modes
- 0 requirements extracted → throws Error (caught by caller)
- No CandidateIntelligence → fit analysis is skipped entirely (no-op)
- OpenAI failure during requirement extraction → propagates as error
- Empty evidence inventory → all matches are "none" strength → low score

### Must Never
- Return score > 100 or < 0
- Return NaN
- Hallucinate evidence (evidence comes from CI, not generated)
- Produce a verdict inconsistent with the score thresholds
- Silently swallow an error and return a fake score
- Modify the job posting or candidate intelligence records

---

## 3. Candidate Intelligence

### Input
- `userProfile: UserProfile` — With preferences
- `resumeMaster: ResumeMaster` — With text content
- `experienceInsight: ExperienceInsight` — With structured insights

### Output
- `CandidateIntelligenceOutput` — Structured candidate model with:
  - Career stage and direction
  - Role families (primary + secondary)
  - Technical stack and strengths
  - Evidence inventory
  - Risk areas and constraints
  - Summary

### Guarantees
- All required inputs are validated before LLM call
- Output is JSON-structured (parsed from LLM response)
- Evidence inventory is generated via Evidence Engine
- Stored in database for reuse

### Failure Modes
- Missing ExperienceInsight → returns 400 error to user
- OpenAI rate limit / timeout → propagates as 500 error
- Malformed LLM response → JSON parse failure → error
- Empty resume → poor quality output (not prevented)

### Must Never
- Run without user explicitly triggering it
- Run automatically on page load
- Invent experience or projects not in the resume
- Cost more than $0.20 per generation
- Overwrite CI without user confirmation
- Expose raw LLM prompts to the frontend

---

## 4. Discovery

### Input
- `query?: string` — Optional search term
- `CompanySource[]` — Provider-company registry (from DB)
- `CandidatePreferences` — For scoring

### Output
- `DiscoverySummary` — { providersRun, companiesScanned, jobsFetched, afterDedupe, jobsSaved, topMatches }
- Side effect: RecommendedJob table updated (max 50 records)

### Guarantees
- Maximum 50 recommended jobs saved
- All scoring is deterministic (no LLM in scoring pipeline)
- Deduplication by provider+externalId
- Each provider failure is isolated (others still run)
- Location/seniority/role classifiers are applied to every job

### Failure Modes
- Provider API down → that provider skipped, others continue
- Network timeout → partial results saved
- No CandidatePreferences → scoring uses defaults
- Empty provider response → 0 jobs from that source

### Must Never
- Use LLM calls during discovery scoring
- Save more than 50 recommended jobs
- Delete existing JobPostings (discovery is separate from user's pipeline)
- Make discovery score depend on non-deterministic factors
- Run without user trigger (no background cron)

---

## 5. Material Generation

### Input
- `jobPosting: JobPosting` — With rawText
- `userProfile: UserProfile` — With contact info
- `preferences: CandidatePreferences` — With target titles
- `resumeMaster: ResumeMaster` — With full resume content
- `evaluation: JobEvaluation` — Latest score + narrative
- `fitAnalysis: FitAnalysis` — Strengths, gaps, angle

### Output
- 4 `JobMaterial` records:
  - TAILORED_CV
  - COVER_LETTER
  - RECRUITER_MESSAGE
  - SCREENING_ANSWERS

### Guarantees
- All 4 material types are generated per call
- Materials are stored with version=1, status=DRAFT
- Materials reference real resume content only
- Each material is self-contained and ready to use

### Failure Modes
- Missing resume → generation proceeds with limited content
- OpenAI failure → 500 error, no partial materials saved
- Very long job description → potential token limit issues
- Missing FitAnalysis → degrades gracefully (less targeted output)

### Must Never
- Invent work experience, projects, or companies
- Include skills the candidate doesn't have
- Generate materials without the user explicitly requesting it
- Cost more than $0.50 per generation
- Silently fail and leave the user thinking materials are ready
- Overwrite existing materials without creating a new version

---

## 6. Export (PDF / DOCX)

### Input
- `content: string` — Material text (markdown-like format)
- `filename: string` — Desired output filename

### Output
- Binary file (PDF or DOCX) as HTTP response with Content-Disposition header

### Guarantees
- Pure transformation: content → document
- No data loss (all text content preserved)
- Proper formatting (headers, bullets, links)
- Filename matches request
- Response is a valid PDF/DOCX file

### Failure Modes
- Empty content → generates empty document (not an error)
- Malformed content structure → best-effort formatting
- Very long content → potential memory issues (unlikely)

### Must Never
- Make network calls
- Access the database
- Modify any records
- Use LLM
- Return an invalid/corrupt file
- Expose internal system information in the document

---

## 7. Job Ingestion

### Input
- `url?: string` — Job posting URL (optional)
- `pastedText?: string` — Pasted job description (optional)
- At least one must be provided

### Output
- `{ jobId: string, deduped: boolean }` — Created or existing job ID

### Guarantees
- Deduplication by sourceUrl (unique constraint)
- Score is computed synchronously (deterministic)
- Job record is always created (even if parsing fails)
- Fit analysis is triggered async after creation
- Per-item result for bulk ingest

### Failure Modes
- Blocked URL → creates "Needs manual description" record
- Invalid URL (non-job page) → validated and rejected or flagged
- Very short text (<200 chars) → treated as URL attempt
- Duplicate → returns existing job ID (no error)

### Must Never
- Silently create a job with no title AND no description
- Lose the source URL
- Block the response waiting for fit analysis
- Make the user wait more than 10 seconds for single ingest
- Bypass deduplication

---

## 8. Application Tracking

### Input
- `jobId: string` — Job to update
- `status: ApplicationStatus` — New status value

### Output
- Updated job record with new applicationStatus

### Guarantees
- Status is always a valid ApplicationStatus enum value
- Update is atomic (single DB operation)
- Page refresh shows new status immediately
- No data loss on status change

### Failure Modes
- Invalid status value → validation error (400)
- Job not found → 404
- Concurrent updates → last write wins (acceptable for single user)

### Must Never
- Delete job data when changing status
- Change status without user action
- Allow invalid status transitions silently
- Modify evaluation scores when status changes

---

## 9. Evidence Engine

### Input
- Resume sections (experience, projects, skills)
- ExperienceInsight structured data

### Output
- Evidence inventory: structured list of provable claims with:
  - Evidence statement
  - Capability tags
  - Source (which resume section)
  - Strength indicator

### Guarantees
- Evidence is always grounded in resume content
- Each evidence item maps to at least one capability
- Inventory is reproducible given same inputs

### Failure Modes
- Empty resume → empty evidence inventory
- Missing ExperienceInsight → limited evidence extraction

### Must Never
- Invent evidence not supported by resume
- Include capabilities the candidate hasn't demonstrated
- Produce duplicate evidence items
- Return evidence that contradicts the resume

---

## 10. Resume Parsing

### Input
- File upload (PDF or DOCX binary)
- OR pasted text

### Output
- ResumeMaster record with structured sections:
  - rawText, summary, experience, projects, skills, education, languages, links

### Guarantees
- Supports PDF and DOCX formats
- Text extraction is deterministic
- Original content is preserved in rawText
- Structured sections are best-effort parsing

### Failure Modes
- Corrupt PDF → extraction error
- Scanned/image PDF → empty text
- Unusual formatting → poor section splitting
- Non-resume document → treated as resume anyway

### Must Never
- Use LLM for basic text extraction
- Modify the uploaded file
- Lose content during extraction
- Execute embedded scripts or macros from documents

---

## See Also

- **[ARCHITECTURE.md](ARCHITECTURE.md)** — System architecture overview
- **[DEPENDENCY_MAPS.md](DEPENDENCY_MAPS.md)** — Subsystem responsibilities and dependencies
- **[../decisions/ADR-005-evidence-grounding.md](../decisions/ADR-005-evidence-grounding.md)** — Evidence grounding decision

# Career Autopilot — Discovery Audit Plan

Last updated: 2026-07-01  
Owner: Santiago Nones  
Status: **READY TO EXECUTE** (Sprint 1)

---

## Purpose

Discovery is currently rated **5/10** in the Product Health Dashboard. Before building Discovery V2, we must understand exactly what is broken and why.

This audit collects data, diagnoses root causes, and produces a decision framework for what to fix first. **No code changes until the audit is complete.**

---

## Known Symptoms (from observation)

- Too many irrelevant jobs in the top 50
- Mistral AI over-represented in recommendations
- Many jobs score 100 inappropriately
- Barcelona/Spain jobs underrepresented
- Junior-appropriate jobs may be discarded or outscored

---

## Hypotheses to Test

| # | Hypothesis | Test Method |
|---|-----------|-------------|
| H1 | **The problem is sources** — the hardcoded company list doesn't include enough companies hiring in Barcelona/Spain for junior roles | Count jobs by provider × geography × seniority |
| H2 | **The problem is ranking** — scoring bonuses stack too aggressively, inflating irrelevant jobs | Analyze score distribution; check for double-bonus patterns |
| H3 | **The problem is filtering** — location/seniority classifiers are too permissive, allowing ineligible jobs through | Count jobs that pass location/seniority gates but are actually ineligible |
| H4 | **The problem is the candidate profile** — discovery scoring uses hardcoded defaults instead of real CI | Inspect `discoveryScoring.ts` lines 282-301 (confirmed: hardcoded profile) |
| H5 | **The problem is deduplication** — same job from multiple providers inflates results | Count duplicates by title+company across providers |
| H6 | **The problem is the V2 fit analysis** — `analyzeFitV2()` uses fake candidate data | Inspect V2 fit analysis inputs vs real CI data |

---

## Pre-Audit: Known Code Issues (from code review)

### Issue DA-1: Hardcoded Candidate Profile in Discovery Scoring

`discoveryScoring.ts` lines 282-301 constructs a **fake candidate profile** for V2 fit analysis:

```
yearsExperience: 3,                          // hardcoded
technologies: prefs?.positiveKeywords || defaults,
domains: ['software engineering'],           // hardcoded
location: 'Spain',                           // hardcoded
projects: ['AI-powered applications', ...],  // hardcoded
customerFacingExperience: true,              // hardcoded
narrativeStrength: 75,                       // hardcoded
adjacentSkills: ['AI/ML', ...]              // hardcoded
```

**Impact:** V2 scoring (fitScore, positionabilityScore, finalVerdict) is based on a fictional candidate, not the real user. This likely inflates scores for generic tech roles and deflates scores for the user's actual strengths.

### Issue DA-2: Double Bonus Application

`discoveryScoring.ts` applies role bonuses **twice** — once at line 205-210 (roleBonusKeywords) and again at lines 237-244 (bonusKeywords with overlapping keywords). Jobs with titles containing "ai", "fullstack", "support", or "solutions" get +20 instead of +10.

### Issue DA-3: Score Can Exceed 100 Before Capping

Multiple bonuses (+15 role family, +10 query match, +10 location, +10 role keywords, +10 more role keywords, +15 target keyword, +8 description keyword, +5 junior) can stack to +73 on top of a base score. The score is capped to 100 at line 247, but the maxScore cap at line 255 may not prevent this from creating false equivalence at 100.

### Issue DA-4: Company Source Distribution

Hardcoded sources: 8 Ashby, 22 Greenhouse, 8 Lever (38 total). Most are US-headquartered tech companies. Only ~8 companies have explicit Spain/Europe presence (TravelPerk, Typeform, Factorial, Glovo, Wallapop, Hotjar, Malt, Qonto).

### Issue DA-5: Spotify Listed Twice

`DEFAULT_COMPANY_SOURCES` includes Spotify on both Lever (line 323) and Greenhouse (line 331). This creates duplicate jobs that pass deduplication because they have different providers.

---

## Audit Data Collection Plan

### Phase 1: Database Snapshot (automated script)

The audit script (`scripts/discovery-audit.ts`) should query:

```sql
-- 1. Company sources
SELECT provider, COUNT(*) as count, 
       COUNT(CASE WHEN enabled THEN 1 END) as enabled
FROM CompanySource GROUP BY provider;

-- 2. Recommended jobs by provider
SELECT provider, COUNT(*) as count
FROM RecommendedJob GROUP BY provider;

-- 3. Company concentration (top 20)
SELECT company, COUNT(*) as count
FROM RecommendedJob GROUP BY company ORDER BY count DESC LIMIT 20;

-- 4. Geography distribution
SELECT "locationCategory", COUNT(*) as count,
       COUNT(CASE WHEN "locationEligible" THEN 1 END) as eligible
FROM RecommendedJob GROUP BY "locationCategory";

-- 5. Seniority distribution
SELECT "seniorityLevel", COUNT(*) as count,
       COUNT(CASE WHEN "seniorityAllowed" THEN 1 END) as allowed
FROM RecommendedJob GROUP BY "seniorityLevel";

-- 6. Label/verdict distribution
SELECT label, "finalVerdict", COUNT(*) as count
FROM RecommendedJob GROUP BY label, "finalVerdict";

-- 7. Score distribution (buckets)
SELECT 
  CASE 
    WHEN "matchScore" >= 90 THEN '90-100'
    WHEN "matchScore" >= 80 THEN '80-89'
    WHEN "matchScore" >= 70 THEN '70-79'
    WHEN "matchScore" >= 60 THEN '60-69'
    WHEN "matchScore" >= 50 THEN '50-59'
    ELSE 'below-50'
  END as bucket,
  COUNT(*) as count
FROM RecommendedJob GROUP BY bucket ORDER BY bucket DESC;

-- 8. Potential duplicates
SELECT title, company, COUNT(*) as count
FROM RecommendedJob GROUP BY title, company HAVING COUNT(*) > 1;
```

### Phase 2: Quality Assessment (manual review)

For the **top 20 recommended jobs** (by matchScore), manually assess:

| Job | Score | Would Santiago apply? | Why/Why not? | Correct label? |
|-----|-------|----------------------|--------------|----------------|
| 1 | | Yes/No/Maybe | | |
| ... | | | | |

This produces the **human precision metric**: what percentage of top-20 recommendations would the real user actually consider?

### Phase 3: Classifier Accuracy Spot-Check

For 10 randomly sampled jobs, verify:

| Job | Location Text | Classifier Output | Correct? |
|-----|--------------|-------------------|----------|
| | | barcelona/spain/europe/remote/other | Y/N |

| Job | Title | Seniority Output | Correct? |
|-----|-------|-----------------|----------|
| | | junior/mid/senior/staff | Y/N |

| Job | Title | Role Family | Correct? |
|-----|-------|-------------|----------|
| | | ai/fullstack/support/etc | Y/N |

---

## Audit Questions (expanded)

| # | Question | Data Source | Answer |
|---|----------|-------------|--------|
| 1 | Which providers currently exist in code? | Code | Greenhouse, Lever, Ashby |
| 2 | Which providers are active (returning jobs)? | DB query | TBD |
| 3 | How many companies are registered in CompanySource? | DB query | 38 hardcoded; TBD in DB |
| 4 | How many jobs exist in RecommendedJob table? | DB query | TBD |
| 5 | How many jobs come from each provider? | DB query | TBD |
| 6 | How many jobs come from each company? (top 20) | DB query | TBD |
| 7 | How many jobs are Barcelona / Spain / Europe / Remote? | DB query | TBD |
| 8 | How many jobs are Junior / Mid / Senior / Staff? | DB query | TBD |
| 9 | What is the label distribution (APPLY/STRETCH/MAYBE/SKIP)? | DB query | TBD |
| 10 | What is the score distribution? (buckets of 10) | DB query | TBD |
| 11 | How many duplicates exist? | DB query | TBD |
| 12 | What percentage of top-20 would Santiago actually apply to? | Manual review | TBD |
| 13 | Are location classifiers accurate? (spot check) | Manual review | TBD |
| 14 | Are seniority classifiers accurate? (spot check) | Manual review | TBD |
| 15 | Is the double-bonus inflating scores? | Code analysis | Yes (confirmed DA-2) |
| 16 | Is the hardcoded candidate profile distorting fit scores? | Code analysis | Yes (confirmed DA-1) |
| 17 | Are Barcelona jobs available from current sources? | DB query | TBD |
| 18 | Which provider contributes highest-quality jobs? | Quality assessment | TBD |
| 19 | Which provider contributes most noise? | Quality assessment | TBD |
| 20 | Is the problem sources, ranking, filtering, or all three? | Synthesis | TBD |

---

## Expected Output Format

```
=== DISCOVERY AUDIT REPORT ===
Date: YYYY-MM-DD

--- Source Summary ---
Total companies registered: X (Y enabled)
GREENHOUSE: X companies, Y jobs
LEVER: X companies, Y jobs
ASHBY: X companies, Y jobs

--- Company Concentration (top 20) ---
1. CompanyName: X jobs (Y%)
2. ...

--- Geography Distribution ---
Barcelona:      X jobs (Y%) | Eligible: Z%
Spain (other):  X jobs (Y%) | Eligible: Z%
Europe:         X jobs (Y%) | Eligible: Z%
Remote Europe:  X jobs (Y%) | Eligible: Z%
Remote Global:  X jobs (Y%) | Eligible: Z%
Remote US-only: X jobs (Y%) | Eligible: Z%
Other/Unknown:  X jobs (Y%) | Eligible: Z%

--- Seniority Distribution ---
Junior/Entry:  X jobs (Y%) | Allowed: Z%
Mid:           X jobs (Y%) | Allowed: Z%
Senior:        X jobs (Y%) | Allowed: Z%
Staff+:        X jobs (Y%) | Allowed: Z%
Unknown:       X jobs (Y%) | Allowed: Z%

--- Score Distribution ---
90-100: X jobs (Y%)
80-89:  X jobs (Y%)
70-79:  X jobs (Y%)
60-69:  X jobs (Y%)
50-59:  X jobs (Y%)
<50:    X jobs (Y%)

--- Verdict Distribution ---
APPLY:         X (Y%)
APPLY_STRETCH: X (Y%)
MAYBE:         X (Y%)
SKIP:          X (Y%)

--- Duplicates ---
Cross-provider duplicates: X
Same-provider duplicates:  X

--- Human Quality Assessment ---
Top-20 Precision: X% (Y of 20 jobs are genuinely relevant)
Top-20 Provider Quality:
  GREENHOUSE: X/Y relevant
  LEVER: X/Y relevant
  ASHBY: X/Y relevant

--- Known Code Issues ---
DA-1: Hardcoded candidate profile [CONFIRMED]
DA-2: Double bonus application [CONFIRMED]
DA-3: Score inflation at cap [CONFIRMED]
DA-4: Source distribution skew [CONFIRMED]
DA-5: Spotify duplicate [CONFIRMED]

--- Root Cause Diagnosis ---
Primary bottleneck: [sources | ranking | filtering | candidate model]
Secondary issues: [...]
Recommended fix order: [...]
```

---

## Decision Framework

After the audit, classify the problem:

### If sources are the bottleneck:
- Add more Barcelona/Spain/Europe companies
- Add companies hiring for junior AI/fullstack roles
- Consider additional providers (LinkedIn RSS, job board APIs)

### If ranking is the bottleneck:
- Fix double-bonus (DA-2)
- Replace hardcoded candidate profile with real CI data (DA-1)
- Recalibrate bonus magnitudes
- Add benchmark fixtures for discovery scoring

### If filtering is the bottleneck:
- Tighten location classifier rules
- Tighten seniority classifier rules
- Add role intent exclusions

### If the candidate model is the bottleneck:
- Feed real CandidateIntelligence into discovery scoring
- Replace fake V2 fit analysis with real evidence matching
- This may require CI to exist before discovery runs

---

## Implementation Plan

| Step | Task | Effort | Sprint |
|------|------|--------|--------|
| 1 | Create `scripts/discovery-audit.ts` | 2h | 1 |
| 2 | Run audit, collect Phase 1 data | 30min | 1 |
| 3 | Manual quality assessment (Phase 2) | 1h | 1 |
| 4 | Classifier spot-check (Phase 3) | 30min | 1 |
| 5 | Write audit report | 1h | 1 |
| 6 | Decision: fix sources, ranking, or filtering first | 30min | 1 |
| 7 | Implement fixes based on diagnosis | TBD | 2+ |

**Total audit effort: ~5.5 hours**  
**OpenAI cost: $0**

---

## Success Criteria

The audit is complete when:

- [ ] All 20 questions have data-backed answers
- [ ] Human precision metric is calculated
- [ ] Root cause is identified with evidence
- [ ] Fix priority order is documented
- [ ] Decision is approved before implementation begins

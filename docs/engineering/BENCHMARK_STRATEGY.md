# Career Autopilot — Benchmark Strategy

Last updated: 2026-07-01  
Owner: Santiago Nones

---

## Philosophy

Benchmarks are not optional. They are a first-class engineering practice.

Career Autopilot uses **benchmark-driven development**:

1. Define expected behavior as fixtures before implementing features.
2. Run benchmarks after every significant change.
3. Never merge code that regresses benchmark scores without explicit approval.
4. Keep benchmarks cheap to run (deterministic-first, no LLM by default).
5. Benchmarks are living documentation of system behavior.

### Why This Matters

Fit Analysis V4 was successfully built because calibration benchmarks caught scoring regressions before they reached production. The same discipline should apply to every subsystem.

### Core Principles

- **Deterministic over statistical** — Prefer exact expected outputs over "should be roughly X"
- **Fast over comprehensive** — A 5-second benchmark suite that runs every commit beats a 10-minute suite that nobody runs
- **Fixtures over mocks** — Use real (anonymized) data snapshots, not synthetic generators
- **Known failures documented** — If a benchmark is expected to fail, annotate why
- **Offline by default** — Benchmarks must run without network/LLM calls unless explicitly flagged

---

## Current Benchmark Assets

### Existing Validation Infrastructure

| File | Purpose | Status |
|------|---------|--------|
| `src/validation/validationDataset.ts` | V1 benchmark job fixtures with expected scores | Active |
| `src/validation/validationDatasetV2.ts` | V2 benchmark fixtures (expanded) | Active |
| `src/validation/validationRunner.ts` | V1 runner: scores fixtures and reports deviations | Active |
| `src/validation/validationRunnerV2.ts` | V2 runner | Active |
| `src/validation/calibrationSimulation.ts` | Model D scoring calibration simulation | Active |
| `src/validation/capabilityBenchmark.ts` | Tests capability matching accuracy | Active |

### Existing API Endpoints

| Route | Purpose |
|-------|---------|
| `POST /api/validation/run-validation` | Run V1 benchmark suite |
| `POST /api/validation/run-validation-v2` | Run V2 benchmark suite |
| `POST /api/validation/run-simulation` | Run calibration simulation |
| `POST /api/validation/capability-benchmark` | Run capability matching tests |

### Existing Documentation

| File | Purpose |
|------|---------|
| `docs/reports/CALIBRATION_SIMULATION_REPORT.md` | Results of Model D calibration |
| `docs/reports/CAPABILITY_BENCHMARK_REPORT.md` | Results of capability matching benchmarks |

---

## Proposed Benchmark Folder Structure

```
tests/
├── fixtures/
│   ├── jobs/
│   │   ├── ai-engineer-junior.json          # Known good: APPLY
│   │   ├── ai-engineer-senior.json          # Known gate: seniority cap
│   │   ├── solutions-engineer-bcn.json      # Known good: location match
│   │   ├── devops-sre.json                  # Known gate: infrastructure
│   │   ├── fullstack-remote-eu.json         # Known good: APPLY_STRETCH
│   │   ├── support-role.json                # Known: SKIP (roles to avoid)
│   │   ├── minimal-description.json         # Edge: very short text
│   │   └── README.md                        # Fixture format documentation
│   ├── candidates/
│   │   ├── santiago-v1.json                 # Real candidate intelligence snapshot
│   │   ├── generic-junior-dev.json          # Synthetic: generic junior
│   │   ├── career-transitioner.json         # Synthetic: non-tech → tech
│   │   └── README.md
│   └── materials/
│       ├── expected-cv-structure.md         # Format expectations
│       └── anti-patterns.md                 # Things materials must never contain
├── benchmarks/
│   ├── discovery/
│   │   ├── scoring.test.ts                  # Discovery scoring determinism
│   │   ├── location-classifier.test.ts      # Location classification accuracy
│   │   ├── seniority-classifier.test.ts     # Seniority detection accuracy
│   │   └── role-intent.test.ts              # Role family classification
│   ├── fit/
│   │   ├── v4-scoring.test.ts               # V4 score consistency
│   │   ├── gates.test.ts                    # Seniority/critical gap gates
│   │   ├── evidence-matching.test.ts        # Capability matching accuracy
│   │   ├── deterministic-extractor.test.ts  # Requirement extraction rules
│   │   └── regression.test.ts              # Known score expectations
│   ├── materials/
│   │   ├── no-hallucination.test.ts         # Verify no invented content
│   │   ├── structure.test.ts                # Output format validation
│   │   └── completeness.test.ts            # All 4 types generated
│   ├── ingestion/
│   │   ├── url-validation.test.ts           # Domain blocking
│   │   ├── text-parsing.test.ts             # Title extraction from text
│   │   └── deduplication.test.ts           # sourceUrl uniqueness
│   └── scoring/
│       ├── heuristic.test.ts                # Keyword scoring determinism
│       └── dimension-scores.test.ts         # Each dimension 0-100
├── utils/
│   ├── loadFixture.ts                       # Fixture loader helper
│   ├── assertScore.ts                       # Score assertion with tolerance
│   └── mockCandidateIntelligence.ts        # CI mock for offline tests
└── README.md                                # How to run benchmarks
```

---

## Fixture Format

### Job Fixture (JSON)

```json
{
  "id": "fixture-ai-engineer-junior",
  "title": "Junior AI Engineer",
  "companyName": "TechCo",
  "location": "Barcelona, Spain",
  "rawText": "We are looking for a Junior AI Engineer...",
  "expected": {
    "heuristicLabel": "APPLY",
    "heuristicScoreRange": [60, 85],
    "v4VerdictRange": ["APPLY", "APPLY_STRETCH"],
    "v4ScoreRange": [55, 80],
    "locationCategory": "barcelona",
    "locationEligible": true,
    "seniorityLevel": "junior",
    "seniorityAllowed": true,
    "gates": []
  }
}
```

### Candidate Fixture (JSON)

```json
{
  "id": "fixture-santiago-v1",
  "source": "real-anonymized",
  "evidenceInventory": [...],
  "careerStage": "career_transition",
  "primaryRoleFamilies": ["ai_engineering", "forward_deployed_engineering"],
  "technicalStack": ["typescript", "react", "nextjs", "python", "openai"]
}
```

---

## Benchmark Categories

### Tier 1: Must Pass (run on every commit)

These are fast, deterministic, and catch critical regressions:

- Heuristic scoring produces consistent results for fixture jobs
- Location classifier correctly categorizes known locations
- Seniority classifier detects known patterns
- V4 gates trigger correctly (senior titles → cap at 35)
- Score is always 0-100
- No NaN in any output
- Deduplication works

**Expected runtime:** <5 seconds total

### Tier 2: Should Pass (run before merge)

These are slightly slower but still deterministic:

- V4 scoring produces expected ranges for benchmark jobs
- Evidence matching assigns correct tiers
- Capability taxonomy covers all defined families
- Export produces valid documents
- Bulk ingest handles edge cases

**Expected runtime:** <30 seconds total

### Tier 3: Quality Check (run manually)

These may involve LLM calls and are not part of CI:

- Material generation produces all 4 types
- Materials don't hallucinate content
- CI generation covers all output fields
- Requirement extraction covers key patterns

**Expected runtime:** 1-5 minutes, costs ~$0.10-0.50

---

## Regression Strategy

### When a benchmark fails:

1. **Do not delete or weaken the benchmark** without explicit approval
2. **Investigate the root cause** — is it a code change or a fixture problem?
3. **If the code change is intentional:**
   - Document why the expected behavior changed
   - Update the fixture with new expected values
   - Add a comment explaining the change
4. **If the code change is a bug:**
   - Revert or fix the code
   - Add an additional fixture to prevent recurrence

### Score Tolerance

For scoring benchmarks, use tolerance ranges instead of exact values:

```typescript
// Good: allows for acceptable variation
assertScoreInRange(result.score, 55, 80);

// Bad: brittle, breaks on minor improvements
assertEquals(result.score, 67);
```

### Version Tracking

Every benchmark fixture should include:
- `fixtureVersion: number` — incremented when expected values change
- `lastValidated: string` — date of last manual verification
- `notes: string` — why this fixture exists and what it tests

---

## Discovery Benchmarks (Proposed)

Discovery scoring is currently rated 5/10 in Product Health. Benchmarks are critical to prevent regressions as we fix ranking, filtering, and source issues.

### Discovery Quality Metrics

| Metric | Definition | Target | Current (estimated) |
|--------|-----------|--------|---------------------|
| **Precision@20** | % of top-20 recommendations a real user would consider applying to | ≥60% | ~20-30% (estimated) |
| **Precision@50** | % of top-50 recommendations a real user would consider | ≥40% | ~15-25% (estimated) |
| **Barcelona Recall** | % of available Barcelona/Spain jobs that appear in top 50 | ≥80% | Unknown |
| **Junior Relevance** | % of top-50 that are junior/entry-level appropriate | ≥30% | Unknown |
| **AI Role Relevance** | % of top-50 that match target role families (AI, fullstack, solutions) | ≥50% | Unknown |
| **Duplicate Rate** | % of top-50 that are duplicates (same job, different provider) | ≤5% | Unknown (Spotify confirmed) |
| **Average Match Score** | Mean matchScore of top-50 | 60-80 | Unknown (suspected high due to bonus stacking) |
| **Score Ceiling Rate** | % of top-50 scoring exactly 100 | ≤10% | Unknown (suspected high) |
| **Provider Diversity** | Number of distinct providers contributing to top-50 | ≥2 | TBD |
| **Company Diversity** | Max % of top-50 from any single company | ≤15% | Unknown (Mistral AI suspected high) |

### Discovery Benchmark Fixtures

```json
{
  "id": "discovery-benchmark-v1",
  "fixtureVersion": 1,
  "lastValidated": "TBD",
  "jobs": [
    {
      "title": "Junior AI Engineer",
      "company": "TravelPerk",
      "location": "Barcelona, Spain",
      "expected": {
        "locationCategory": "barcelona",
        "locationEligible": true,
        "seniorityLevel": "junior",
        "seniorityAllowed": true,
        "roleFamily": "ai_engineering",
        "isTargetRole": true,
        "minScore": 70,
        "expectedVerdict": "APPLY"
      }
    },
    {
      "title": "Staff Platform Engineer",
      "company": "Stripe",
      "location": "San Francisco, CA",
      "expected": {
        "locationCategory": "us",
        "locationEligible": false,
        "seniorityLevel": "staff",
        "seniorityAllowed": false,
        "maxScore": 55,
        "expectedVerdict": "SKIP"
      }
    },
    {
      "title": "Customer Support Representative",
      "company": "Notion",
      "location": "Remote - US",
      "expected": {
        "locationEligible": false,
        "roleFamily": "product_support",
        "isTargetRole": false,
        "maxScore": 50,
        "expectedVerdict": "SKIP"
      }
    }
  ]
}
```

### Deterministic Discovery Tests (Tier 1)

These tests validate classifier and scoring logic without network or LLM calls:

1. **Location classifier accuracy** — Known locations produce expected categories
   - "Barcelona, Spain" → `barcelona`, eligible
   - "Remote - US" → `remote_us_only`, not eligible
   - "London, UK" → `europe`, eligible
   - "Remote (EMEA)" → `remote_europe`, eligible
   - "" (empty) → `unknown`

2. **Seniority classifier accuracy** — Known titles produce expected levels
   - "Junior AI Engineer" → `junior`, allowed
   - "Staff Platform Engineer" → `staff`, not allowed
   - "Senior Backend Developer" → `senior`, conditional
   - "Software Engineer" (no qualifier) → `mid`, allowed

3. **Role intent accuracy** — Known titles map to expected families
   - "AI Engineer" → `ai_engineering`, target
   - "Customer Support" → `product_support`, not target
   - "Solutions Engineer" → `solutions_engineering`, target
   - "VP of Sales" → not target

4. **Score bounds** — Every score output is 0-100, never NaN
5. **Double bonus detection** — Verify bonus categories don't overlap (regression test for DA-2)
6. **Deduplication** — Same job from two providers produces one result
7. **Gate enforcement** — Ineligible location caps score at 55; ineligible seniority caps at 55

### Discovery Quality Tests (Tier 2, run before merge)

1. **Score distribution** — No more than 10% of scored jobs should hit exactly 100
2. **Bonus stacking** — Total bonuses applied to any single job should not exceed +40
3. **Provider isolation** — One provider throwing an error should not affect others
4. **Empty results** — Discovery with 0 jobs found returns valid DiscoverySummary
5. **MAX_SAVED_JOBS enforcement** — Never more than 50 jobs saved

### Discovery Quality Audit (Tier 3, manual)

1. **Human precision@20** — Manual review of top-20 results
2. **Barcelona availability** — How many Barcelona jobs exist in source data
3. **Provider quality comparison** — Quality per provider
4. **Score inflation audit** — Identify jobs scoring above their human-assessed quality

---

## Implementation Priority

1. **Now (Sprint 0):** Define folder structure and fixture format (this document) ✓
2. **Sprint 1:** Create first 5 job fixtures + heuristic scoring benchmark
3. **Sprint 2:** Add ingestion and deduplication benchmarks
4. **Sprint 3:** Add material structure benchmarks
5. **Sprint 4:** Full regression suite with V4 scoring benchmarks
6. **Ongoing:** Add fixtures for every confirmed bug fix

# Benchmark Guide — Career Autopilot

## Why Benchmarks Exist

Career Autopilot evolves through multiple scoring systems (V1 heuristic → V4 capability-based), material generation approaches (template → AI), and discovery strategies. Without objective regression protection:

1. **Refactors break silently** — a change to the capability taxonomy might degrade fit scores without anyone noticing
2. **Improvements can't be measured** — "does Discovery V2 actually find better jobs?" requires a baseline
3. **Cost discipline erodes** — without $0 default benchmarks, engineers add LLM calls without measuring the tradeoff
4. **New contributors can't verify safety** — manual testing doesn't scale

Benchmarks provide **deterministic, $0, sub-second validation** that the system behaves correctly after any change.

---

## How to Run Benchmarks

```bash
# Run all suites (default, $0, deterministic)
npm run benchmarks

# Run a specific suite
npx tsx benchmarks/runner.ts --suite capability-matching
npx tsx benchmarks/runner.ts --suite fit-analysis
npx tsx benchmarks/runner.ts --suite materials
npx tsx benchmarks/runner.ts --suite discovery
npx tsx benchmarks/runner.ts --suite ingestion
npx tsx benchmarks/runner.ts --suite regression

# Run full validation (build + typecheck + lint + benchmarks)
npm run validate

# Optional: AI benchmarks (costs ~$0.25 max)
ALLOW_OPENAI_BENCHMARKS=true npm run benchmarks:ai
```

---

## How to Add a Benchmark

### 1. Create a fixture or test case

```typescript
// benchmarks/<suite-name>/<suite-name>.bench.ts
import { BenchmarkSuite, assert, assertInRange } from "../lib/harness";

const suite = new BenchmarkSuite("My Suite");

suite.add("descriptive test name", () => {
  const result = myFunction(input);
  assertInRange(result.score, 40, 80, "score should be in expected range");
});

export default suite;
```

### 2. Register in the runner

```typescript
// benchmarks/runner.ts — add to ALL_SUITES array:
{ name: "my-suite", path: "./my-suite/my-suite.bench" },
```

### 3. Run and verify

```bash
npx tsx benchmarks/runner.ts --suite my-suite
```

### Key principles for writing benchmarks:

- **Score ranges, not exact values** — algorithms improve within acceptable bounds
- **No LLM calls** — use mocked/fixture data for deterministic runs
- **Test behavior, not implementation** — assert outputs, not internal state
- **Keep fixtures realistic** — use representative job descriptions
- **One assertion per concept** — each `suite.add()` tests one specific thing

---

## What Should Never Change

These invariants must always pass, regardless of algorithm improvements:

1. **Determinism** — same inputs always produce same outputs (no randomness)
2. **Score bounds** — all scores are 0–100
3. **Label validity** — only APPLY, APPLY_STRETCH, MAYBE, SKIP
4. **Export correctness** — public APIs maintain their shape
5. **No fabrication** — materials never invent experience
6. **Type safety** — all required fields are present in outputs
7. **Blocked content detection** — login walls, cookie walls always caught
8. **Capability taxonomy integrity** — all adjacents reference valid IDs

---

## What Is Expected to Evolve

These may legitimately change as algorithms improve:

1. **Score ranges** — as capability matching improves, scores may shift. Widen ranges or recalibrate fixtures.
2. **Match tier distribution** — more items may move from "none" to "adjacent" or "capability" as the taxonomy grows.
3. **New suites** — every new subsystem should get its own benchmark suite.
4. **Fixture jobs** — add more industry-specific test cases as needed.
5. **Validation thresholds** — as confidence grows, tighten acceptable ranges.

### When to recalibrate:

- After expanding the capability taxonomy
- After changing the scoring model (e.g., V4 → V5)
- After modifying evidence matching tiers
- After adding new material templates

**Process:** Run benchmarks, observe actual values, update `expectedScoreRange` to bracket the new behavior. Never silently widen ranges without understanding why values changed.

---

## Suite Overview

| Suite | Tests | What it validates |
|-------|-------|-------------------|
| Capability Matching | 22 | Exact/adjacent/transferable matching, confidence ranking, taxonomy integrity, determinism |
| Fit Analysis | 16 | Score ranges for 10 industries, requirement extraction, evidence matching, gap detection |
| Material Generation | 12 | CV structure, no fabrication, all sections present, cover letter/recruiter msg quality |
| Discovery | 11 | Score distribution, geography/seniority/role quality, determinism, negative keywords |
| Ingestion | 16 | URL detection, HTML parsing, blocked content, validation, edge cases |
| Regression | 12 | Score stability, export correctness, interface shapes, bounds checking |

**Total: 89 benchmarks, 27ms runtime, $0 cost**

---

## Cost Discipline

| Command | Cost | When to use |
|---------|------|-------------|
| `npm run benchmarks` | $0 | Every code change, CI, pre-commit |
| `npm run benchmarks:ai` | ≤$0.25 | Before releases, after prompt changes |

**Rules:**
- Default benchmarks MUST be $0
- AI benchmarks require `ALLOW_OPENAI_BENCHMARKS=true`
- AI benchmarks are capped at 5 OpenAI calls per run
- If budget would be exceeded, abort gracefully
- Never run AI benchmarks in CI without explicit opt-in

---

## Architecture

```
benchmarks/
├── runner.ts              ← Entry point, CLI arg parsing, suite orchestration
├── lib/
│   └── harness.ts         ← assert(), assertInRange(), BenchmarkSuite class, printSummary()
├── fit-analysis/
│   ├── fixtures.ts        ← 10 representative job descriptions with expected ranges
│   └── fit-analysis.bench.ts
├── capability-matching/
│   └── capability.bench.ts
├── materials/
│   └── materials.bench.ts
├── discovery/
│   └── discovery.bench.ts
├── ingestion/
│   └── ingestion.bench.ts
└── regression/
    └── regression.bench.ts
```

The harness provides:
- `BenchmarkSuite` — collects test cases, runs them, prints results
- `assert()`, `assertEqual()`, `assertInRange()`, `assertNotEmpty()`, `assertContainsAny()` — simple assertions
- `printSummary()` — prints final PASS/FAIL summary, returns exit code

---

## Integration with CI

The benchmark runner exits with code 1 on any failure, making it suitable for:

```yaml
# GitHub Actions
- name: Run benchmarks
  run: npm run benchmarks
```

Future CI pipeline (from CI_PLAN.md):
1. `npm run build`
2. `npx tsc --noEmit`
3. `npm run lint`
4. `npm run benchmarks`

All four must pass before any merge.

---

## See Also

- **[BENCHMARK_STRATEGY.md](BENCHMARK_STRATEGY.md)** — Benchmark philosophy and fixture format
- **[SPRINT_RULES.md](SPRINT_RULES.md)** — Quality gates and sprint rules
- **[CI_PLAN.md](CI_PLAN.md)** — CI pipeline integration
- **[../reports/SPRINT_14_BENCHMARK_REPORT.md](../reports/SPRINT_14_BENCHMARK_REPORT.md)** — Benchmark foundation report
- **[../decisions/ADR-001-deterministic-first.md](../decisions/ADR-001-deterministic-first.md)** — Deterministic-first decision

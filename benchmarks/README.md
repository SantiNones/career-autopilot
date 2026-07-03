# Benchmarks

Deterministic regression protection for Career Autopilot.

**Default runs cost $0.** No OpenAI calls unless explicitly opted in.

## Quick Start

```bash
# Run all benchmarks (deterministic, $0)
npm run benchmarks

# Run specific suite
npx tsx benchmarks/runner.ts --suite fit-analysis
npx tsx benchmarks/runner.ts --suite capability-matching
npx tsx benchmarks/runner.ts --suite materials
npx tsx benchmarks/runner.ts --suite discovery
npx tsx benchmarks/runner.ts --suite ingestion

# Run AI benchmarks (optional, costs ~$0.25 max)
ALLOW_OPENAI_BENCHMARKS=true npm run benchmarks:ai
```

## Structure

```
benchmarks/
├── runner.ts                  # Main benchmark runner
├── lib/                       # Shared benchmark utilities
│   └── harness.ts             # Test harness (assert, report)
├── fit-analysis/              # Fit Analysis V4 scoring benchmarks
│   ├── fixtures.ts            # Representative job fixtures
│   └── fit-analysis.bench.ts  # Benchmark suite
├── capability-matching/       # Capability mapper + matcher
│   └── capability.bench.ts    # Deterministic matching tests
├── materials/                 # Material generation quality
│   └── materials.bench.ts     # Structure + evidence checks
├── discovery/                 # Discovery scoring baseline
│   └── discovery.bench.ts     # Score distribution + quality
├── ingestion/                 # Job parsing + ingestion
│   └── ingestion.bench.ts     # Parse correctness + edge cases
└── regression/                # Cross-cutting regression checks
    └── regression.bench.ts    # Score stability, type safety
```

## Principles

1. **$0 by default** — No LLM calls in standard benchmark runs
2. **Deterministic** — Same inputs always produce same outputs
3. **Score ranges, not exact scores** — Algorithms may improve within acceptable bounds
4. **Evidence-based** — Benchmarks verify behavior, not implementation
5. **Simple** — Each benchmark is a function that returns pass/fail

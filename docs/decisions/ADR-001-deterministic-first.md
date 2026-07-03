# ADR-001: Deterministic First

**Status:** Accepted  
**Date:** 2025-06  
**Category:** Architecture

## Context

Career Autopilot processes job descriptions, matches capabilities, generates materials, and scores fit. Each step could use AI (LLM) or deterministic logic.

LLM calls introduce:
- **Non-determinism** — same input produces different output across runs
- **Cost** — every OpenAI call costs money
- **Latency** — 1–5 seconds per call vs <1ms for local computation
- **Debugging difficulty** — hard to reproduce failures
- **Testing difficulty** — impossible to write deterministic regression tests

## Decision

**All processing must be deterministic by default.** AI is used only when deterministic approaches are insufficient, and always as an enhancement layer, never as a foundation.

Concrete rules:
1. Capability mapping uses a local taxonomy, not LLM extraction
2. Evidence matching uses confidence tiers (exact, capability, adjacent), not LLM similarity
3. Material templates use deterministic generation before offering AI enhancement
4. Scoring uses structured formulas with inspectable components
5. Every subsystem must function without any OpenAI API key configured

## Consequences

- **Positive:** Benchmarks run in 24ms at $0 cost, providing instant regression protection
- **Positive:** Scoring is reproducible — same job always gets same score
- **Positive:** Debugging is straightforward — inspect inputs, trace logic
- **Positive:** No vendor lock-in to OpenAI for core functionality
- **Negative:** Deterministic capability mapping may miss nuanced matches that LLMs would catch
- **Negative:** Template-generated materials are less polished than LLM-generated ones
- **Negative:** Requires maintaining a capability taxonomy manually

## Alternatives Considered

1. **LLM-first architecture** — rejected due to cost, non-determinism, and testing impossibility
2. **Hybrid with LLM as primary** — rejected because it makes the foundation non-deterministic
3. **Deterministic with optional LLM enhancement** — **selected** — best balance of reliability and quality

## See Also

- [BENCHMARK_GUIDE.md](../engineering/BENCHMARK_GUIDE.md) — $0 deterministic benchmarks
- [ADR-005-evidence-grounding.md](ADR-005-evidence-grounding.md) — evidence-based generation

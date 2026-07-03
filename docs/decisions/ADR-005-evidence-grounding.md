# ADR-005: Evidence Grounding

**Status:** Accepted  
**Date:** 2025-06  
**Category:** Architecture

## Context

Job application materials (CVs, cover letters, recruiter messages) must describe the candidate's experience accurately. AI-generated content frequently fabricates experience — inventing projects, inflating responsibilities, or claiming skills the candidate doesn't have.

In a job search context, fabrication is especially dangerous:
- **Interview exposure** — candidates are asked to elaborate on claims they can't defend
- **Professional credibility** — discovered fabrication permanently damages reputation
- **Trust erosion** — users lose trust in the tool if they can't verify claims
- **Ethical obligation** — career tools must represent candidates honestly

## Decision

**All generated content must be grounded in verifiable evidence from the candidate's profile, resume, and experience.**

Concrete rules:
1. **Evidence inventory** — before generating materials, build a structured inventory of claims, projects, skills, and experiences from source data
2. **No invention** — materials may only reference experience present in the evidence inventory
3. **Benchmark enforcement** — benchmarks verify materials don't contain fabricated content
4. **Transparent sourcing** — each claim should be traceable to a source document
5. **Gaps are acknowledged** — if the candidate lacks experience, say so or omit; never fabricate

## Consequences

- **Positive:** Every claim in generated materials can be defended in an interview
- **Positive:** Users can trust the output without line-by-line verification
- **Positive:** Benchmarks can programmatically detect fabrication
- **Positive:** Builds genuine competitive advantage from real experience
- **Negative:** Materials may be shorter or less impressive than fabricated alternatives
- **Negative:** Requires maintaining an evidence inventory pipeline
- **Negative:** Some formatting creativity is constrained by available evidence

## Alternatives Considered

1. **Unconstrained LLM generation** — rejected; fabrication risk too high
2. **LLM with "be truthful" prompts** — rejected; prompts don't prevent hallucination reliably
3. **Evidence-grounded generation with inventory** — **selected** — only approach that provides verifiable guarantees
4. **Human-only materials** — rejected; defeats the purpose of automation

## See Also

- [ADR-001-deterministic-first.md](ADR-001-deterministic-first.md) — deterministic approach complements evidence grounding
- [BENCHMARK_GUIDE.md](../engineering/BENCHMARK_GUIDE.md) — material generation benchmarks verify non-fabrication
- [SYSTEM_CONTRACTS.md](../architecture/SYSTEM_CONTRACTS.md) — evidence engine contract

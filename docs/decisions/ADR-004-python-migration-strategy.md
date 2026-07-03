# ADR-004: Python Backend Migration Strategy

**Status:** Proposed  
**Date:** 2025-07  
**Category:** Architecture

## Context

Career Autopilot is built as a monolithic Next.js application with all business logic in TypeScript. The Sprint 1 architecture audit identified that a Python backend would provide:
- Better ML/AI ecosystem (scikit-learn, spaCy, transformers, LangChain)
- More natural fit for data processing pipelines
- Stronger typing with Pydantic
- Better async patterns for job scraping and API calls
- Industry-standard tooling for NLP and capability extraction

However, a full rewrite is risky and unnecessary. The current TypeScript codebase works and has benchmark coverage.

## Decision

**Migrate to Python incrementally using a strangler fig pattern, starting with the intelligence layer.**

Migration order (from Sprint 1 audit):
1. **Candidate Intelligence** — Python excels at NLP, profile analysis
2. **Evidence Engine** — data extraction and structuring
3. **Discovery Service** — provider integration, scraping
4. **Fit Analysis** — scoring model with ML potential
5. **Material Generation** — LLM orchestration with LangChain

Keep in TypeScript (Next.js):
- Frontend (React components)
- API routes (thin orchestration layer)
- Database access (Prisma)
- Export/formatting

## Consequences

- **Positive:** Access to Python ML ecosystem
- **Positive:** Incremental migration reduces risk — rollback per subsystem
- **Positive:** Existing benchmarks validate contract compatibility
- **Positive:** Frontend stays in Next.js — no full rewrite
- **Negative:** Two-language codebase increases maintenance complexity
- **Negative:** Inter-process communication overhead (HTTP/gRPC between Next.js and Python)
- **Negative:** Deployment complexity increases (two services)
- **Negative:** Requires contract tests to ensure Python produces identical outputs

## Alternatives Considered

1. **Stay TypeScript** — viable but limits AI/ML capabilities
2. **Full Python rewrite** — rejected; too risky, loses working frontend
3. **Python microservices** — rejected for Stage 1; premature decomposition
4. **Strangler fig migration** — **selected** — best balance of progress and safety

## See Also

- [SPRINT_1_ARCHITECTURE_AUDIT.md](../reports/SPRINT_1_ARCHITECTURE_AUDIT.md) — Python architecture review
- [ARCHITECTURE.md](../architecture/ARCHITECTURE.md) — current system design
- [BENCHMARK_GUIDE.md](../engineering/BENCHMARK_GUIDE.md) — contract validation for migration

# Career Autopilot — Documentation

> AI-powered job search automation for career optimization.

## How This Documentation Is Organized

Documentation is organized by **responsibility**, not chronology:

```
docs/
├── README.md                  ← You are here
├── architecture/              ← System design, data flows, contracts
├── product/                   ← Vision, principles, spec, health
├── engineering/               ← Standards, benchmarks, CI, roadmap
├── reports/                   ← Sprint reports, audits, benchmarks
└── decisions/                 ← Architecture Decision Records (ADRs)
```

---

## Document Index

### Architecture — System Design & Contracts

| Document | Type | Description |
|----------|------|-------------|
| [ARCHITECTURE.md](architecture/ARCHITECTURE.md) | Living Document | System architecture, data flows, module classification |
| [DEPENDENCY_MAPS.md](architecture/DEPENDENCY_MAPS.md) | Reference | Subsystem responsibilities, inputs, outputs, dependencies |
| [SYSTEM_CONTRACTS.md](architecture/SYSTEM_CONTRACTS.md) | Reference | Inputs, outputs, guarantees, failure modes, invariants |

### Product — Vision, Strategy & Health

| Document | Type | Description |
|----------|------|-------------|
| [VISION.md](product/VISION.md) | Living Document | Product vision and long-term direction |
| [PRODUCT_EVOLUTION.md](product/PRODUCT_EVOLUTION.md) | Living Document | 5-stage product evolution roadmap |
| [PRODUCT_PRINCIPLES.md](product/PRODUCT_PRINCIPLES.md) | Engineering Standard | Product, engineering, AI, cost, and UX principles |
| [SPEC.md](product/SPEC.md) | Reference | Full product specification |
| [PRODUCT_HEALTH.md](product/PRODUCT_HEALTH.md) | Living Document | Subsystem health scores and status |
| [PROJECT_CONTEXT.md](product/PROJECT_CONTEXT.md) | Reference | Original project context and background |

### Engineering — Standards, Tools & Planning

| Document | Type | Description |
|----------|------|-------------|
| [SPRINT_RULES.md](engineering/SPRINT_RULES.md) | Engineering Standard | Sprint philosophy, operating rules, quality gates |
| [BENCHMARK_GUIDE.md](engineering/BENCHMARK_GUIDE.md) | Engineering Standard | How to run, write, and maintain benchmarks |
| [BENCHMARK_STRATEGY.md](engineering/BENCHMARK_STRATEGY.md) | Reference | Benchmark philosophy, fixture format, future plans |
| [CI_PLAN.md](engineering/CI_PLAN.md) | Reference | Lightweight CI pipeline proposal |
| [KNOWN_ISSUES.md](engineering/KNOWN_ISSUES.md) | Living Document | Confirmed bugs and technical debt |
| [ROADMAP.md](engineering/ROADMAP.md) | Living Document | Sprint status, deliverables, and future plans |
| [DISCOVERY_AUDIT.md](engineering/DISCOVERY_AUDIT.md) | Reference | Discovery subsystem audit and analysis |

### Reports — Sprint Deliverables & Audits

| Document | Type | Description |
|----------|------|-------------|
| [SPRINT_075_REPORT.md](reports/SPRINT_075_REPORT.md) | Historical Report | Documentation consistency and architecture review |
| [SPRINT_1_ARCHITECTURE_AUDIT.md](reports/SPRINT_1_ARCHITECTURE_AUDIT.md) | Historical Report | Architecture, scalability, and future growth audit |
| [SPRINT_14_BENCHMARK_REPORT.md](reports/SPRINT_14_BENCHMARK_REPORT.md) | Historical Report | Benchmark foundation setup report |
| [CALIBRATION_SIMULATION_REPORT.md](reports/CALIBRATION_SIMULATION_REPORT.md) | Historical Report | Model D fit analysis calibration results |
| [CAPABILITY_BENCHMARK_REPORT.md](reports/CAPABILITY_BENCHMARK_REPORT.md) | Historical Report | V3 vs V4 capability matching comparison |
| [SPRINT_145_DOCS_REPORT.md](reports/SPRINT_145_DOCS_REPORT.md) | Historical Report | Documentation organization report |

### Decisions — Architecture Decision Records

| Document | Type | Description |
|----------|------|-------------|
| [ADR-001-deterministic-first.md](decisions/ADR-001-deterministic-first.md) | Architecture | Deterministic processing before AI |
| [ADR-002-human-approval-required.md](decisions/ADR-002-human-approval-required.md) | Architecture | No autonomous job applications |
| [ADR-003-single-user-architecture.md](decisions/ADR-003-single-user-architecture.md) | Architecture | Stage 1 single-user design |
| [ADR-004-python-migration-strategy.md](decisions/ADR-004-python-migration-strategy.md) | Architecture | Python backend migration approach |
| [ADR-005-evidence-grounding.md](decisions/ADR-005-evidence-grounding.md) | Architecture | Evidence-based content generation |

---

## Reading Guides

### For New Engineers

1. **Start here:** [VISION.md](product/VISION.md) — understand what we're building and why
2. **Architecture:** [ARCHITECTURE.md](architecture/ARCHITECTURE.md) — system design, data flows
3. **Spec:** [SPEC.md](product/SPEC.md) — full product spec with features
4. **Contracts:** [SYSTEM_CONTRACTS.md](architecture/SYSTEM_CONTRACTS.md) — subsystem guarantees
5. **Standards:** [SPRINT_RULES.md](engineering/SPRINT_RULES.md) — how we work
6. **Health:** [PRODUCT_HEALTH.md](product/PRODUCT_HEALTH.md) — current system status
7. **Benchmarks:** [BENCHMARK_GUIDE.md](engineering/BENCHMARK_GUIDE.md) — how to validate changes
8. **Issues:** [KNOWN_ISSUES.md](engineering/KNOWN_ISSUES.md) — what's broken

### For AI Coding Agents

1. **[ARCHITECTURE.md](architecture/ARCHITECTURE.md)** — module locations, data flows
2. **[DEPENDENCY_MAPS.md](architecture/DEPENDENCY_MAPS.md)** — what depends on what
3. **[SYSTEM_CONTRACTS.md](architecture/SYSTEM_CONTRACTS.md)** — inputs, outputs, invariants
4. **[SPRINT_RULES.md](engineering/SPRINT_RULES.md)** — operating rules and forbidden actions
5. **[BENCHMARK_GUIDE.md](engineering/BENCHMARK_GUIDE.md)** — how to validate changes
6. **[KNOWN_ISSUES.md](engineering/KNOWN_ISSUES.md)** — existing bugs to avoid
7. **ADRs** in [decisions/](decisions/) — key architectural choices

### For Recruiters / Portfolio Review

1. **[VISION.md](product/VISION.md)** — product vision and ambition
2. **[PRODUCT_EVOLUTION.md](product/PRODUCT_EVOLUTION.md)** — growth roadmap
3. **[SPRINT_1_ARCHITECTURE_AUDIT.md](reports/SPRINT_1_ARCHITECTURE_AUDIT.md)** — engineering rigor
4. **[PRODUCT_PRINCIPLES.md](product/PRODUCT_PRINCIPLES.md)** — engineering philosophy

---

## Document Types

| Type | Meaning | Examples |
|------|---------|---------|
| **Living Document** | Actively updated as the system evolves | ARCHITECTURE, ROADMAP, KNOWN_ISSUES |
| **Historical Report** | Immutable record of a completed sprint | Sprint reports, audit reports |
| **Reference** | Stable information, updated infrequently | SPEC, DEPENDENCY_MAPS, PROJECT_CONTEXT |
| **Engineering Standard** | Rules and processes that govern development | SPRINT_RULES, BENCHMARK_GUIDE |
| **Architecture** | Technical decisions with context and rationale | ADRs |

---

## Quick Commands

```bash
npm run benchmarks      # 89 tests, $0, ~24ms
npm run validate        # build + typecheck + lint + benchmarks
```

---

## Related

- **[benchmarks/README.md](../benchmarks/README.md)** — Benchmark suite overview
- **[AGENTS.md](../AGENTS.md)** — AI agent instructions
- **[README.md](../README.md)** — Project root README

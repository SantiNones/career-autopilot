# Career Autopilot — Sprint Rules & Engineering Philosophy

Last updated: 2026-07-01  
Owner: Santiago Nones

---

## Engineering Philosophy

Career Autopilot must remain understandable.

Every new subsystem must satisfy:

- **Single responsibility** — One module does one thing well
- **Easy to debug** — Clear inputs, outputs, and error messages
- **Cheap to test** — Deterministic behavior can be tested without LLM calls
- **Cheap to run** — Minimize per-user operating cost
- **Deterministic whenever possible** — Same inputs → same outputs
- **Cached whenever possible** — Don't recompute what hasn't changed
- **Replaceable** — Any module can be swapped without rewriting the rest

---

## Feature Gate Questions

Before adding any feature, answer:

1. **Does this help the user get better jobs?**
2. **Does this reduce application time?**
3. **Can another engineer understand this subsystem in under 30 minutes?**
4. **Is there a deterministic solution before using AI?**
5. **What is the estimated operating cost per user?**

If the answer to #1 or #2 is "no", it does not belong in V1.

---

## Operating Principles

```
Cheap deterministic systems for scale
+
AI only for high-value moments
+
Strict usage limits
+
Cache everywhere
```

### What This Means In Practice

- Do NOT use LLM calls for every discovered job
- Prefer deterministic parsing, scoring, filtering, caching, and validation
- Use AI mainly for: candidate intelligence, material generation, positioning strategy, selected job analysis
- Every expensive operation must have: caching, logs, and visible failure states
- Avoid feature creep until the core loop works reliably

---

## Sprint Operating Rules

### Command Budget

| Sprint Type | Default Budget |
|-------------|---------------|
| Audit / Documentation | 40 commands |
| Deterministic feature | 40 commands |
| LLM-dependent feature | 50 commands |

If more commands are needed:
1. Stop
2. Explain why
3. Ask for approval

### OpenAI Budget

| Sprint Type | Default Budget |
|-------------|---------------|
| Audit / Deterministic | $0.25 max |
| Materials / CI sprints | $1.00 max |

If more spend is needed:
1. Stop
2. Explain expected usage
3. Ask for approval

---

## Development Rules

### Before Changing Code

- [ ] Inspect existing data/behavior before changing logic
- [ ] Read relevant files completely before editing
- [ ] Understand the data flow end-to-end

### Code Quality

- [ ] No silent catches around LLM/API calls
- [ ] Pure functions must have cheap offline tests
- [ ] No user-specific hardcoded logic in production paths
- [ ] All numeric outputs must be bounded (no NaN, no Infinity)

### Efficiency

- [ ] Do not rerun expensive benchmarks for one-line changes
- [ ] Batch fixes before validation
- [ ] Prefer deterministic systems first, add AI only when needed
- [ ] Cache all AI outputs where possible

### Documentation

- [ ] Add known issues to KNOWN_ISSUES.md before moving on
- [ ] Update ROADMAP.md after completing a sprint
- [ ] Update ARCHITECTURE.md if data flows change
- [ ] Keep dependency maps current

---

## Benchmark-Driven Development

Benchmarks are not optional. They are a first-class engineering practice.

### Rules

1. Define expected behavior as fixtures **before** implementing features
2. Run benchmarks after every significant change
3. Never merge code that regresses benchmark scores without explicit approval
4. Keep benchmarks cheap to run (deterministic-first, no LLM by default)
5. Benchmarks are living documentation of system behavior

### When a Benchmark Fails

1. Do NOT delete or weaken the benchmark
2. Investigate root cause
3. If change is intentional: document why, update fixture, add comment
4. If change is a bug: revert or fix, add additional fixture

---

## Sprint Workflow

```
1. Read SPEC.md + ROADMAP.md + KNOWN_ISSUES.md
   ↓
2. Understand current state
   ↓
3. Plan deliverables (list concrete outputs)
   ↓
4. Implement (following rules above)
   ↓
5. Run quality gates:
   - npm run typecheck
   - npm run lint
   - npm run build
   - npm run test:benchmarks (when available)
   ↓
6. Update documentation:
   - ROADMAP.md (mark sprint complete)
   - KNOWN_ISSUES.md (add any new issues found)
   - ARCHITECTURE.md (if flows changed)
   ↓
7. Summary + approval request
```

---

## Quality Gates (per sprint, in order)

1. `npx tsc --noEmit` — TypeScript passes
2. `npm run lint` — ESLint passes
3. `npm run build` — Production build succeeds
4. `npm run test:benchmarks` — Deterministic benchmarks pass (when available)

All four must pass before a sprint is considered complete.

---

## Things That Must Never Happen

- Pushing directly to main without review
- Deleting or weakening tests without explicit approval
- Silent error swallowing around LLM calls
- Running expensive AI operations without user trigger
- Hardcoding user-specific data in production paths
- Committing .env or secrets
- Weakening system contracts without documenting why
- Leaving known issues undocumented

---

## Cost Discipline

| Operation | Acceptable Cost | Trigger |
|-----------|----------------|---------|
| Discovery scoring | $0 | User-triggered |
| Heuristic scoring | $0 | Automatic on ingest |
| Fit Analysis V4 | ~$0.02-0.05 | Automatic on ingest (async) |
| Candidate Intelligence | ~$0.05-0.15 | User-triggered only |
| Material Generation | ~$0.10-0.30 | User-triggered only |
| Positioning Strategy | ~$0.05-0.15 | User-triggered only |
| Experience Intelligence | ~$0.03-0.10 | User-triggered only |

### Cost Rules

- Never call OpenAI without the user explicitly triggering it (except fit analysis on ingest)
- Never call OpenAI in a loop over all jobs
- Cache expensive results to avoid re-computation
- Log token usage for every LLM call
- Display approximate cost to user before expensive operations

---

## Portfolio Project Standards

Career Autopilot is also a portfolio project. This means:

- **Code quality matters** — Clean, readable, well-organized code
- **Architecture matters** — Decisions should be explainable in an interview
- **Documentation matters** — Any engineer should understand the system quickly
- **Maintainability matters** — Code written today should be easy to modify in 6 months
- **Demo-ability matters** — The system should be impressive when shown

Every technical decision should be defensible in a technical interview:
- "Why did you choose this architecture?"
- "How do you handle scoring consistency?"
- "How do you control LLM costs?"
- "How do you prevent hallucination in materials?"
- "What's your testing strategy?"

---

## See Also

- **[../product/PRODUCT_PRINCIPLES.md](../product/PRODUCT_PRINCIPLES.md)** — Product and engineering principles
- **[BENCHMARK_GUIDE.md](BENCHMARK_GUIDE.md)** — How to validate changes
- **[ROADMAP.md](ROADMAP.md)** — Sprint status and planning
- **[KNOWN_ISSUES.md](KNOWN_ISSUES.md)** — Current bugs and debt

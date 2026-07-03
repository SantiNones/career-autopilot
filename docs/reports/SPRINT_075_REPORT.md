# Sprint 0.75 — Vision Alignment Report

Last updated: 2026-07-01  
Owner: Santiago Nones  
Reference: VISION.md (constitution)

---

## Deliverable 4 — Documentation Consistency Report

After reviewing all 12 documents against VISION.md, the following inconsistencies were found.

### Contradictions

| # | Document A | Document B | Inconsistency | Recommendation |
|---|-----------|-----------|---------------|----------------|
| C1 | **VISION.md** | **SPEC.md** §1 | VISION.md defines the product as a "Career Operating System" and a "decision-support platform." SPEC.md §1 defines the essential V1 purpose as "Find relevant jobs → Rank → Generate materials → Track applications." SPEC.md is narrower and more tactical — it describes a job application assistant, not a career operating system. | SPEC.md should be updated to frame V1 capabilities as Stage 1 of the Career Operating System. The four V1 tasks are features, not the product mission. |
| C2 | **VISION.md** | **SPEC.md** §11 | VISION.md says the product is NOT a resume builder or cover letter generator ("Those may exist as features. They are not the product."). SPEC.md §11 defines success in V1 terms: "Does this help the user get better jobs or spend less time applying?" The SPEC.md framing centers job applications; the vision centers career intelligence. | SPEC.md's success criteria should be expanded. "Better jobs" aligns, but "spend less time applying" is narrow. Add: "Does this help the user make better career decisions?" |
| C3 | **VISION.md** | **PRODUCT_PRINCIPLES.md** (old P1) | Old principle 1 was: "Optimize for user outcomes, not AI sophistication." This was updated to "Optimize for career outcomes, not activity" which now aligns. However, the original formulation ("get a better job faster") still exists in SPRINT_RULES.md Feature Gate Question #1: "Does this help the user get better jobs?" | SPRINT_RULES.md Feature Gate Questions should be updated to: "Does this help the user make better career decisions?" to match VISION.md. |
| C4 | **VISION.md** | **SPRINT_RULES.md** §Feature Gates | SPRINT_RULES.md Feature Gate #2 asks: "Does this reduce application time?" VISION.md explicitly says the product "should never optimize for submitting the highest number of applications." Reducing application time could encourage more applications, which is directly counter to the vision. | Replace SPRINT_RULES.md Feature Gate #2 with: "Does this improve career decision quality?" |

### Duplicated Concepts

| # | Document A | Document B | Duplication | Recommendation |
|---|-----------|-----------|-------------|----------------|
| D1 | **SPEC.md** §0 | **SPRINT_RULES.md** §Operating Principles | Both contain the same "Cheap deterministic systems for scale + AI only for high-value moments + strict usage limits + cache everywhere" block. | Keep in SPRINT_RULES.md as the operating reference. SPEC.md should reference SPRINT_RULES.md instead of duplicating. |
| D2 | **SPEC.md** §11 | **PRODUCT_PRINCIPLES.md** | SPEC.md §11 ("Product Principle") lists 7 subsystem requirements (single responsibility, easy to debug, etc.) that are now fully covered by PRODUCT_PRINCIPLES.md §Engineering Principles (principles 11-17). | SPEC.md §11 should reference PRODUCT_PRINCIPLES.md instead of maintaining a separate, shorter version. |
| D3 | **SPEC.md** §8 | **SPRINT_RULES.md** | SPEC.md §8 ("Sprint Operating Rules For Devin") duplicates command budgets, OpenAI budgets, and development rules that are fully detailed in SPRINT_RULES.md. | SPEC.md §8 should be replaced with a reference to SPRINT_RULES.md. |
| D4 | **PRODUCT_HEALTH.md** | **KNOWN_ISSUES.md** | Both documents describe the same problems. PRODUCT_HEALTH.md lists them as "weaknesses" with priority fixes. KNOWN_ISSUES.md lists them as numbered issues with full detail. | Acceptable duplication — different purposes. PRODUCT_HEALTH.md is the overview; KNOWN_ISSUES.md is the detailed tracker. Keep both but ensure they reference each other. |
| D5 | **SPEC.md** §6 | **ROADMAP.md** | Both contain the same sprint plan with the same deliverables. | SPEC.md sprint plan should be removed or replaced with a reference to ROADMAP.md. ROADMAP.md is the living document. |

### Outdated Assumptions

| # | Document | Assumption | Why Outdated | Recommendation |
|---|----------|-----------|--------------|----------------|
| O1 | **SPEC.md** §1 | "Non-essential future features should not distract from V1." | With VISION.md, there is now a 5-stage evolution framework. The Stage 2+ capabilities are not distractions — they are the product direction. | Reframe: "V1 capabilities must be reliable before expanding to Stage 2. But Stage 2+ design should inform Stage 1 architecture." |
| O2 | **SPEC.md** header | "Primary goal: make Career Autopilot a serious product for job discovery, ranking, application material generation, and application tracking." | This is a Stage 1 description. VISION.md redefines the primary goal as "help people make better career decisions." | Update SPEC.md header to: "Primary goal: build the intelligence layer that helps people make better career decisions. V1 focus: discovery, ranking, materials, tracking." |
| O3 | **ARCHITECTURE.md** §Key Decisions #2 | "Single-User Architecture — No auth system." | PRODUCT_EVOLUTION.md Stage 2 requires multi-user. This decision is described as permanent but should be described as temporary. | Reword to: "Single-User Architecture (Stage 1) — No auth system currently. Multi-user support is a Stage 2 requirement." |
| O4 | **ROADMAP.md** | No reference to VISION.md or product stages. Sprint plan is purely feature-driven. | With VISION.md, sprints should be contextualized within the Stage 1 roadmap. | Add a row: "Stage 1 completion target: Sprint 6" and reference PRODUCT_EVOLUTION.md. |
| O5 | **BENCHMARK_STRATEGY.md** | No mention of career outcome benchmarks. All benchmarks measure system behavior (scoring accuracy, classifier correctness). | VISION.md success metrics include: "apply to better opportunities, receive more interviews, receive better offers, understand why they succeed or fail." | Add a future section: "Stage 2 Benchmarks — Career Outcome Metrics" covering interview rate improvement, offer quality, etc. |
| O6 | **CI_PLAN.md** | References "Devin" as the AI agent. | Sprint rules now reference AI agents generically. | Replace "Devin" references with "AI agents" or remove agent-specific references. |
| O7 | **SPEC.md** §8 header | "Sprint Operating Rules For Devin" | Same as O6. | Rename to "Sprint Operating Rules" and reference SPRINT_RULES.md. |

### Roadmap Items That No Longer Fit the Vision

| # | Roadmap Item | Concern | Recommendation |
|---|-------------|---------|----------------|
| R1 | Sprint 6 — "LinkedIn post" and "Landing page" | These are marketing/distribution activities, not product development. They don't strengthen the intelligence layer. | Keep in Sprint 6 but categorize separately as "Go-To-Market" rather than product deliverables. They support portfolio goals, not product goals. |
| R2 | None of Sprints 1-6 include outcome tracking | VISION.md says the system should "learn from outcomes." The roadmap has no sprint for building the outcome feedback loop. | Add outcome tracking to Sprint 2 or Sprint 4. At minimum: did the user get an interview? Did they get an offer? This data enriches the intelligence layer per VISION.md. |

---

## Deliverable 5 — Architecture Review

### 1. Does the roadmap still support the product vision?

**Partially.** The current roadmap (Sprints 0-6) is a solid Stage 1 plan. It addresses the most pressing quality issues (discovery, pipeline UX, materials, fit stability, onboarding, polish).

However, the roadmap is **missing three elements** that VISION.md requires:

- **Outcome feedback loop** — No sprint builds the "learn from outcomes" capability. The system tracks applications through statuses but never records *why* a user was rejected or *what* made an interview successful. This is the foundation of "continuous enrichment" from VISION.md.
- **Career strategy** — The roadmap builds features around individual applications. VISION.md describes a system that helps users answer "What is the highest-impact thing I can do today to improve my career?" None of the current sprints address this.
- **Intelligence layer as primary output** — The roadmap focuses on feature completeness (filters, search, editing, export). VISION.md focuses on the intelligence layer growing over time. The roadmap should include a sprint (or sprint items) that make the intelligence layer *visible* to the user — not just as inputs to scoring, but as a first-class view they can explore.

**Recommendation:** The roadmap is valid for Stage 1 completion. Add outcome tracking to Sprint 2 or 4. Plan a "Career Intelligence Dashboard" for post-Sprint 6 work.

### 2. Which subsystem provides the greatest long-term value?

**Candidate Intelligence + Evidence Engine.**

These two subsystems are the foundation of everything VISION.md describes. The intelligence layer is what makes Career Autopilot a Career Operating System rather than a job application tool.

Every future capability depends on the intelligence layer:
- Fit Analysis uses it for evidence matching
- Materials use it for grounded content
- Discovery should use it for personalized ranking (currently doesn't — DA-1)
- Gap Analysis needs it to identify missing capabilities
- Career Strategy needs it to model trajectory options
- Learning Recommendations need it to identify growth areas

If the intelligence layer is accurate, deep, and continuously enriched, every feature built on top of it improves. If the intelligence layer is shallow or stale, nothing downstream can compensate.

### 3. Which subsystem should eventually disappear?

**Heuristic Job Scoring (`jobScoring.ts`).**

This was the right first implementation — a fast, deterministic, keyword-based scorer. But as Fit Analysis V4 matures and the intelligence layer deepens, heuristic scoring becomes redundant.

V4 already produces better scores because it matches evidence to requirements rather than counting keywords. The heuristic scorer should eventually be replaced by a lightweight V4 pass (using cached requirements) for initial scoring at ingest time.

The transition should be gradual:
1. First, ensure V4 is stable and cacheable
2. Then, use V4 for re-scoring (already done)
3. Finally, replace heuristic scoring at ingest with a fast V4 pass
4. Keep heuristic scoring as a fallback when CI doesn't exist yet

**Also eventually disappear: the V2 fit analysis layer in discovery scoring.** This fake-data analysis layer adds complexity without value. It should be replaced by either (a) real CI data feeding V4, or (b) removal entirely in favor of the V1.3 classifier-based scoring.

### 4. Which subsystem is becoming technical debt?

**Discovery Scoring (`discoveryScoring.ts`).**

This subsystem has accumulated the most technical debt in the codebase:
- DA-1: Hardcoded fake candidate profile
- DA-2: Double bonus application
- DA-3: Score inflation at cap
- DA-4: Source distribution skew
- DA-5: Spotify duplicate

Beyond these known issues, the module violates two VISION.md principles:
- **"Understand once, reuse forever"** — Discovery scoring builds a fake candidate profile instead of using the real intelligence layer
- **"Explainable recommendations"** — The stacking of V1.3 bonuses + V2 fit analysis + classifiers + base scoring creates a scoring stack that no user could trace

Each sprint that adds features without fixing discovery scoring makes the debt worse.

### 5. Which architectural decisions should never change?

1. **Deterministic-first scoring.** The principle that scoring, classification, and matching should be deterministic by default must never change. This is the foundation of testability, cost control, and reliability.

2. **Evidence grounding.** Materials and intelligence must always be grounded in real user data (resume, projects, experience). The system must never invent experience. This is a trust-critical invariant.

3. **Human approval for external actions.** The system must never send applications, emails, or messages without explicit user approval. This protects users from irreversible career actions.

4. **Capability-based matching.** The V4 approach (extract requirements → match evidence → score coverage) is architecturally sound and extensible. The specific scoring weights may change, but the evidence-based matching paradigm should not.

5. **Separation of intelligence and presentation.** The intelligence layer (CI, evidence, capabilities) is separate from how it's presented (materials, scores, recommendations). This separation must survive all future changes.

### 6. What would you design differently if starting today?

1. **Intelligence layer first.** I would build the CI + Evidence Engine before any scoring or discovery. Currently, discovery scoring uses a fake candidate profile because the intelligence layer didn't exist when discovery was built. If CI existed first, every subsystem would consume real intelligence from day one.

2. **Auth from the start.** Single-user was pragmatic but creates the hardest-to-retrofit architectural decision. Every `findFirst()` query needs a user ID. This affects every file in the codebase. Starting with auth (even simple magic-link) would have saved significant future work.

3. **Unified scoring pipeline.** Currently there are three scoring systems: heuristic (`jobScoring.ts`), discovery (`discoveryScoring.ts`), and V4 (`fitAnalysisV4.ts`). I would design one scoring pipeline with different "depth" levels: Level 1 (keyword match, ~1ms, no CI needed), Level 2 (classifier-based, ~5ms, no CI needed), Level 3 (evidence-based, ~100ms, CI required, cached requirements). Each level subsumes the previous.

4. **Caching from the start.** The single biggest architectural gap is the lack of caching. I would have added input-hash-based caching to every LLM call from the beginning. This eliminates score instability, reduces cost, and enables cheap re-scoring.

5. **Event-sourced career history.** Instead of overwriting application statuses, I would record every state change as an event: "applied on date X," "interviewed on date Y," "rejected with reason Z." This naturally builds the outcome tracking that VISION.md requires.

### 7. Which future features should be rejected because they violate the product vision?

1. **Auto-apply.** Any feature that automatically submits applications without per-application user approval violates Principle 5 ("Human approves every external action") and VISION.md ("Humans always approve actions that affect the outside world"). This includes batch-apply, one-click-apply-all, and scheduled applications.

2. **AI chatbot interface.** VISION.md explicitly says the product should never feel like "ChatGPT with buttons" or "a prompt playground." A conversational interface for career advice would shift the product away from structured decision support toward unstructured chat. Career Autopilot should present structured options and evidence, not generate open-ended conversational responses.

3. **LinkedIn automation.** Auto-posting, auto-messaging, or auto-connecting on LinkedIn violates the human-approval principle and positions the product as a LinkedIn tool rather than a career system. LinkedIn integration should be read-only (import profile data) or user-initiated (export content for manual posting).

4. **Per-job LLM calls at discovery scale.** Running GPT-4o on every discovered job (potentially hundreds per run) violates cost discipline, determinism principles, and scalability requirements. Discovery scoring must remain deterministic. LLM calls should only happen for jobs the user explicitly selects.

5. **Generic AI career coaching.** A feature that asks "What should I do with my career?" and returns a GPT response violates the explainability principle and the "structured, not conversational" UX principle. Career strategy should be computed from the intelligence layer with traceable evidence, not generated as open-ended LLM text.

---

## Deliverable 6 — Hybrid Architecture Evaluation

### Current Architecture

```
Browser → Next.js (Frontend + API Routes + Business Logic) → PostgreSQL
                                                           → OpenAI
                                                           → Provider APIs
```

Everything runs in one Next.js application. Business logic lives in `src/server/`. API routes live in `src/app/api/`. Frontend components live in `src/components/`.

### Proposed Future Architecture

```
Browser → Next.js (Frontend + BFF)
              ↓
          API Gateway
              ↓
          FastAPI (Python)
          ├── Candidate Intelligence Service
          ├── Evidence Engine Service
          ├── Fit Analysis Service
          ├── Discovery Service
          ├── Material Generation Service
          ├── Career Planning Service (future)
          └── Career Agents Service (future)
              ↓
          PostgreSQL + Redis (cache)
              ↓
          LLMs (OpenAI, Anthropic, local models)
```

### Benefits

1. **Language flexibility.** Python has a stronger ML/AI ecosystem (LangChain, LlamaIndex, scikit-learn, sentence-transformers). As the product evolves toward Career Intelligence (Stage 3), Python becomes increasingly natural for:
   - Embedding-based similarity search
   - Market data analysis
   - Career trajectory modeling
   - Agent frameworks

2. **Independent scaling.** Each service can scale independently. Discovery can handle burst traffic. Fit Analysis can be parallelized. Material Generation can queue.

3. **Team scaling.** Different engineers can work on different services without merge conflicts in a monolithic codebase.

4. **Technology evolution.** Services can independently adopt new models, new frameworks, or new data stores without affecting the rest of the system.

5. **Cleaner contracts.** API boundaries between services enforce the system contracts documented in SYSTEM_CONTRACTS.md. Currently, contracts exist as documentation but aren't enforced by architecture.

### Disadvantages

1. **Operational complexity.** Multiple services = multiple deployments, multiple monitoring targets, multiple failure modes. For a single developer, this is significant overhead.

2. **Latency.** Every service-to-service call adds network latency. The current architecture has zero-latency function calls between modules.

3. **Data consistency.** Distributed transactions are harder. Currently, a single Prisma transaction can update multiple tables atomically.

4. **Development speed.** Monolith development is faster for a single developer. Adding a feature that touches frontend + API + business logic is one PR, not three services.

5. **Infrastructure cost.** Running multiple services requires more compute, more monitoring, more CI/CD.

6. **Premature for Stage 1.** The current monolith adequately serves a single user. The migration effort would delay Stage 1 completion without improving user-facing functionality.

### Migration Complexity

| Component | Migration Difficulty | Reason |
|-----------|---------------------|--------|
| Discovery Service | **Low** | Already isolated in `src/server/jobDiscovery/`. Clean inputs/outputs. No shared state. |
| Fit Analysis Service | **Medium** | Requires CandidateIntelligence as input. Evidence Engine is tightly coupled to CI generation. |
| Material Generation Service | **Medium** | Requires many inputs (job, profile, resume, evaluation, fit analysis). Would need a rich request payload. |
| Candidate Intelligence Service | **Medium** | Currently generates CI + Evidence Inventory in one flow. Would need to separate the LLM call from the evidence computation. |
| Evidence Engine | **Low** | Deterministic. Well-defined inputs/outputs. Easy to extract. |
| Career Planning Service | **N/A** | Doesn't exist yet. Would be built natively in the new architecture. |
| Career Agents Service | **N/A** | Doesn't exist yet. Python is the natural choice for agent frameworks. |

### Recommended Migration Order

If the hybrid architecture is adopted:

1. **Phase 0 (Stage 1):** Don't migrate. Complete Stage 1 in the monolith. Add a caching layer (Redis).
2. **Phase 1 (Stage 2):** Extract Discovery Service to FastAPI. It's the most isolated subsystem with the cleanest contract. This validates the hybrid approach with minimal risk.
3. **Phase 2 (Stage 2-3):** Extract Fit Analysis + Evidence Engine. These benefit most from Python's ML ecosystem for future embedding-based matching.
4. **Phase 3 (Stage 3):** Build Career Planning and Career Intelligence natively in Python.
5. **Phase 4 (Stage 4):** Extract Material Generation. Build Career Agents in Python.
6. **Phase 5 (Stage 4-5):** Next.js becomes a thin frontend + BFF. All intelligence lives in Python services.

### Alignment with Product Vision

The hybrid architecture **aligns well** with the long-term product vision:

- **VISION.md** describes a system that "manages a person's professional information, opportunities, capabilities, decisions and long-term career evolution." This implies a rich intelligence layer that benefits from Python's data science ecosystem.
- **Stages 3-5** (Career Intelligence, Professional OS, CareerOps) require capabilities like embedding search, trajectory modeling, market analysis, and agent frameworks — all areas where Python excels.
- **The intelligence layer should be language-agnostic.** Whether CI is generated by TypeScript or Python, the output is structured JSON stored in PostgreSQL. The migration can be transparent.

**However:** The migration is premature before Stage 2. The current architecture is adequate for Stage 1. Migrating now would delay feature delivery without improving user outcomes.

### Recommendation

**Stay monolithic through Stage 1 (Sprints 1-6).** Focus on completing the core loop, stabilizing scoring, and making the product usable.

**Begin hybrid migration at Stage 2.** Start with Discovery Service as a proof-of-concept. Use the migration to validate the architecture before extracting heavier services.

**Design for migration now.** Even in the monolith, keep subsystems isolated with clean contracts. The current `src/server/` organization already supports this. Continue enforcing contracts documented in SYSTEM_CONTRACTS.md.

---

## Final Recommendations Before Sprint 1

### Documents to Update (after sprint approval)

| Document | Change Needed | Effort |
|----------|--------------|--------|
| SPEC.md header | Update primary goal to match VISION.md | 1 line |
| SPEC.md §1 | Reframe V1 as Stage 1 of Career OS | 3 lines |
| SPEC.md §8 | Replace with reference to SPRINT_RULES.md | 5 lines |
| SPEC.md §11 | Replace with reference to PRODUCT_PRINCIPLES.md | 5 lines |
| SPRINT_RULES.md §Feature Gates | Update Q1 and Q2 to match VISION.md language | 2 lines |
| ARCHITECTURE.md §Key Decisions #2 | Note single-user is Stage 1 only | 1 line |
| ROADMAP.md | Add VISION.md reference and Stage 1 context | 3 lines |
| ROADMAP.md | Add outcome tracking to Sprint 2 or 4 | 2 lines |

**Total update effort:** ~30 minutes. Should be done at the start of Sprint 1.

### Architectural Priorities for Sprint 1

1. **Run Discovery Audit** — This is blocked for too long. Execute the audit plan from DISCOVERY_AUDIT.md.
2. **Fix DA-2 (double bonus)** — One-line fix with immediate quality improvement.
3. **Add hide/show toggle for Recommended Jobs (KI-007)** — Quick trust fix.
4. **Fix CandidateIntelligencePanel bug (KI-004)** — Likely one-line fix.

### Engineering Observations

1. **VISION.md is a strong document.** It provides clear, specific guidance that disambiguates most product decisions. The 8 product questions and the "not-list" (not a chatbot, not a resume builder) are particularly useful guardrails.

2. **Documentation is now extensive but partially redundant.** SPEC.md, SPRINT_RULES.md, and PRODUCT_PRINCIPLES.md overlap significantly. After Sprint 1, consider consolidating SPEC.md into a shorter "V1 Requirements" document that references the other docs for principles, rules, and architecture.

3. **The intelligence layer concept changes everything.** Before VISION.md, the architecture was feature-centric (discovery, scoring, materials, export). After VISION.md, the architecture should be intelligence-centric. The intelligence layer (CI + Evidence Engine) is the core; everything else is a view or a generator that consumes it. This reframing should guide all future architectural decisions.

4. **Stage 1 is the right focus.** Despite the ambitious 5-stage vision, the current product needs basic reliability before expanding. Discovery quality, score stability, and editable materials are the critical gaps. Complete these before thinking about career strategy or market intelligence.

### OpenAI Cost

**$0.** This sprint was documentation and analysis only.
